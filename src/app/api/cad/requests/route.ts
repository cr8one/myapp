import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { desiredTimeSortKey } from "@/lib/desired-time"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword")
  const status = searchParams.get("status")
  const sort = searchParams.get("sort") ?? "created"
  const page = parseInt(searchParams.get("page") ?? "1")
  const PAGE_SIZE = 50

  const where = {
    flg_del: 0,
    ...(status ? { status } : {}),
    ...(keyword ? {
      OR: [
        { uid: { contains: keyword } },
        { requester_name: { contains: keyword } },
        { client: { contains: keyword } },
        { title: { contains: keyword } },
        { hinban: { contains: keyword } },
      ]
    } : {}),
  }

  const [total, records] = await Promise.all([
    prisma.cadRequest.count({ where }),
    prisma.cadRequest.findMany({
      where,
      include: { requester: { select: { id: true, name: true } } },
      orderBy: sort === "nouki"
        ? [{ desired_date: "desc" }, { desired_time_sort: "desc" }]
        : { uid: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ])

  return NextResponse.json({ records, total })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  // uid採番：10001から。uidはString型で、旧システム由来の1〜2桁の値が混在しているため、
  // 文字列ソートではなく数値としてのMAXを取得する（文字列ソートだと"9" > "10001"と誤判定されるため）
  const maxResult = await prisma.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(uid AS INTEGER)) as max FROM t_cad_requests WHERE uid ~ '^[0-9]+$'
  `
  const currentMax = maxResult[0]?.max ?? 10000
  const nextNum = String(Math.max(currentMax + 1, 10001)).padStart(5, "0")

  const record = await prisma.cadRequest.create({
    data: {
      ...body,
      uid: nextNum,
      request_date: new Date(body.request_date),
      desired_date: body.desired_date ? new Date(body.desired_date) : null,
      desired_time_sort: desiredTimeSortKey(body.desired_time_kbn ?? 0, body.desired_time ?? null),
    },
    include: { requester: { select: { id: true, name: true } } },
  })

  return NextResponse.json(record)
}
