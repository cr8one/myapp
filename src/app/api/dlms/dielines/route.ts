import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const genre = searchParams.get("genre")
  const spec = searchParams.get("spec")
  const hinmoku = searchParams.get("hinmoku")
  const condition = searchParams.get("condition")
  const keyword = searchParams.get("keyword")
  const page = parseInt(searchParams.get("page") ?? "1")
  const PAGE_SIZE = 50
  const where = {
    flg_del: 0,
    ...(genre ? { genre } : {}),
    ...(spec ? { spec } : {}),
    ...(hinmoku ? { hinmoku } : {}),
    ...(condition ? { conditions: { some: { value: { contains: condition } } } } : {}),
    ...(keyword ? {
      OR: [
        { uid_ntemp: { contains: keyword } },
        { kyugataban: { contains: keyword } },
      ]
    } : {}),
  }
  const [total, parents] = await Promise.all([
    prisma.dlmsDielineParent.count({ where }),
    prisma.dlmsDielineParent.findMany({
      where,
      include: {
        conditions: { orderBy: { sortOrder: "asc" } },
        parts: { orderBy: { sort_order: "asc" } },
        children: { where: { flg_del: 0 }, orderBy: { edaban: "asc" } },
      },
      orderBy: { uid_ntemp: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ])
  return NextResponse.json({ records: parents, total })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const { conditions, children, parts, ...parentData } = body
  const last = await prisma.dlmsDielineParent.findFirst({
    orderBy: { uid_ntemp: "desc" },
  })
  const nextNum = last
    ? String(parseInt(last.uid_ntemp) + 1)
    : "1000001"
  const parent = await prisma.dlmsDielineParent.create({
    data: {
      ...parentData,
      uid_ntemp: nextNum,
      conditions: {
        create: (conditions ?? []).map((v: string, i: number) => ({ value: v, sortOrder: i })),
      },
      parts: parts?.length > 0 ? {
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
          sort_order: i,
        })),
      } : undefined,
    },
    include: {
      conditions: { orderBy: { sortOrder: "asc" } },
      parts: { orderBy: { sort_order: "asc" } },
      children: true,
    },
  })
  return NextResponse.json(parent)
}
