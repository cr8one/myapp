import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params
  const { title, content, category, publishedAt } = await req.json()
  const announcement = await prisma.announcement.update({
    where: { id },
    data: { title, content, category, publishedAt: new Date(publishedAt) },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  })
  return NextResponse.json(announcement)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params
  await prisma.announcement.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
