import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const notes = await prisma.dlmsNoteMaster.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
  })
  return NextResponse.json(notes)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name, content, fontSize, color, fontWeight, sortOrder } = await request.json()
  const note = await prisma.dlmsNoteMaster.create({
    data: { name, content, fontSize: fontSize ?? 12, color: color ?? "#1a1a1a", fontWeight: fontWeight ?? "normal", sortOrder: sortOrder ?? 0 }
  })
  return NextResponse.json(note)
}
