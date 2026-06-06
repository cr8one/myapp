import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword")
  const page = parseInt(searchParams.get("page") ?? "1")
  const PAGE_SIZE = 50

  const where = {
    flg_del: 0,
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
      include: { requester: { select: { id: true, name: true, department: true } } },
      orderBy: { uid: "desc" },
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

  // uid採番：10001から
  const last = await prisma.cadRequest.findFirst({
    orderBy: { uid: "desc" },
  })
  const nextNum = last
    ? String(parseInt(last.uid) + 1).padStart(5, "0")
    : "10001"

  const record = await prisma.cadRequest.create({
    data: {
      ...body,
      uid: nextNum,
      request_date: new Date(body.request_date),
      desired_date: body.desired_date ? new Date(body.desired_date) : null,
    },
    include: { requester: { select: { id: true, name: true, department: true } } },
  })

  return NextResponse.json(record)
}
