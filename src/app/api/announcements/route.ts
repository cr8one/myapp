import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
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
  const { title, content, category, publishedAt } = await req.json()
  if (!title || !content || !category || !publishedAt) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }
  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      category,
      publishedAt: new Date(publishedAt),
      createdById: session.user.id,
    },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  })
  return NextResponse.json(announcement)
}
