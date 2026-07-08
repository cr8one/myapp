import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { email, sort_order } = await req.json()
  const recipient = await prisma.mCadMailRecipient.update({
    where: { id },
    data: { email, sort_order },
  })
  return NextResponse.json(recipient)
}
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.mCadMailRecipient.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
