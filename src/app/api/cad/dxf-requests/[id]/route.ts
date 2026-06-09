import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const record = await prisma.dxfRequest.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(record)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const record = await prisma.dxfRequest.update({
    where: { id },
    data: {
      id_cad: body.id_cad || null,
      request_date: body.request_date,
      request_time: body.request_time,
      desired_date: body.desired_date ? new Date(body.desired_date) : null,
      desired_time: body.desired_time || null,
      purpose: body.purpose || null,
      remarks: body.remarks || null,
      history: body.history || null,
      worker: body.worker || null,
      status: body.status || null,
    },
  })
  return NextResponse.json(record)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.dxfRequest.update({ where: { id }, data: { flg_del: 1 } })
  return NextResponse.json({ ok: true })
}
