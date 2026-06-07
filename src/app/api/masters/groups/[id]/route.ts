import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { name, department_id, sort_order } = await req.json()

  const group = await prisma.mGroup.update({
    where: { id },
    data: { name, department_id, sort_order },
  })
  return NextResponse.json(group)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.mGroup.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
