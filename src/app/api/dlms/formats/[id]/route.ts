import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await request.json()
  const { name, width, height, unit, note } = body
  const format = await prisma.dlmsFormatMaster.update({ where: { id: Number(id) }, data: { name, width, height, unit, note } })
  return NextResponse.json(format)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.dlmsFormatMaster.delete({ where: { id: Number(id) } })
  return NextResponse.json({ success: true })
}
