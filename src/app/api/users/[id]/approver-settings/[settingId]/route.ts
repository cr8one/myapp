import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { requireAdmin } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; settingId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const denied = await requireAdmin()
  if (denied) return denied
  const { settingId } = await params
  const { step_order, position_id, approver_user_id, min_amount } = await req.json()
  // 申請の金額が、この金額以上のときだけ、このステップを通す（経理精算の金額ごとの承認者用）。0は、金額に関係なく通す
  const minAmount = Number.isInteger(Number(min_amount)) && Number(min_amount) >= 0 && Number(min_amount) <= 99999999 ? Number(min_amount) : 0
  const setting = await prisma.userApproverSetting.update({
    where: { id: settingId },
    data: {
      step_order: step_order ?? 0,
      position_id: position_id || null,
      approver_user_id: approver_user_id || null,
      min_amount: minAmount,
    },
    include: {
      position: { select: { id: true, name: true } },
      approver: { select: { id: true, name: true, email: true } },
    },
  })
  return NextResponse.json(setting)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; settingId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const denied = await requireAdmin()
  if (denied) return denied
  const { settingId } = await params
  await prisma.userApproverSetting.delete({ where: { id: settingId } })
  return NextResponse.json({ ok: true })
}
