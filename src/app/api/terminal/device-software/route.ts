import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword") ?? ""
  const deviceId = searchParams.get("deviceId")

  const records = await prisma.deviceSoftware.findMany({
    where: {
      flgDel: false,
      ...(deviceId ? { deviceId: parseInt(deviceId) } : {}),
      ...(keyword ? {
        OR: [
          { version: { contains: keyword } },
          { note: { contains: keyword } },
          { software: { name: { contains: keyword } } },
          { software: { vendor: { contains: keyword } } },
          { device: { deviceName: { contains: keyword } } },
          { device: { assetNo: { contains: keyword } } },
        ],
      } : {}),
    },
    include: {
      device: {
        select: {
          deviceId: true,
          deviceName: true,
          assetNo: true,
        },
      },
      software: {
        select: {
          id: true,
          name: true,
          version: true,
          vendor: true,
          licenseType: true,
        },
      },
    },
    orderBy: [
      { device: { deviceName: "asc" } },
      { software: { name: "asc" } },
    ],
  })
  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const record = await prisma.deviceSoftware.create({
    data: {
      deviceId: parseInt(body.deviceId),
      softwareId: parseInt(body.softwareId),
      version: body.version || null,
      note: body.note || null,
    },
  })
  return NextResponse.json(record)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const record = await prisma.deviceSoftware.update({
    where: { id: parseInt(body.id) },
    data: {
      softwareId: parseInt(body.softwareId),
      version: body.version || null,
      note: body.note || null,
    },
  })
  return NextResponse.json(record)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  await prisma.deviceSoftware.update({
    where: { id: parseInt(id) },
    data: { flgDel: true },
  })
  return NextResponse.json({ ok: true })
}
