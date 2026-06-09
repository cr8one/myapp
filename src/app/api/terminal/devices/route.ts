import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword")
  const status = searchParams.get("status")
  const records = await prisma.device.findMany({
    where: {
      ...(keyword ? { OR: [
        { deviceName: { contains: keyword } },
        { assetNo: { contains: keyword } },
        { hostname: { contains: keyword } },
        { serialNo: { contains: keyword } },
        { location: { contains: keyword } },
        { userId: { contains: keyword } },
      ]} : {}),
      ...(status ? { status } : {}),
    },
    include: {
      ipAddresses: { where: { flgDel: false } },
      lease: true,
      children: { select: { deviceId: true, deviceName: true, status: true } },
    },
    orderBy: { deviceId: "asc" },
  })
  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const record = await prisma.device.create({
    data: {
      assetNo: body.assetNo || null,
      deviceName: body.deviceName,
      hostname: body.hostname || null,
      modelId: body.modelId ? parseInt(body.modelId) : null,
      serialNo: body.serialNo || null,
      osVersion: body.osVersion || null,
      memorySize: body.memorySize || null,
      storageSize: body.storageSize || null,
      location: body.location || null,
      userId: body.userId || null,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
      startDate: body.startDate ? new Date(body.startDate) : null,
      status: body.status || null,
      managementType: body.managementType || null,
      remark: body.remark || null,
      parentDeviceId: body.parentDeviceId ? parseInt(body.parentDeviceId) : null,
      procurementType: body.procurementType || null,
    },
    include: { ipAddresses: true, lease: true },
  })
  return NextResponse.json(record)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const record = await prisma.device.update({
    where: { deviceId: parseInt(body.deviceId) },
    data: {
      assetNo: body.assetNo || null,
      deviceName: body.deviceName,
      hostname: body.hostname || null,
      modelId: body.modelId ? parseInt(body.modelId) : null,
      serialNo: body.serialNo || null,
      osVersion: body.osVersion || null,
      memorySize: body.memorySize || null,
      storageSize: body.storageSize || null,
      location: body.location || null,
      userId: body.userId || null,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
      startDate: body.startDate ? new Date(body.startDate) : null,
      status: body.status || null,
      managementType: body.managementType || null,
      remark: body.remark || null,
      parentDeviceId: body.parentDeviceId ? parseInt(body.parentDeviceId) : null,
    },
    include: { ipAddresses: { where: { flgDel: false } }, lease: true },
  })
  if (body.procurementType === "リース") {
    await prisma.deviceLease.upsert({
      where: { device_id: parseInt(body.deviceId) },
      create: {
        device_id: parseInt(body.deviceId),
        lease_company: body.leaseCompany || null,
        lease_start: body.leaseStart ? new Date(body.leaseStart) : null,
        lease_end: body.leaseEnd ? new Date(body.leaseEnd) : null,
        contract_no: body.contractNo || null,
        lease_item_no: body.leaseItemNo || null,
      },
      update: {
        lease_company: body.leaseCompany || null,
        lease_start: body.leaseStart ? new Date(body.leaseStart) : null,
        lease_end: body.leaseEnd ? new Date(body.leaseEnd) : null,
        contract_no: body.contractNo || null,
        lease_item_no: body.leaseItemNo || null,
      },
    })
  } else {
    await prisma.deviceLease.deleteMany({ where: { device_id: parseInt(body.deviceId) } })
  }
  return NextResponse.json(record)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  await prisma.device.delete({ where: { deviceId: parseInt(id) } })
  return NextResponse.json({ ok: true })
}
