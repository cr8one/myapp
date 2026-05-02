import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const part = await prisma.sealSupplyPartMaster.update({
    where: { id: parseInt(id) },
    data: {
      name: body.name,
      sortOrder: body.sortOrder ?? 0,
      isActive: body.isActive ?? true,
    },
  })
  return NextResponse.json(part)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.sealSupplyPartMaster.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ success: true })
}
