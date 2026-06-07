import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const dept = await prisma.mDepartment.findUnique({
    where: { id },
    include: {
      base: { select: { id: true, name: true } },
      groups: {
        orderBy: { sort_order: "asc" },
        include: { base: { select: { id: true, name: true } } },
      },
      users: {
        include: {
          user: { select: { id: true, name: true, email: true, position: true } },
        },
      },
    },
  })
  if (!dept) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(dept)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { name, sort_order, base_id } = await req.json()

  const dept = await prisma.mDepartment.update({
    where: { id },
    data: { name, sort_order, base_id: base_id || null },
  })
  return NextResponse.json(dept)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.mDepartment.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
