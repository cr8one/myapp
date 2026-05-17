import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { email, sortOrder, isActive } = await req.json()
  const updated = await prisma.ssssIshiiEmail.update({
    where: { id: parseInt(id) },
    data: {
      ...(email !== undefined && { email: email.trim() }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(isActive !== undefined && { isActive }),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.ssssIshiiEmail.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ ok: true })
}
