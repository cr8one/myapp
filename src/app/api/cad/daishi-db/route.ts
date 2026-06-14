import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword") ?? ""
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = 50
  const offset = (page - 1) * limit

  const where: Record<string, unknown> = { flg_del: 0 }
  if (keyword) {
    where.OR = [
      { uid: { contains: keyword, mode: "insensitive" } },
      { remarks: { contains: keyword, mode: "insensitive" } },
      { tags: { some: { tag_name: { contains: keyword, mode: "insensitive" } } } },
    ]
  }

  const [records, total] = await Promise.all([
    prisma.daishiDb.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: offset,
      take: limit,
      include: { tags: true },
    }),
    prisma.daishiDb.count({ where }),
  ])
  return NextResponse.json({ records, total })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  // uid採番
  const last = await prisma.daishiDb.findFirst({
    orderBy: { uid: "desc" },
    select: { uid: true },
  })
  const nextNum = last ? parseInt(last.uid) + 1 : 1
  const uid = String(nextNum).padStart(6, "0")

  const record = await prisma.daishiDb.create({
    data: {
      uid,
      remarks: body.remarks || null,
      cad_request_uid: body.cad_request_uid || null,
      tags: body.tags?.length > 0 ? {
        create: body.tags.map((t: string) => ({ tag_name: t })),
      } : undefined,
    },
    include: { tags: true },
  })
  return NextResponse.json(record)
}
