import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const departmentId = searchParams.get("departmentId")

  const groups = await prisma.mGroup.findMany({
    where: departmentId ? { department_id: departmentId } : undefined,
    orderBy: { sort_order: "asc" },
    include: {
      department: { select: { id: true, name: true } },
      _count: { select: { users: true } },
    },
  })
  return NextResponse.json(groups)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, department_id, sort_order } = await req.json()
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 })
  if (!department_id) return NextResponse.json({ error: "department_id is required" }, { status: 400 })

  const group = await prisma.mGroup.create({
    data: { name, department_id, sort_order: sort_order ?? 0 },
  })
  return NextResponse.json(group)
}
