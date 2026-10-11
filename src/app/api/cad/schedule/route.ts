import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import {
  buildMainSchedule,
  dateKeyToDayNumber,
  type ScheduleBlock,
  type ScheduleSource,
} from "@/lib/cad/schedule"

const TARGET_STATUSES = ["依頼済", "着手", "保留"]
const MACHINES = ["main", "sub"]

function requestAtMinutes(requestDate: Date, requestTime: string): number {
  const dateKey = requestDate.toISOString().slice(0, 10)
  const m = /^(\d{1,2}):(\d{2})$/.exec(requestTime ?? "")
  const minutes = m ? Number(m[1]) * 60 + Number(m[2]) : 0
  return dateKeyToDayNumber(dateKey) * 24 * 60 + minutes
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const records = await prisma.cadRequest.findMany({
    where: { flg_del: 0, status: { in: TARGET_STATUSES } },
    include: { work_time: true, schedule_placement: true },
  })

  const manualBlocks: ScheduleBlock[] = []
  const autoItems: ScheduleSource[] = []

  for (const r of records) {
    const workMinutes = r.work_time?.standard_minutes ?? null
    const placement = r.schedule_placement

    if (placement && workMinutes !== null) {
      manualBlocks.push({
        id: r.id,
        uid: r.uid,
        title: r.title,
        client: r.client,
        hinmoku: r.hinmoku,
        status: r.status,
        workMinutes,
        startAbs: placement.start_abs,
        endAbs: placement.start_abs + workMinutes,
        machine: placement.machine === "sub" ? "sub" : "main",
        manual: true,
      })
      continue
    }

    autoItems.push({
      id: r.id,
      uid: r.uid,
      title: r.title,
      client: r.client,
      hinmoku: r.hinmoku,
      status: r.status,
      requestAt: requestAtMinutes(r.request_date, r.request_time),
      workMinutes,
      desiredDateKey: r.desired_date ? r.desired_date.toISOString().slice(0, 10) : null,
      desiredTimeKbn: r.desired_time_kbn,
      desiredTime: r.desired_time,
    })
  }

  const { blocks: autoBlocks, unscheduled } = buildMainSchedule(autoItems)
  return NextResponse.json({ blocks: [...autoBlocks, ...manualBlocks], unscheduled })
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const requestId = body.request_id
  const machine = body.machine
  const startAbs = body.start_abs

  if (typeof requestId !== "string" || requestId === "") {
    return NextResponse.json({ error: "request_id is required" }, { status: 400 })
  }
  if (typeof machine !== "string" || MACHINES.includes(machine) === false) {
    return NextResponse.json({ error: "機械の指定が正しくありません" }, { status: 400 })
  }
  if (typeof startAbs !== "number" || Number.isInteger(startAbs) === false || startAbs < 0 || startAbs > 2000000000) {
    return NextResponse.json({ error: "開始時刻の指定が正しくありません" }, { status: 400 })
  }

  const record = await prisma.cadRequest.findUnique({
    where: { id: requestId },
    include: { work_time: true },
  })
  if (!record || record.flg_del !== 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (TARGET_STATUSES.includes(record.status) === false) {
    return NextResponse.json({ error: `${record.status}の依頼書は予定に置けません` }, { status: 400 })
  }
  if (record.work_time?.standard_minutes === null || record.work_time?.standard_minutes === undefined) {
    return NextResponse.json({ error: "作業標準時間が未入力のため置けません" }, { status: 400 })
  }

  const saved = await prisma.cadSchedulePlacement.upsert({
    where: { request_id: requestId },
    create: { request_id: requestId, machine, start_abs: startAbs },
    update: { machine, start_abs: startAbs },
  })
  return NextResponse.json({ request_id: saved.request_id, machine: saved.machine, start_abs: saved.start_abs })
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const requestId = searchParams.get("request_id")
  if (!requestId) return NextResponse.json({ error: "request_id is required" }, { status: 400 })

  await prisma.cadSchedulePlacement.deleteMany({ where: { request_id: requestId } })
  return NextResponse.json({ ok: true })
}