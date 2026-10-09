import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import * as XLSX from "xlsx"

export const maxDuration = 60

const s3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})

const CHUNK = 100

function toText(v: unknown): string {
  if (v === null || v === undefined) return ""
  return String(v).trim()
}

function toMonth(v: unknown): string {
  const digits = toText(v).replace(/\D/g, "")
  return digits.length === 6 ? digits : ""
}

function toBool(v: unknown): boolean {
  const s = toText(v).toLowerCase()
  return ["1", "true", "yes", "○", "〇"].includes(s)
}

function toQty(v: unknown): number {
  const n = parseInt(toText(v).replace(/,/g, ""), 10)
  return Number.isNaN(n) ? 0 : n
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { key, offset } = await req.json()

  const obj = await s3.send(new GetObjectCommand({
    Bucket: "japan-sleeve-system-files-936533876784",
    Key: key,
  }))
  const buf = await obj.Body!.transformToByteArray()
  const wb = XLSX.read(buf, { type: "array" })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: null })
  const total = rows.length

  const chunk = rows.slice(offset, offset + CHUNK)

  const users = await prisma.user.findMany({ select: { id: true, name: true } })
  const userIdByName = new Map<string, string>()
  for (const u of users) {
    if (u.name && !userIdByName.has(u.name)) userIdByName.set(u.name, u.id)
  }

  // 発注書の管理No.→ID（移行時は、IDではなく管理No.で紐づける）
  const orders = await prisma.trayIrregularOrder.findMany({ select: { id: true, order_no: true } })
  const orderIdByNo = new Map(orders.map(o => [o.order_no, o.id]))

  let created = 0
  let updated = 0
  let skipped = 0

  for (const row of chunk) {
    const submission_month = toMonth(row["提出年月"])
    const usage_month = toMonth(row["使用予定年月"])
    const rendo_tray_cd = toText(row["連動トレイコード"])
    if (!submission_month || !usage_month || !rendo_tray_cd) {
      skipped++
      continue
    }

    // 発注書管理No.：列がない古いファイルでは紐づきに触れない。空欄は紐づきを外す。見つからない行はスキップ
    let irregularOrderLink: { irregular_order_id: string | null } | Record<string, never> = {}
    if ("発注書管理No." in row) {
      const orderNo = toText(row["発注書管理No."])
      if (orderNo === "") {
        irregularOrderLink = { irregular_order_id: null }
      } else {
        const orderId = orderIdByNo.get(orderNo)
        if (!orderId) { skipped++; continue }
        irregularOrderLink = { irregular_order_id: orderId }
      }
    }

    const personName = toText(row["使用予定者"])
    const data = {
      submission_month,
      usage_month,
      rendo_tray_cd,
      item_name: toText(row["品名"]) || null,
      usage_dept: toText(row["使用予定部署"]) || null,
      ...("使用予定グループ" in row ? { usage_group: toText(row["使用予定グループ"]) || null } : {}),
      usage_person_name: personName || null,
      usage_person_id: personName ? (userIdByName.get(personName) ?? null) : null,
      planned_qty: toQty(row["使用予定数"]),
      lock_flg: toBool(row["ロック"]),
      temp_lock_flg: toBool(row["仮ロック"]),
      approved_flg: toBool(row["上長承認"]),
      irregular_order_flg: toBool(row["イレギュラー発注"]),
      ...irregularOrderLink,
    }

    const id = toText(row["ID"])
    const existing = id ? await prisma.trayUsagePlan.findUnique({ where: { id } }) : null
    if (existing) {
      await prisma.trayUsagePlan.update({ where: { id }, data })
      updated++
    } else {
      await prisma.trayUsagePlan.create({ data })
      created++
    }
  }

  const newOffset = offset + chunk.length
  const done = newOffset >= total

  return NextResponse.json({ ok: true, created, updated, skipped, total, offset: newOffset, done })
}
