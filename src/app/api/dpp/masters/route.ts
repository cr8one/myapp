import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")

  if (type === "eigyo") {
    const records = await prisma.dppEigyoMaster.findMany({
      orderBy: [{ sort_order: "asc" }, { id: "asc" }],
    })
    return NextResponse.json(records)
  }
  if (type === "seihan") {
    const records = await prisma.dppSeihanMaster.findMany({
      orderBy: [{ sort_order: "asc" }, { id: "asc" }],
    })
    return NextResponse.json(records)
  }
  return NextResponse.json({ error: "type required" }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { type, name, sort_order } = body

  if (type === "eigyo") {
    const record = await prisma.dppEigyoMaster.create({
      data: { name, sort_order: sort_order ?? 0 },
    })
    return NextResponse.json(record)
  }
  if (type === "seihan") {
    const record = await prisma.dppSeihanMaster.create({
      data: { name, sort_order: sort_order ?? 0 },
    })
    return NextResponse.json(record)
  }
  return NextResponse.json({ error: "type required" }, { status: 400 })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { type, id, name, sort_order, is_active } = body

  if (type === "eigyo") {
    const record = await prisma.dppEigyoMaster.update({
      where: { id },
      data: { name, sort_order, is_active },
    })
    return NextResponse.json(record)
  }
  if (type === "seihan") {
    const record = await prisma.dppSeihanMaster.update({
      where: { id },
      data: { name, sort_order, is_active },
    })
    return NextResponse.json(record)
  }
  return NextResponse.json({ error: "type required" }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { type, id } = await req.json()

  if (type === "eigyo") {
    await prisma.dppEigyoMaster.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  }
  if (type === "seihan") {
    await prisma.dppSeihanMaster.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: "type required" }, { status: 400 })
}
