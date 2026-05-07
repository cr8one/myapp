import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const haichi = searchParams.get("haichi")

  const requests = await prisma.dlmsDielineRequest.findMany({
    where: {
      flg_del: 0,
      ...(haichi ? { haichi_kakunin: haichi } : {}),
    },
    include: {
      parent: { select: { uid_ntemp: true, genre: true, spec: true, hinmoku: true } },
      child: { select: { edaban: true, han: true, me: true, kiri: true, men: true } },
    },
    orderBy: { request_no: "desc" },
  })

  return NextResponse.json(requests)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  // 採番
  const last = await prisma.dlmsDielineRequest.findFirst({
    orderBy: { request_no: "desc" },
  })
  const nextNo = last
    ? String(parseInt(last.request_no) + 1).padStart(5, "0")
    : "00001"

  const request = await prisma.dlmsDielineRequest.create({
    data: {
      ...body,
      request_no: nextNo,
      use_date: body.use_date ? new Date(body.use_date) : null,
      kansei_date: body.kansei_date ? new Date(body.kansei_date) : null,
    },
    include: {
      parent: { select: { uid_ntemp: true, genre: true, spec: true, hinmoku: true } },
      child: { select: { edaban: true, han: true, me: true, kiri: true, men: true } },
    },
  })

  return NextResponse.json(request)
}
