import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword") ?? ""
  const status = searchParams.get("status") ?? ""
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = 50
  const offset = (page - 1) * limit

  const where: Record<string, unknown> = { flg_del: 0 }
  if (status) where.status = status
  if (keyword) {
    where.OR = [
      { uid: { contains: keyword, mode: "insensitive" } },
      { id_cad: { contains: keyword, mode: "insensitive" } },
      { worker: { contains: keyword, mode: "insensitive" } },
      { purpose: { contains: keyword, mode: "insensitive" } },
    ]
  }

  const [records, total] = await Promise.all([
    prisma.dxfRequest.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.dxfRequest.count({ where }),
  ])
  return NextResponse.json({ records, total })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  // uid採番
  const last = await prisma.dxfRequest.findFirst({
    orderBy: { uid: "desc" },
    select: { uid: true },
  })
  const nextNum = last ? parseInt(last.uid) + 1 : 1
  const uid = String(nextNum).padStart(6, "0")

  const record = await prisma.dxfRequest.create({
    data: {
      uid,
      id_cad: body.id_cad || null,
      request_date: body.request_date,
      request_time: body.request_time,
      desired_date: body.desired_date ? new Date(body.desired_date) : null,
      desired_time: body.desired_time || null,
      purpose: body.purpose || null,
      remarks: body.remarks || null,
      history: body.history || null,
      worker: body.worker || null,
      status: body.status || null,
    },
  })
  return NextResponse.json(record)
}
