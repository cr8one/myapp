import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const body = await req.json()
  const {
    submission_month, usage_month, rendo_tray_cd,
    usage_dept, usage_person_id, usage_person_name,
    planned_qty, item_name,
    lock_flg, approved_flg, irregular_order_flg,
  } = body

  const record = await prisma.trayUsagePlan.update({
    where: { id },
    data: {
      submission_month,
      usage_month,
      rendo_tray_cd,
      usage_dept: usage_dept || null,
      usage_person_id: usage_person_id || null,
      usage_person_name: usage_person_name || null,
      planned_qty: planned_qty ?? 0,
      item_name: item_name || null,
      lock_flg: !!lock_flg,
      approved_flg: !!approved_flg,
      irregular_order_flg: !!irregular_order_flg,
    },
  })
  return NextResponse.json(record)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.trayUsagePlan.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
