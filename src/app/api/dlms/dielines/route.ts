import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { Prisma } from "@/generated/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const genreList = searchParams.get("genre")?.split(",").filter(Boolean) ?? []
  const specList = searchParams.get("spec")?.split(",").filter(Boolean) ?? []
  const hinmokuList = searchParams.get("hinmoku")?.split(",").filter(Boolean) ?? []
  const condition = searchParams.get("condition")
  const keyword = searchParams.get("keyword")
  const uidFrom = searchParams.get("uidFrom")
  const uidTo = searchParams.get("uidTo")
  const dateFrom = searchParams.get("dateFrom")
  const dateTo = searchParams.get("dateTo")
  const mode = searchParams.get("mode") === "OR" ? "OR" : "AND"
  const sort = searchParams.get("sort") ?? "uid_desc"
  const page = parseInt(searchParams.get("page") ?? "1")
  const PAGE_SIZE = 50

  const categoryConditions: Prisma.DlmsDielineParentWhereInput[] = []
  if (genreList.length > 0) categoryConditions.push({ genre: { in: genreList } })
  if (specList.length > 0) categoryConditions.push({ spec: { in: specList } })
  if (hinmokuList.length > 0) categoryConditions.push({ hinmoku: { in: hinmokuList } })
  if (condition) categoryConditions.push({ conditions: { some: { value: { contains: condition } } } })

  const andConditions: Prisma.DlmsDielineParentWhereInput[] = [{ flg_del: 0 }]
  if (categoryConditions.length > 0) {
    andConditions.push(mode === "OR" ? { OR: categoryConditions } : { AND: categoryConditions })
  }
  if (keyword) {
    andConditions.push({
      OR: [
        { uid_ntemp: { contains: keyword } },
        { kyugataban: { contains: keyword } },
      ],
    })
  }
  if (uidFrom || uidTo) {
    andConditions.push({
      uid_ntemp: {
        ...(uidFrom ? { gte: uidFrom.padStart(7, "0") } : {}),
        ...(uidTo ? { lte: uidTo.padStart(7, "0") } : {}),
      },
    })
  }
  if (dateFrom || dateTo) {
    andConditions.push({
      dtindt: {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59`) } : {}),
      },
    })
  }
  const where: Prisma.DlmsDielineParentWhereInput = { AND: andConditions }

  const orderBy: Prisma.DlmsDielineParentOrderByWithRelationInput =
    sort === "uid_asc" ? { uid_ntemp: "asc" } :
    sort === "date_asc" ? { dtindt: "asc" } :
    sort === "date_desc" ? { dtindt: "desc" } :
    { uid_ntemp: "desc" }

  const [total, parents] = await Promise.all([
    prisma.dlmsDielineParent.count({ where }),
    prisma.dlmsDielineParent.findMany({
      where,
      include: {
        conditions: { orderBy: { sortOrder: "asc" } },
        parts: { orderBy: { sort_order: "asc" } },
        children: { where: { flg_del: 0 }, orderBy: { edaban: "asc" } },
      },
      orderBy,
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
