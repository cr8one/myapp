import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = parseInt(searchParams.get("limit") ?? "50")
  const search = searchParams.get("search") ?? ""
  const isHold = searchParams.get("isHold")

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { serialCode: { contains: search, mode: "insensitive" } },
      { productCode: { contains: search, mode: "insensitive" } },
      { orderNo: { contains: search, mode: "insensitive" } },
      { partName: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
      { company: { name: { contains: search, mode: "insensitive" } } },
    ]
  }
  if (isHold === "true") where.isHold = true
  if (isHold === "false") where.isHold = false

  const [total, items] = await Promise.all([
    prisma.sealSupply.count({ where }),
    prisma.sealSupply.findMany({
      where,
      include: {
        company: true,
        issuer: true,
        supplier: true,
        receiver: true,
        outsourceReceiver: true,
      },
      orderBy: { serialCode: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  return NextResponse.json({ items, total, page, limit })
}

export async function POST(request: Request) {
  const body = await request.json()

  const config = await prisma.sealSerialConfig.findFirst()
  if (!config) return NextResponse.json({ error: "採番設定がありません" }, { status: 500 })

  const serialCode = `${config.prefix ?? ""}${String(config.nextValue).padStart(7, "0")}`
  await prisma.sealSerialConfig.update({
    where: { id: config.id },
    data: { nextValue: config.nextValue + config.increment },
  })

  const supply = await prisma.sealSupply.create({
    data: {
      serialCode,
      isHold: body.isHold ?? false,
      holdDeadline: body.holdDeadline ? new Date(body.holdDeadline) : null,
      issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
      productCode: body.productCode,
      orderNo: body.orderNo,
      partName: body.partName,
      qtyShizuokaToTokyo: body.qtyShizuokaToTokyo ?? 0,
      qtyTokyoToOutsource: body.qtyTokyoToOutsource ?? 0,
      qtyTokyoStock: body.qtyTokyoStock ?? 0,
      companyId: body.companyId ?? null,
      companyName: body.companyName || null,
      issuerId: body.issuerId ?? null,
      issuerName: body.issuerName || null,
      supplierId: body.supplierId ?? null,
      supplierName: body.supplierName || null,
      shipDateFromJS: body.shipDateFromJS ? new Date(body.shipDateFromJS) : null,
      receiverId: body.receiverId ?? null,
      receiverName: body.receiverName || null,
      receiptDateAtSupplier: body.receiptDateAtSupplier ? new Date(body.receiptDateAtSupplier) : null,
      outsourceReceiverId: body.outsourceReceiverId ?? null,
      outsourceReceiverName: body.outsourceReceiverName || null,
      mailSentFlag: body.mailSentFlag ?? "未",
      notes: body.notes || null,
      department: body.department || null,
    },
    include: {
      company: true,
      issuer: true,
      supplier: true,
      receiver: true,
      outsourceReceiver: true,
    },
  })

  return NextResponse.json(supply, { status: 201 })
}
