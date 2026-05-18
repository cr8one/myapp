import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const drawing = await prisma.drawing.findUnique({
    where: { id: parseInt(id) },
    include: {
      dieline: { select: { id: true, uid_ntemp: true, kyugataban: true } },
    },
  })
  if (!drawing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(drawing)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const drawing = await prisma.drawing.update({
    where: { id: parseInt(id) },
    data: body,
  })
  return NextResponse.json(drawing)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.drawing.update({
    where: { id: parseInt(id) },
    data: { flg_del: true },
  })
  return NextResponse.json({ ok: true })
}
