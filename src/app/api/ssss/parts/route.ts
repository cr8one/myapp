import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const all = searchParams.get("all") === "1"

  const parts = await prisma.sealSupplyPartMaster.findMany({
    where: all ? {} : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })
  return NextResponse.json(parts)
}

export async function POST(request: Request) {
  const body = await request.json()
  const part = await prisma.sealSupplyPartMaster.create({
    data: {
      name: body.name,
      sortOrder: body.sortOrder ?? 0,
      isActive: body.isActive ?? true,
    },
  })
  return NextResponse.json(part, { status: 201 })
}
