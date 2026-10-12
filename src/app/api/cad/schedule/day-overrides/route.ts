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

function isPresent(v: unknown): boolean {
  return v !== null && v !== undefined
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  if ((from !== null && isValidDate(from) === false) || (to !== null && isValidDate(to) === false)) {
    return NextResponse.json({ error: "期間の指定が正しくありません" }, { status: 400 })
  }

  const rows = await prisma.cadWorkDayOverride.findMany({
    where: {
      ...(from !== null || to !== null
        ? { date: { ...(from !== null ? { gte: from } : {}), ...(to !== null ? { lte: to } : {}) } }
        : {}),
    },
    orderBy: [{ date: "asc" }, { machine: "asc" }],
  })
  return NextResponse.json(rows)
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  if (typeof body.machine !== "string" || MACHINES.includes(body.machine) === false) {
    return NextResponse.json({ error: "機械の指定が正しくありません" }, { status: 400 })
  }
  if (isValidDate(body.date) === false) {
    return NextResponse.json({ error: "日付が正しくありません" }, { status: 400 })
  }
  const machine: string = body.machine
  const date: string = body.date

  const isOff = body.is_off === true

  let startMin: number | null = null
  let endMin: number | null = null
  let breakStart: number | null = null
  let breakEnd: number | null = null

  if (isOff === false) {
    if (isMinute(body.start_min) === false || isMinute(body.end_min) === false) {
      return NextResponse.json({ error: "始業・終業の時刻が正しくありません" }, { status: 400 })
    }
    const sMin: number = body.start_min
    const eMin: number = body.end_min
    if (sMin >= eMin) {
      return NextResponse.json({ error: "始業は、終業より前にしてください" }, { status: 400 })
    }
    startMin = sMin
    endMin = eMin

    const hasBreakStart = isPresent(body.break_start)
    const hasBreakEnd = isPresent(body.break_end)
    if (hasBreakStart !== hasBreakEnd) {
      return NextResponse.json({ error: "休憩は、開始と終了の両方を入れてください" }, { status: 400 })
    }
    if (hasBreakStart && hasBreakEnd) {
      if (isMinute(body.break_start) === false || isMinute(body.break_end) === false) {
        return NextResponse.json({ error: "休憩の時刻が正しくありません" }, { status: 400 })
      }
      const bStart: number = body.break_start
      const bEnd: number = body.break_end
      if (bStart >= bEnd) {
        return NextResponse.json({ error: "休憩の開始は、終了より前にしてください" }, { status: 400 })
      }
      if (bStart < sMin || bEnd > eMin) {
        return NextResponse.json({ error: "休憩は、始業と終業の間に収めてください" }, { status: 400 })
      }
      breakStart = bStart
      breakEnd = bEnd
    }
  }

  const data = { is_off: isOff, start_min: startMin, end_min: endMin, break_start: breakStart, break_end: breakEnd }
  const saved = await prisma.cadWorkDayOverride.upsert({
    where: { machine_date: { machine, date } },
    create: { machine, date, ...data },
    update: data,
  })
  return NextResponse.json(saved)
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const machine = searchParams.get("machine")
  const date = searchParams.get("date")
  if (machine === null || MACHINES.includes(machine) === false || isValidDate(date) === false) {
    return NextResponse.json({ error: "機械または日付の指定が正しくありません" }, { status: 400 })
  }

  await prisma.cadWorkDayOverride.deleteMany({ where: { machine, date: date as string } })
  return NextResponse.json({ ok: true })
}