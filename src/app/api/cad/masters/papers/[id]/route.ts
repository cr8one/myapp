import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { name, width, height, sort_order } = await req.json()
  const paper = await prisma.mCadPaper.update({
    where: { id },
    data: { name, width: width || null, height: height || null, sort_order },
  })
  return NextResponse.json(paper)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.mCadPaper.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
