import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword") ?? ""
  const status = searchParams.get("status") ?? ""
  const idCad = searchParams.get("id_cad") ?? ""
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = 50
  const offset = (page - 1) * limit

  const where: Record<string, unknown> = { flg_del: 0 }
  if (status) where.status = status
  if (idCad) where.id_cad = idCad
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
      desired_time_kbn: body.desired_time_kbn ?? 0,
      purpose: body.purpose || null,
      remarks: body.remarks || null,
      daishi_desired_date: body.daishi_desired_date ? new Date(body.daishi_desired_date) : null,
      daishi_desired_time: body.daishi_desired_time || null,
      daishi_desired_time_kbn: body.daishi_desired_time_kbn ?? 0,
      daishi_remarks: body.daishi_remarks || null,
      worker: body.worker || null,
      status: body.status || null,
    },
  })

  await createAuditLog({
    userId: session.user?.id,
    service: "cad",
    action: "CREATE",
    targetModel: "DxfRequest",
    targetId: record.id,
    targetLabel: record.uid,
    diff: { classification: "新規" },
  })

  return NextResponse.json(record)
}
