import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { step_order, category, position_id, approver_user_id } = await req.json()
  const route = await prisma.mApprovalRoute.update({
    where: { id },
    data: {
      step_order: step_order ?? 0,
      category: category || null,
      position_id: position_id || null,
      approver_user_id: approver_user_id || null,
    },
    include: {
      position: { select: { id: true, name: true } },
      approver: { select: { id: true, name: true, email: true } },
    },
  })
  return NextResponse.json(route)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.mApprovalRoute.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
