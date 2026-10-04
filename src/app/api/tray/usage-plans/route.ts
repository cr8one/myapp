import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const submissionMonth = searchParams.get("submission_month")
  const usageMonth = searchParams.get("usage_month")

  const records = await prisma.trayUsagePlan.findMany({
    where: {
      ...(submissionMonth ? { submission_month: submissionMonth } : {}),
      ...(usageMonth ? { usage_month: usageMonth } : {}),
    },
    orderBy: [{ usage_month: "asc" }, { rendo_tray_cd: "asc" }],
  })
  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const {
    submission_month, usage_month, rendo_tray_cd,
    usage_dept, usage_group, usage_person_id, usage_person_name,
    planned_qty, item_name,
    lock_flg, temp_lock_flg, approved_flg, irregular_order_flg,
  } = body

  if (!submission_month || !usage_month || !rendo_tray_cd) {
    return NextResponse.json({ error: "submission_month, usage_month, rendo_tray_cd are required" }, { status: 400 })
  }

  const record = await prisma.trayUsagePlan.create({
    data: {
      submission_month,
      usage_month,
      rendo_tray_cd,
      usage_dept: usage_dept || null,
      usage_group: usage_group || null,
      usage_person_id: usage_person_id || null,
      usage_person_name: usage_person_name || null,
      planned_qty: planned_qty ?? 0,
      item_name: item_name || null,
      lock_flg: !!lock_flg,
      temp_lock_flg: !!temp_lock_flg,
      approved_flg: !!approved_flg,
      irregular_order_flg: !!irregular_order_flg,
    },
  })
  return NextResponse.json(record)
}
