import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const formats = await prisma.dlmsFormatMaster.findMany({ orderBy: { name: "asc" } })
  return NextResponse.json(formats)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  const { name, width, height, unit, note } = body
  const format = await prisma.dlmsFormatMaster.create({ data: { name, width, height, unit: unit ?? "mm", note } })
  return NextResponse.json(format)
}
