import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const parts = await prisma.dlmsPartMaster.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
  })
  return NextResponse.json(parts)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name, width, height, shape, note, sortOrder } = await request.json()
  const part = await prisma.dlmsPartMaster.create({
    data: { name, width, height, shape: shape ?? "rect", note, sortOrder: sortOrder ?? 0 }
  })
  return NextResponse.json(part)
}
