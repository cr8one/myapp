import { NextResponse } from "next/server"
import { PrismaClient } from "@/generated/prisma"

const prisma = new PrismaClient()

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { name, nameKana, industry, contactName, contactEmail, contactPhone, notes } = await req.json()
  const company = await prisma.devCompany.update({
    where: { id: params.id },
    data: { name, nameKana, industry, contactName, contactEmail, contactPhone, notes },
  })
  return NextResponse.json(company)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.devCompany.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
