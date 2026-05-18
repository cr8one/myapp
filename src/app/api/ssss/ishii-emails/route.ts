import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const emails = await prisma.ssssIshiiEmail.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  })
  return NextResponse.json(emails)
}

export async function POST(req: Request) {
  const { email, sortOrder } = await req.json()
  if (!email?.trim()) return NextResponse.json({ error: "email required" }, { status: 400 })
  const created = await prisma.ssssIshiiEmail.create({
    data: { email: email.trim(), sortOrder: sortOrder ?? 0 },
  })
  return NextResponse.json(created)
}
