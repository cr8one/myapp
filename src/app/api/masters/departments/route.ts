import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const departments = await prisma.mDepartment.findMany({
    orderBy: { sort_order: "asc" },
    include: {
      groups: { orderBy: { sort_order: "asc" } },
      _count: { select: { users: true } },
    },
  })
  return NextResponse.json(departments)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, sort_order } = await req.json()
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 })

  const dept = await prisma.mDepartment.create({
    data: { name, sort_order: sort_order ?? 0 },
  })
  return NextResponse.json(dept)
}
