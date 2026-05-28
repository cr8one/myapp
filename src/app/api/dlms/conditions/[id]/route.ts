import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { name, sortOrder } = await req.json()
  const condition = await prisma.dlmsConditionMaster.update({
    where: { id: parseInt(id) },
    data: { name, ...(sortOrder !== undefined ? { sortOrder: parseInt(sortOrder) } : {}) },
  })
  return NextResponse.json(condition)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.dlmsConditionMaster.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ ok: true })
}
