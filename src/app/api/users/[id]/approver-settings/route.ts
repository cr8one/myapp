import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const settings = await prisma.userApproverSetting.findMany({
    where: { user_id: id },
    orderBy: { step_order: "asc" },
    include: {
      position: { select: { id: true, name: true } },
      approver: { select: { id: true, name: true, email: true } },
    },
  })
  return NextResponse.json(settings)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { step_order, position_id, approver_user_id } = await req.json()
  const setting = await prisma.userApproverSetting.create({
    data: {
      user_id: id,
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
