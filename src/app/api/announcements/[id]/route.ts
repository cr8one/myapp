import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params
  const { title, content, category, publishedAt, expiresAt } = await req.json()
  if (expiresAt && new Date(expiresAt) < new Date(publishedAt)) {
    return NextResponse.json({ error: "表示終了日は表示開始日以降にしてください" }, { status: 400 })
  }
  const announcement = await prisma.announcement.update({
    where: { id },
    data: {
      title,
      content,
      category,
      publishedAt: new Date(publishedAt),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
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
