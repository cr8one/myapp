import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const announcements = await prisma.announcement.findMany({
    include: { createdBy: { select: { id: true, name: true, email: true } } },
    orderBy: { publishedAt: "desc" },
  })
  return NextResponse.json(announcements)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { title, content, category, publishedAt, expiresAt } = await req.json()
  if (!title || !content || !category || !publishedAt) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }
  if (expiresAt && new Date(expiresAt) < new Date(publishedAt)) {
    return NextResponse.json({ error: "表示終了日は表示開始日以降にしてください" }, { status: 400 })
  }
  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      category,
      publishedAt: new Date(publishedAt),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdById: session.user.id,
    },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  })
  return NextResponse.json(announcement)
}
