import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword")
  const status = searchParams.get("status")
  const requestType = searchParams.get("requestType")
  const sort = searchParams.get("sort") ?? "uid_desc"
  const page = parseInt(searchParams.get("page") ?? "1")
  const PAGE_SIZE = 50

  const where = {
    ...(status ? { status } : {}),
    ...(requestType ? { request_type: requestType } : {}),
    ...(keyword ? {
      OR: [
        { uid: { contains: keyword } },
        { company_name: { contains: keyword } },
        { sales_rep_name: { contains: keyword } },
      ]
    } : {}),
  }

  const [total, records] = await Promise.all([
    prisma.tokuiCreditRequest.count({ where }),
    prisma.tokuiCreditRequest.findMany({
      where,
      orderBy: sort === "uid_asc" ? { uid: "asc" } : { uid: "desc" },
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

  // uid採番：TK10001から
  const last = await prisma.tokuiCreditRequest.findFirst({
    orderBy: { uid: "desc" },
  })
  const nextNum = last
    ? String(parseInt(last.uid.replace("TK", "")) + 1).padStart(5, "0")
    : "10001"

  const record = await prisma.tokuiCreditRequest.create({
    data: {
      ...body,
      uid: `TK${nextNum}`,
      requested_date: body.requested_date ? new Date(body.requested_date) : null,
    },
  })

  return NextResponse.json(record)
}
