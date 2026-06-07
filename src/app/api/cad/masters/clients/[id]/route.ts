import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { name, short_name, sort_order } = await req.json()
  const client = await prisma.mCadClient.update({
    where: { id },
    data: { name, short_name: short_name || null, sort_order },
  })
  return NextResponse.json(client)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.mCadClient.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
