import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { name, width, height, shape, note, sortOrder } = await request.json()
  const part = await prisma.dlmsPartMaster.update({
    where: { id: Number(id) },
    data: { name, width, height, shape, note, sortOrder: sortOrder ?? 0 }
  })
  return NextResponse.json(part)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.dlmsPartMaster.delete({ where: { id: Number(id) } })
  return NextResponse.json({ success: true })
}
