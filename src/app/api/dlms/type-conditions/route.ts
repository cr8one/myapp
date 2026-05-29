import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const genre = searchParams.get("genre")
  const spec = searchParams.get("spec")
  const hinmoku = searchParams.get("hinmoku")

  const records = await prisma.dlmsTypeCondition.findMany({
    where: {
      ...(genre ? { genre } : {}),
      ...(spec ? { spec } : {}),
      ...(hinmoku ? { hinmoku } : {}),
    },
    orderBy: [
      { genre_sort: "asc" },
      { spec_sort: "asc" },
      { hinmoku_sort: "asc" },
      { tag1_sort: "asc" },
      { tag2_sort: "asc" },
    ],
  })
  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const record = await prisma.dlmsTypeCondition.create({
    data: {
      genre: body.genre || null,
      spec: body.spec || null,
      hinmoku: body.hinmoku || null,
      tag1: body.tag1 || null,
      tag2: body.tag2 || null,
      genre_sort: parseInt(body.genre_sort) || 0,
      spec_sort: parseInt(body.spec_sort) || 0,
      hinmoku_sort: parseInt(body.hinmoku_sort) || 0,
      tag1_sort: parseInt(body.tag1_sort) || 0,
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
      genre: body.genre || null,
      spec: body.spec || null,
      hinmoku: body.hinmoku || null,
      tag1: body.tag1 || null,
      tag2: body.tag2 || null,
      genre_sort: parseInt(body.genre_sort) || 0,
      spec_sort: parseInt(body.spec_sort) || 0,
      hinmoku_sort: parseInt(body.hinmoku_sort) || 0,
      tag1_sort: parseInt(body.tag1_sort) || 0,
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
