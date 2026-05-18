import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword")
  const hasLegacy = searchParams.get("has_legacy")
  const hasNew = searchParams.get("has_new")

  const drawings = await prisma.drawing.findMany({
    where: {
      flg_del: false,
      ...(keyword ? {
        OR: [
          { drawing_no: { contains: keyword } },
          { title: { contains: keyword } },
          { product_no: { contains: keyword } },
        ]
      } : {}),
      ...(hasLegacy === "1" ? { legacy_file_path: { not: null } } : {}),
      ...(hasNew === "1" ? { new_file_path: { not: null } } : {}),
    },
    include: {
      dieline: { select: { id: true, uid_ntemp: true, kyugataban: true } },
    },
    orderBy: { created_at: "desc" },
    take: 200,
  })

  return NextResponse.json(drawings)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const drawing = await prisma.drawing.create({ data: body })
  return NextResponse.json(drawing)
}
