import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword") ?? ""

  const records = await prisma.mSoftware.findMany({
    where: {
      flgDel: false,
      ...(keyword ? {
        OR: [
          { name: { contains: keyword } },
          { version: { contains: keyword } },
          { vendor: { contains: keyword } },
          { licenseType: { contains: keyword } },
          { note: { contains: keyword } },
        ],
      } : {}),
    },
    orderBy: [{ name: "asc" }],
  })
  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const record = await prisma.mSoftware.create({
    data: {
      name: body.name,
      version: body.version || null,
      vendor: body.vendor || null,
      licenseType: body.licenseType || null,
      licenseCount: body.licenseCount ? parseInt(body.licenseCount) : null,
      note: body.note || null,
    },
  })
  return NextResponse.json(record)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const record = await prisma.mSoftware.update({
    where: { id: parseInt(body.id) },
    data: {
      name: body.name,
      version: body.version || null,
      vendor: body.vendor || null,
      licenseType: body.licenseType || null,
      licenseCount: body.licenseCount ? parseInt(body.licenseCount) : null,
      note: body.note || null,
    },
  })
  return NextResponse.json(record)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  await prisma.mSoftware.update({
    where: { id: parseInt(id) },
    data: { flgDel: true },
  })
  return NextResponse.json({ ok: true })
}
