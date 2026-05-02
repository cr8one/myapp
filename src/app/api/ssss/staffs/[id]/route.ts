import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const staff = await prisma.sealSupplyStaff.update({
    where: { id: parseInt(id) },
    data: {
      name: body.name,
      isIssuer: body.isIssuer ?? false,
      isSupplier: body.isSupplier ?? false,
      isReceiver: body.isReceiver ?? false,
      isOutsourceReceiver: body.isOutsourceReceiver ?? false,
      isActive: body.isActive ?? true,
    },
  })
  return NextResponse.json(staff)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.sealSupplyStaff.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ success: true })
}
