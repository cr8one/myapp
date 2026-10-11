import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { buildMainSchedule, dateKeyToDayNumber, type ScheduleSource } from "@/lib/cad/schedule"

const TARGET_STATUSES = ["依頼済", "着手", "保留"]

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
    include: { work_time: true },
  })

  const items: ScheduleSource[] = records.map(r => ({
    id: r.id,
    uid: r.uid,
    title: r.title,
    client: r.client,
    hinmoku: r.hinmoku,
    status: r.status,
    requestAt: requestAtMinutes(r.request_date, r.request_time),
    workMinutes: r.work_time?.standard_minutes ?? null,
    desiredDateKey: r.desired_date ? r.desired_date.toISOString().slice(0, 10) : null,
    desiredTimeKbn: r.desired_time_kbn,
    desiredTime: r.desired_time,
  }))

  const { blocks, unscheduled } = buildMainSchedule(items)
  return NextResponse.json({ blocks, unscheduled })
}