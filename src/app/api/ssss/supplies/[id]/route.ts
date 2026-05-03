import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supply = await prisma.sealSupply.findUnique({
    where: { id: parseInt(id) },
    include: { company: true, issuer: true, supplier: true, receiver: true, outsourceReceiver: true, salesPerson: true },
  })
  if (!supply) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(supply)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  const supply = await prisma.sealSupply.update({
    where: { id: parseInt(id) },
    data: {
      isHold: body.isHold,
      holdDeadline: body.holdDeadline ? new Date(body.holdDeadline) : null,
      issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
      productCode: body.productCode,
      orderNo: body.orderNo,
      partName: body.partName,
      qtyShizuokaToTokyo: body.qtyShizuokaToTokyo,
      qtyTokyoToOutsource: body.qtyTokyoToOutsource,
      qtyTokyoStock: body.qtyTokyoStock,
      companyId: body.companyId ?? null,
      companyName: body.companyName || null,
      issuerId: body.issuerId || null,
      issuerName: body.issuerName || null,
      supplierId: body.supplierId || null,
      supplierName: body.supplierName || null,
      shipDateFromJS: body.shipDateFromJS ? new Date(body.shipDateFromJS) : null,
      receiverId: body.receiverId || null,
      receiverName: body.receiverName || null,
      receiptDateAtSupplier: body.receiptDateAtSupplier ? new Date(body.receiptDateAtSupplier) : null,
      outsourceReceiverId: body.outsourceReceiverId || null,
      outsourceReceiverName: body.outsourceReceiverName || null,
      salesDepartment: body.salesDepartment || null,
      salesPersonId: body.salesPersonId || null,
      salesPersonName: body.salesPersonName || null,
      mailSentFlag: body.mailSentFlag,
      notes: body.notes || null,
      department: body.department || null,
      ...(body.pdfExportedAt !== undefined && { pdfExportedAt: body.pdfExportedAt ? new Date(body.pdfExportedAt) : null }),
    },
    include: { company: true, issuer: true, supplier: true, receiver: true, outsourceReceiver: true, salesPerson: true },
  })
  return NextResponse.json(supply)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.sealSupply.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ success: true })
}
