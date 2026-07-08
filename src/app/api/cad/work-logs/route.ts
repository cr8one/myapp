import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1", 10)
  const pageSize = 50
  const keyword = searchParams.get("keyword") || ""

  const where = keyword
    ? {
        OR: [
          { title: { contains: keyword, mode: "insensitive" as const } },
          { customer: { contains: keyword, mode: "insensitive" as const } },
          { request_no: { contains: keyword, mode: "insensitive" as const } },
          { person_in_charge: { contains: keyword, mode: "insensitive" as const } },
        ],
      }
    : {}

  const [records, total] = await Promise.all([
    prisma.cadWorkLog.findMany({
      where,
      orderBy: { start_time: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cadWorkLog.count({ where }),
  ])

  return NextResponse.json({ records, total })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  const created = await prisma.cadWorkLog.create({
    data: {
      creator: session.user?.name || "",
      work_date: new Date(body.work_date),
      start_time: new Date(body.start_time),
      end_time: body.end_time ? new Date(body.end_time) : null,
      request_no: body.request_no || null,
      department_group: body.department_group || null,
      person_in_charge: body.person_in_charge || null,
      customer: body.customer || null,
      title: body.title || null,
      content: body.content || null,
      parts_name: body.parts_name || null,
      quantity: body.quantity ? parseInt(body.quantity, 10) : null,
      paper_name: body.paper_name || null,
      remarks: body.remarks || null,
      flg_same_day: body.flg_same_day ? 1 : 0,
    },
  })

  return NextResponse.json(created)
}
