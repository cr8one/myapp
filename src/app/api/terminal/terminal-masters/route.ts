import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category")
  const records = await prisma.terminalMaster.findMany({
    where: {
      ...(category ? { category } : {}),
      flgDel: false,
    },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
  })
  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { category, value, sortOrder } = await req.json()
  if (!category || !value) return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  const record = await prisma.terminalMaster.create({
    data: { category, value, sortOrder: sortOrder ? parseInt(sortOrder) : 0 },
  })
  return NextResponse.json(record)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, category, value, sortOrder, flgDel } = await req.json()
  const record = await prisma.terminalMaster.update({
    where: { id: parseInt(id) },
    data: { category, value, sortOrder: sortOrder ? parseInt(sortOrder) : 0, flgDel: flgDel ?? false },
  })
  return NextResponse.json(record)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  await prisma.terminalMaster.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ ok: true })
}
