import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword")
  const records = await prisma.vendor.findMany({
    where: keyword ? { name: { contains: keyword } } : undefined,
    orderBy: { id: "asc" },
  })
  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name } = await req.json()
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 })
  const record = await prisma.vendor.create({ data: { name } })
  return NextResponse.json(record)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, name, flgDel } = await req.json()
  const record = await prisma.vendor.update({
    where: { id: parseInt(id) },
    data: { name, flgDel: flgDel ?? false },
  })
  return NextResponse.json(record)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  await prisma.vendor.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ ok: true })
}
