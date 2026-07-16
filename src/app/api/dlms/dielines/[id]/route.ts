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
      parts: { orderBy: { sort_order: "asc" } },
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
  const { conditions, parts, ...parentData } = body

  await prisma.dlmsDielineCondition.deleteMany({ where: { parentId: id } })

  // partsの更新（全削除→再作成）
  if (parts !== undefined) {
    await prisma.dlmsDielinePart.deleteMany({ where: { parentId: id } })
  }

  const parent = await prisma.dlmsDielineParent.update({
    where: { id },
    data: {
      ...parentData,
      conditions: {
        create: (conditions ?? []).map((v: string, i: number) => ({ value: v, sortOrder: i })),
      },
      parts: parts ? {
        create: parts.map((p: Record<string, unknown>, i: number) => ({
          part_name: p.part_name || null,
          developy: p.developy ? parseFloat(p.developy as string) : null,
          developx: p.developx ? parseFloat(p.developx as string) : null,
          develop_depths: Array.isArray(p.develop_depths) ? (p.develop_depths as string[]).map(v => parseFloat(v)).filter(v => !isNaN(v)) : [],
          sizey: p.sizey ? parseFloat(p.sizey as string) : null,
          sizex: p.sizex ? parseFloat(p.sizex as string) : null,
          widthy: p.widthy ? parseFloat(p.widthy as string) : null,
          inner_height: p.inner_height ? parseFloat(p.inner_height as string) : null,
          inner_width: p.inner_width ? parseFloat(p.inner_width as string) : null,
          inner_depth: p.inner_depth ? parseFloat(p.inner_depth as string) : null,
          tray_thickness: p.tray_thickness ? parseFloat(p.tray_thickness as string) : null,
          tray_sheets: p.tray_sheets ? parseInt(p.tray_sheets as string, 10) : null,
          sort_order: i,
        })),
      } : undefined,
    },
    include: {
      conditions: { orderBy: { sortOrder: "asc" } },
      parts: { orderBy: { sort_order: "asc" } },
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
