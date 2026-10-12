import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

const MACHINES = ["main", "sub"]

function isValidDate(s: unknown): s is string {
  if (typeof s !== "string" || /^\d{4}-\d{2}-\d{2}$/.test(s) === false) return false
  const [y, m, d] = s.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

function isMinute(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 1440
}

type Parsed = {
  machine: string
  valid_from: string
  valid_to: string | null
  start_min: number
  end_min: number
  break_start: number | null
  break_end: number | null
  working_days: string
}

function parseBody(body: Record<string, unknown>): { ok: true; data: Parsed } | { ok: false; error: string } {
  if (typeof body.machine !== "string" || MACHINES.includes(body.machine) === false) {
    return { ok: false, error: "機械の指定が正しくありません" }
  }
  if (isValidDate(body.valid_from) === false) return { ok: false, error: "適用開始日が正しくありません" }
  const validFrom = body.valid_from as string

  let validTo: string | null = null
  if (body.valid_to !== null && body.valid_to !== undefined && body.valid_to !== "") {
    if (isValidDate(body.valid_to) === false) return { ok: false, error: "適用終了日が正しくありません" }
    validTo = body.valid_to as string
    if (validTo < validFrom) return { ok: false, error: "適用終了日は、適用開始日以降にしてください" }
  }

  if (isMinute(body.start_min) === false || isMinute(body.end_min) === false) {
    return { ok: false, error: "始業・終業の時刻が正しくありません" }
  }
  const startMin = body.start_min as number
  const endMin = body.end_min as number
  if (startMin >= endMin) return { ok: false, error: "始業は、終業より前にしてください" }

  const hasBreakStart = body.break_start !== null && body.break_start !== undefined
  const hasBreakEnd = body.break_end !== null && body.break_end !== undefined
  let breakStart: number | null = null
  let breakEnd: number | null = null
  if (hasBreakStart !== hasBreakEnd) return { ok: false, error: "休憩は、開始と終了の両方を入れてください" }
  if (hasBreakStart && hasBreakEnd) {
    if (isMinute(body.break_start) === false || isMinute(body.break_end) === false) {
      return { ok: false, error: "休憩の時刻が正しくありません" }
    }
    breakStart = body.break_start as number
    breakEnd = body.break_end as number
    if (breakStart >= breakEnd) return { ok: false, error: "休憩の開始は、終了より前にしてください" }
    if (breakStart < startMin || breakEnd > endMin) return { ok: false, error: "休憩は、始業と終業の間に収めてください" }
  }

  if (typeof body.working_days !== "string" || /^[01]{7}$/.test(body.working_days) === false) {
    return { ok: false, error: "稼働する曜日の指定が正しくありません" }
  }

  return {
    ok: true,
    data: {
      machine: body.machine,
      valid_from: validFrom,
      valid_to: validTo,
      start_min: startMin,
      end_min: endMin,
      break_start: breakStart,
      break_end: breakEnd,
      working_days: body.working_days,
    },
  }
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rules = await prisma.cadWorkRule.findMany({
    orderBy: [{ machine: "asc" }, { valid_from: "asc" }],
  })
  return NextResponse.json(rules)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = parseBody(await req.json())
  if (parsed.ok === false) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const rule = await prisma.cadWorkRule.create({ data: parsed.data })
  return NextResponse.json(rule)
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  if (typeof body.id !== "string" || body.id === "") {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }
  const parsed = parseBody(body)
  if (parsed.ok === false) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const exists = await prisma.cadWorkRule.findUnique({ where: { id: body.id } })
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const rule = await prisma.cadWorkRule.update({ where: { id: body.id }, data: parsed.data })
  return NextResponse.json(rule)
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

  await prisma.cadWorkRule.deleteMany({ where: { id } })
  return NextResponse.json({ ok: true })
}