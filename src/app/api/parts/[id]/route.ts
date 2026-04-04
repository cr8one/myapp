import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { code, name, note } = await req.json()
  const part = await prisma.part.update({
    where: { id },
    data: { code, name, note }
  })
  return NextResponse.json(part)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.part.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
