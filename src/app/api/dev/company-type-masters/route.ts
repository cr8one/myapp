import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const masters = await prisma.devCompanyTypeMaster.findMany({
    orderBy: { sortOrder: "asc" },
  })
  return NextResponse.json(masters)
}

export async function POST(req: Request) {
  const { name, description, sortOrder } = await req.json()
  if (!name) return NextResponse.json({ error: "種別名は必須です" }, { status: 400 })
  const master = await prisma.devCompanyTypeMaster.create({
    data: { name, description, sortOrder: sortOrder ?? 0 },
  })
  return NextResponse.json(master)
}