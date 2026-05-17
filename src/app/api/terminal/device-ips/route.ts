import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword") ?? ""

  const records = await prisma.deviceIp.findMany({
    where: {
      flgDel: false,
      ...(keyword ? {
        OR: [
          { ip: { contains: keyword } },
          { interface: { contains: keyword } },
          { note: { contains: keyword } },
          { device: { deviceName: { contains: keyword } } },
          { device: { assetNo: { contains: keyword } } },
          { device: { hostname: { contains: keyword } } },
        ],
      } : {}),
    },
    include: {
      device: {
        select: {
          deviceId: true,
          deviceName: true,
          assetNo: true,
          hostname: true,
        },
      },
    },
    orderBy: [
      { device: { deviceName: "asc" } },
      { ip: "asc" },
    ],
  })
  return NextResponse.json(records)
}

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
