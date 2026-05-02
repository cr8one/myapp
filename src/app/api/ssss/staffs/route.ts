import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const role = searchParams.get("role")

  const where: Record<string, unknown> = { isActive: true }
  if (role === "issuer") where.isIssuer = true
  if (role === "supplier") where.isSupplier = true
  if (role === "receiver") where.isReceiver = true
  if (role === "outsourceReceiver") where.isOutsourceReceiver = true

  const staffs = await prisma.sealSupplyStaff.findMany({
    where,
    orderBy: { name: "asc" },
  })
  return NextResponse.json(staffs)
}

export async function POST(request: Request) {
  const body = await request.json()
  const staff = await prisma.sealSupplyStaff.create({
    data: {
      name: body.name,
      isIssuer: body.isIssuer ?? false,
      isSupplier: body.isSupplier ?? false,
      isReceiver: body.isReceiver ?? false,
      isOutsourceReceiver: body.isOutsourceReceiver ?? false,
      isActive: body.isActive ?? true,
    },
  })
  return NextResponse.json(staff, { status: 201 })
}
