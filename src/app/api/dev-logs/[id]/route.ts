import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const { date, title, content, category } = await req.json()

  const log = await prisma.devLog.update({
    where: { id },
    data: {
      date: new Date(date),
      title,
      content,
      category,
    },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json(log)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  await prisma.devLog.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
