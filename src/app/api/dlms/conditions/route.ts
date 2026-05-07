import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  const conditions = await prisma.dlmsConditionMaster.findMany({
    orderBy: { sortOrder: "asc" },
  })
  return NextResponse.json(conditions)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name } = await req.json()
  if (!name) return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  const last = await prisma.dlmsConditionMaster.findFirst({ orderBy: { sortOrder: "desc" } })
  const condition = await prisma.dlmsConditionMaster.create({
    data: { name, sortOrder: (last?.sortOrder ?? 0) + 1 },
  })
  return NextResponse.json(condition)
}
