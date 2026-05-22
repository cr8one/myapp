import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const parent = await prisma.dlmsDielineParent.findUnique({
    where: { id },
    include: {
      conditions: { orderBy: { sortOrder: "asc" } },
      children: {
        where: { flg_del: 0 },
        orderBy: { edaban: "asc" },
        include: {
          requests: {
            where: { flg_del: 0 },
            select: { id: true, request_no: true, haichi_kakunin: true, dtindt: true },
          },
        },
      },
    },
  })
  if (!parent) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(parent)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { conditions, ...parentData } = body

  await prisma.dlmsDielineCondition.deleteMany({ where: { parentId: id } })

  const parent = await prisma.dlmsDielineParent.update({
    where: { id },
    data: {
      ...parentData,
      conditions: {
        create: (conditions ?? []).map((v: string, i: number) => ({ value: v, sortOrder: i })),
      },
    },
    include: {
      conditions: { orderBy: { sortOrder: "asc" } },
      children: { where: { flg_del: 0 }, orderBy: { edaban: "asc" } },
    },
  })
  return NextResponse.json(parent)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.dlmsDielineParent.update({
    where: { id },
    data: { flg_del: 1 },
  })
  return NextResponse.json({ ok: true })
}
