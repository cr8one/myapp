import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const company = await prisma.sealSupplyCompany.update({
    where: { id: parseInt(id) },
    data: {
      name: body.name,
      isActive: body.isActive ?? true,
    },
  })
  return NextResponse.json(company)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.sealSupplyCompany.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ success: true })
}
