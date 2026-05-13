import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category")
  const logs = await prisma.devLog.findMany({
    where: category ? { category } : undefined,
    include: { createdBy: { select: { id: true, name: true, email: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  })
  return NextResponse.json(logs)
}
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { date, title, content, category } = await req.json()
  if (!date || !title || !content || !category) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }
  const log = await prisma.devLog.create({
    data: {
      date: new Date(date),
      title,
      content,
      category,
      createdById: session.user.id,
    },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  })
  return NextResponse.json(log)
}
