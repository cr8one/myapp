import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { category, value, sort_order } = await req.json()
  const option = await prisma.mCadOption.update({
    where: { id },
    data: { category, value, sort_order },
  })
  return NextResponse.json(option)
}
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.mCadOption.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
