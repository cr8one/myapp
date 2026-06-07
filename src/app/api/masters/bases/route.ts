import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const bases = await prisma.mBase.findMany({
    orderBy: { sort_order: "asc" },
    include: {
      _count: { select: { departments: true, groups: true } },
    },
  })
  return NextResponse.json(bases)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, sort_order } = await req.json()
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 })

  const base = await prisma.mBase.create({
    data: { name, sort_order: sort_order ?? 0 },
  })
  return NextResponse.json(base)
}
