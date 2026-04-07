import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, description, sortOrder } = await req.json()
  if (!name) return NextResponse.json({ error: "種別名は必須です" }, { status: 400 })
  const master = await prisma.devCompanyTypeMaster.update({
    where: { id },
    data: { name, description, sortOrder },
  })
  return NextResponse.json(master)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.devCompanyTypeMaster.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}