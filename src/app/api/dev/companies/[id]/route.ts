import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, nameKana, industry, contactName, contactEmail, contactPhone, notes } = await req.json()
  const company = await prisma.devCompany.update({
    where: { id },
    data: { name, nameKana, industry, contactName, contactEmail, contactPhone, notes },
  })
  return NextResponse.json(company)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.devCompany.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
