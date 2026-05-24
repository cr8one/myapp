import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

function parseDate(str: string): Date | null {
  if (!str) return null
  const m = str.match(/(\d{4})[\/年](\d{1,2})[\/月](\d{1,2})/)
  if (m) return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]))
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const records: string[][] = body.records

  if (!Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ ok: true, count: 0 })
  }

  const allParents = await prisma.dlmsDielineParent.findMany({
    select: { id: true, uid_ntemp: true, children: { select: { id: true, edaban: true } } },
  })
  const parentMap = new Map(allParents.map(p => [p.uid_ntemp, p]))

  const existingRequests = await prisma.dlmsDielineRequest.findMany({
    where: { flg_del: 0 },
    select: { id: true, request_no: true },
  })
  const requestMap = new Map(existingRequests.map(r => [r.request_no, r.id]))

  const lastRequest = await prisma.dlmsDielineRequest.findFirst({
    orderBy: { request_no: "desc" },
    select: { request_no: true },
  })
  let nextNoInt = lastRequest ? parseInt(lastRequest.request_no) + 1 : 1

  let count = 0
  const errors: string[] = []

  for (const row of records) {
    const [
      request_no, uid_ntemp, edaban, shohin_no, seisan_tanto, location,
      use_date_str, use_time, kansei_date_str, kansei_time,
      haichi_kakunin_by, haichi_kakunin, haichi_note, request_note,
    ] = row.map(v => v?.trim() ?? "")

    const parent = parentMap.get(uid_ntemp)
    if (!parent) {
      errors.push(`型番号 "${uid_ntemp}" が見つかりません (No.${request_no || "新規"})`)
      continue
    }

    let childId: string | null = null
    if (edaban) {
      const child = parent.children.find(c => c.edaban === edaban)
      if (!child) {
        errors.push(`枝番 "${edaban}" が型番号 "${uid_ntemp}" に見つかりません`)
        continue
      }
      childId = child.id
    }

    const HAICHI_OPTIONS = ["未手配", "社内作成", "外注手配", "手配不要"]
    const data = {
      parentId: parent.id,
      childId,
      shohin_no: shohin_no || null,
      seisan_tanto: seisan_tanto || null,
      location: location || null,
      use_date: parseDate(use_date_str),
      use_time: use_time || null,
      kansei_date: parseDate(kansei_date_str),
      kansei_time: kansei_time || null,
      haichi_kakunin_by: haichi_kakunin_by || null,
      haichi_kakunin: HAICHI_OPTIONS.includes(haichi_kakunin) ? haichi_kakunin : "未手配",
      haichi_note: haichi_note || null,
      request_note: request_note || null,
      flg_del: 0,
    }

    const existingId = request_no ? requestMap.get(request_no) : undefined

    if (existingId) {
      await prisma.dlmsDielineRequest.update({ where: { id: existingId }, data })
    } else {
      const newNo = request_no || String(nextNoInt++).padStart(5, "0")
      await prisma.dlmsDielineRequest.create({ data: { ...data, request_no: newNo } })
    }
    count++
  }

  return NextResponse.json({ ok: true, count, errors })
}
