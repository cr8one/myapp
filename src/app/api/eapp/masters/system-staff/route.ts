import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const staff = await prisma.mEappSystemStaff.findMany({
    orderBy: { sort_order: "asc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  })
  return NextResponse.json(staff)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { user_id, sort_order } = await req.json()
  if (!user_id) return NextResponse.json({ error: "user_id is required" }, { status: 400 })
  const staff = await prisma.mEappSystemStaff.create({
    data: { user_id, sort_order: sort_order ?? 0 },
    include: { user: { select: { id: true, name: true, email: true } } },
  })
  return NextResponse.json(staff)
}
