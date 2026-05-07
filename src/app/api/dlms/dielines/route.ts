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

  const parents = await prisma.dlmsDielineParent.findMany({
    where: {
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
    },
    include: {
      conditions: { orderBy: { sortOrder: "asc" } },
      children: { where: { flg_del: 0 }, orderBy: { edaban: "asc" } },
    },
    orderBy: { uid_ntemp: "desc" },
    take: 200,
  })

  return NextResponse.json(parents)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { conditions, children, ...parentData } = body

  // 採番：現在の最大値+1
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
    },
    include: {
      conditions: { orderBy: { sortOrder: "asc" } },
      children: true,
    },
  })

  return NextResponse.json(parent)
}
