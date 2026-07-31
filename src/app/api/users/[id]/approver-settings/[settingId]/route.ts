import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; settingId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { settingId } = await params
  const { step_order, position_id, approver_user_id } = await req.json()
  const setting = await prisma.userApproverSetting.update({
    where: { id: settingId },
    data: {
      step_order: step_order ?? 0,
      position_id: position_id || null,
      approver_user_id: approver_user_id || null,
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
  const { settingId } = await params
  await prisma.userApproverSetting.delete({ where: { id: settingId } })
  return NextResponse.json({ ok: true })
}
