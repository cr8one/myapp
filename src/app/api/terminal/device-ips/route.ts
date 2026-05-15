import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const record = await prisma.deviceIp.create({
    data: {
      deviceId: parseInt(body.deviceId),
      ip: body.ip,
      subnet: body.subnet || null,
      gateway: body.gateway || null,
      interface: body.interface || null,
      note: body.note || null,
    },
  })
  return NextResponse.json(record)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const record = await prisma.deviceIp.update({
    where: { id: parseInt(body.id) },
    data: {
      ip: body.ip,
      subnet: body.subnet || null,
      gateway: body.gateway || null,
      interface: body.interface || null,
      note: body.note || null,
    },
  })
  return NextResponse.json(record)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  await prisma.deviceIp.update({
    where: { id: parseInt(id) },
    data: { flgDel: true },
  })
  return NextResponse.json({ ok: true })
}
