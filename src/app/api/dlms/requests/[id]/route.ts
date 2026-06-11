import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const request = await prisma.dlmsDielineRequest.findUnique({
    where: { id },
    include: {
      parent: { select: { uid_ntemp: true, genre: true, spec: true, hinmoku: true, parts: { orderBy: { sort_order: "asc" } } } },
      child: { select: { edaban: true, han: true, me: true, kiri: true, men: true, sizey: true, sizex: true, 咥え: true } },
    },
  })
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(request)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const request = await prisma.dlmsDielineRequest.update({
    where: { id },
    data: {
      ...body,
      use_date: body.use_date ? new Date(body.use_date) : null,
      kansei_date: body.kansei_date ? new Date(body.kansei_date) : null,
    },
    include: {
      parent: { select: { uid_ntemp: true, genre: true, spec: true, hinmoku: true } },
      child: { select: { edaban: true, han: true, me: true, kiri: true, men: true } },
    },
  })
  return NextResponse.json(request)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.dlmsDielineRequest.update({ where: { id }, data: { flg_del: 1 } })
  return NextResponse.json({ ok: true })
}
