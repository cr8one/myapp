import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const deviceId = searchParams.get("deviceId")
  if (!deviceId) return NextResponse.json({ error: "deviceId required" }, { status: 400 })
  const records = await prisma.deviceRemark.findMany({
    where: { deviceId: parseInt(deviceId), flgDel: false },
    orderBy: { date: "desc" },
  })
  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const record = await prisma.deviceRemark.create({
    data: {
      deviceId: parseInt(body.deviceId),
      date: body.date ? new Date(body.date) : null,
      title: body.title || null,
      content: body.content || null,
    },
  })
  return NextResponse.json(record)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const record = await prisma.deviceRemark.update({
    where: { id: parseInt(body.id) },
    data: {
      date: body.date ? new Date(body.date) : null,
      title: body.title || null,
      content: body.content || null,
    },
  })
  return NextResponse.json(record)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  await prisma.deviceRemark.update({
    where: { id: parseInt(id) },
    data: { flgDel: true },
  })
  return NextResponse.json({ ok: true })
}
