import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/permissions"
import { readXlsxWorkbook } from "@/lib/xlsx-io"

export const maxDuration = 60

const STATUSES = ["作成中", "承認依頼中", "承認済"]

function toText(v: unknown): string {
  if (v === null || v === undefined) return ""
  return String(v).trim()
}

// 管理No.：数字だけなら5桁に揃える（Excelで先頭のゼロが落ちた場合の救済）
function toOrderNo(v: unknown): string {
  const s = toText(v)
  return /^\d+$/.test(s) && s.length < 5 ? s.padStart(5, "0") : s
}

// 依頼日：日本時間の0時として保存する。Excelの日付、2026/09/07、2026-09-07 に対応
function toRequestDate(v: unknown): Date | null {
  let y: number
  let m: number
  let d: number
  if (v instanceof Date) {
    const t = new Date(v.getTime() + 12 * 60 * 60 * 1000)
    y = t.getUTCFullYear()
    m = t.getUTCMonth() + 1
    d = t.getUTCDate()
  } else {
    const match = toText(v).match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/)
    if (!match) return null
    y = Number(match[1])
    m = Number(match[2])
    d = Number(match[3])
  }
  const result = new Date(Date.UTC(y, m - 1, d) - 9 * 60 * 60 * 1000)
  const jst = new Date(result.getTime() + 9 * 60 * 60 * 1000)
  if (jst.getUTCFullYear() !== y || jst.getUTCMonth() + 1 !== m || jst.getUTCDate() !== d) return null
  return result
}

// 現行システムからの移行用：イレギュラートレイ発注書（本体のみ）の取り込み
export async function POST(req: NextRequest) {
  const denied = await requirePermission("trayEdit")
  if (denied) return denied

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "ファイルがありません" }, { status: 400 })

  const sheets = readXlsxWorkbook(Buffer.from(await file.arrayBuffer()))
  const rows = sheets[Object.keys(sheets)[0]] ?? []
  if (rows.length === 0) return NextResponse.json({ error: "データがありません" }, { status: 400 })

  const users = await prisma.user.findMany({ select: { id: true, name: true } })
  const userIdByName = new Map<string, string>()
  for (const u of users) {
    if (u.name && !userIdByName.has(u.name)) userIdByName.set(u.name, u.id)
  }

  let created = 0
  let updated = 0
  let skipped = 0
  const errors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const line = i + 2 // 見出し行が1行目
    const order_no = toOrderNo(row["管理No."])
    const status = toText(row["ステータス"])
    const request_date = toRequestDate(row["依頼日"])
    const title = toText(row["タイトル"])
    const requesterName = toText(row["申請者"])

    if (!order_no) { skipped++; errors.push(`${line}行目：管理No.がありません`); continue }
    if (!STATUSES.includes(status)) {
      skipped++
      errors.push(`${line}行目（${order_no}）：ステータスは「作成中」「承認依頼中」「承認済」のいずれかにしてください（${status || "空欄"}）`)
      continue
    }
    if (!request_date) { skipped++; errors.push(`${line}行目（${order_no}）：依頼日を読み取れません（${toText(row["依頼日"]) || "空欄"}）`); continue }
    if (!title) { skipped++; errors.push(`${line}行目（${order_no}）：タイトルがありません`); continue }

    const data = {
      status,
      request_date,
      title,
      requester_name: requesterName,
      requester_id: requesterName ? (userIdByName.get(requesterName) ?? null) : null,
    }

    try {
      const existing = await prisma.trayIrregularOrder.findUnique({ where: { order_no } })
      if (existing) {
        await prisma.trayIrregularOrder.update({ where: { order_no }, data })
        updated++
      } else {
        await prisma.trayIrregularOrder.create({ data: { order_no, ...data } })
        created++
      }
    } catch {
      skipped++
      errors.push(`${line}行目（${order_no}）：保存に失敗しました`)
    }
  }

  return NextResponse.json({
    ok: true,
    created,
    updated,
    skipped,
    total: rows.length,
    errors: errors.slice(0, 20),
    errorCount: errors.length,
  })
}
