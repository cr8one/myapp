import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if (body.flg_same_day !== undefined) data.flg_same_day = body.flg_same_day ? 1 : 0
  if (body.end_time !== undefined) data.end_time = body.end_time ? new Date(body.end_time) : null
  if (body.remarks !== undefined) data.remarks = body.remarks

  const updated = await prisma.cadWorkLog.update({
    where: { id },
    data,
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  await prisma.cadWorkLog.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
