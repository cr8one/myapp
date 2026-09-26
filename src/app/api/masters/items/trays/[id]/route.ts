import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { name, type, maker, rendo_tray_cd, purchase_evaluation, sort_order } = await req.json()

  const tray = await prisma.mTray.update({
    where: { id },
    data: {
      name,
      type,
      maker,
      rendo_tray_cd: rendo_tray_cd || null,
      purchase_evaluation,
      sort_order,
    },
  })
  return NextResponse.json(tray)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.mTray.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
