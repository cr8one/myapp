import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await request.json()
  const { name, content, fontSize, color, fontWeight } = body
  const note = await prisma.dlmsNoteMaster.update({ where: { id: Number(id) }, data: { name, content, fontSize, color, fontWeight } })
  return NextResponse.json(note)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.dlmsNoteMaster.delete({ where: { id: Number(id) } })
  return NextResponse.json({ success: true })
}
