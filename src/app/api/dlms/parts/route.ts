import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const parts = await prisma.dlmsPartMaster.findMany({ orderBy: { name: "asc" } })
  return NextResponse.json(parts)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  const { name, width, height, shape, note } = body
  const part = await prisma.dlmsPartMaster.create({ data: { name, width, height, shape: shape ?? "rect", note } })
  return NextResponse.json(part)
}
