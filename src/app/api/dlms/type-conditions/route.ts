import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
const PAGE_SIZE = 50
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const genre = searchParams.get("genre")
  const spec = searchParams.get("spec")
  const hinmoku = searchParams.get("hinmoku")
  const tag1 = searchParams.get("tag1")
  const tag2 = searchParams.get("tag2")
  const keyword = searchParams.get("keyword")
  const countOnly = searchParams.get("count") === "true"
  const all = searchParams.get("all") === "true"
  const page = parseInt(searchParams.get("page") ?? "1") || 1
  const where: any = {
    ...(genre ? { genre: { contains: genre } } : {}),
    ...(spec ? { spec: { contains: spec } } : {}),
    ...(hinmoku ? { hinmoku: { contains: hinmoku } } : {}),
    ...(tag1 ? { tag1: { contains: tag1 } } : {}),
    ...(tag2 ? { tag2: { contains: tag2 } } : {}),
    ...(keyword ? {
      OR: [
        { genre: { contains: keyword } },
        { spec: { contains: keyword } },
        { hinmoku: { contains: keyword } },
        { tag1: { contains: keyword } },
        { tag2: { contains: keyword } },
      ]
    } : {}),
  }
  if (countOnly) {
    const total = await prisma.dlmsTypeCondition.count({ where })
    return NextResponse.json({ total })
  }
  const orderBy = [
    { genre_sort: "asc" as const },
    { spec_sort: "asc" as const },
    { hinmoku_sort: "asc" as const },
    { tag1_sort: "asc" as const },
    { tag2_sort: "asc" as const },
  ]
  if (all) {
    const records = await prisma.dlmsTypeCondition.findMany({ where, orderBy })
    return NextResponse.json({ records, total: records.length })
  }
  const [records, total] = await Promise.all([
    prisma.dlmsTypeCondition.findMany({
      where, orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.dlmsTypeCondition.count({ where }),
  ])
  return NextResponse.json({ records, total })
}
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const record = await prisma.dlmsTypeCondition.create({
    data: {
      genre: body.genre || null, spec: body.spec || null,
      hinmoku: body.hinmoku || null, tag1: body.tag1 || null, tag2: body.tag2 || null,
      genre_sort: parseInt(body.genre_sort) || 0, spec_sort: parseInt(body.spec_sort) || 0,
      hinmoku_sort: parseInt(body.hinmoku_sort) || 0, tag1_sort: parseInt(body.tag1_sort) || 0,
      tag2_sort: parseInt(body.tag2_sort) || 0,
    },
  })
  return NextResponse.json(record)
}
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const record = await prisma.dlmsTypeCondition.update({
    where: { id: parseInt(body.id) },
    data: {
      genre: body.genre || null, spec: body.spec || null,
      hinmoku: body.hinmoku || null, tag1: body.tag1 || null, tag2: body.tag2 || null,
      genre_sort: parseInt(body.genre_sort) || 0, spec_sort: parseInt(body.spec_sort) || 0,
      hinmoku_sort: parseInt(body.hinmoku_sort) || 0, tag1_sort: parseInt(body.tag1_sort) || 0,
      tag2_sort: parseInt(body.tag2_sort) || 0,
    },
  })
  return NextResponse.json(record)
}
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  await prisma.dlmsTypeCondition.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ ok: true })
}
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { action } = await req.json()
  if (action === "deleteAll") {
    await prisma.dlmsTypeCondition.deleteMany({})
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
