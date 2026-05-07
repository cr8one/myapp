import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; childId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { childId } = await params
  const body = await req.json()
  const child = await prisma.dlmsDielineChild.update({
    where: { id: childId },
    data: body,
  })
  return NextResponse.json(child)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; childId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { childId } = await params
  await prisma.dlmsDielineChild.update({
    where: { id: childId },
    data: { flg_del: 1 },
  })
  return NextResponse.json({ ok: true })
}
