import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const record = await prisma.cadRequest.findUnique({
    where: { id },
    include: { requester: { select: { id: true, name: true, department: true } } },
  })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(record)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const record = await prisma.cadRequest.update({
    where: { id },
    data: {
      ...body,
      request_date: new Date(body.request_date),
      desired_date: body.desired_date ? new Date(body.desired_date) : null,
      updated_at: new Date(),
    },
    include: { requester: { select: { id: true, name: true, department: true } } },
  })
  return NextResponse.json(record)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.cadRequest.update({
    where: { id },
    data: { flg_del: 1, updated_at: new Date() },
  })
  return NextResponse.json({ ok: true })
}
