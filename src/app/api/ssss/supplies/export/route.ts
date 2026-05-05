import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function fmtDate(d: Date | null) {
  if (!d) return ""
  return d.toISOString().split("T")[0]
}

export async function GET() {
  const items = await prisma.sealSupply.findMany({
    include: {
      company: true,
      issuer: true,
      supplier: true,
      receiver: true,
      outsourceReceiver: true,
      salesPerson: true,
    },
    orderBy: { serialCode: "desc" },
  })

  const headers = [
    "serialCode", "issueDate", "productCode", "orderNo", "partName",
    "qtyShizuokaToTokyo", "qtyTokyoToOutsource", "qtyTokyoStock",
    "companyName", "issuerName", "supplierName", "shipDateFromJS",
    "receiverName", "receiptDateAtSupplier", "outsourceReceiverName",
    "salesDepartment", "salesPersonName", "mailSentFlag",
    "isHold", "holdDeadline", "notes",
  ]

  const rows = items.map(item => [
    item.serialCode,
    fmtDate(item.issueDate),
    item.productCode,
    item.orderNo,
    item.partName,
    item.qtyShizuokaToTokyo,
    item.qtyTokyoToOutsource,
    item.qtyTokyoStock,
    item.company?.name ?? item.companyName ?? "",
    item.issuer?.name ?? item.issuerName ?? "",
    item.supplier?.name ?? item.supplierName ?? "",
    fmtDate(item.shipDateFromJS),
    item.receiver?.name ?? item.receiverName ?? "",
    fmtDate(item.receiptDateAtSupplier),
    item.outsourceReceiver?.name ?? item.outsourceReceiverName ?? "",
    item.salesDepartment ?? "",
    item.salesPerson?.name ?? item.salesPersonName ?? "",
    item.mailSentFlag,
    item.isHold ? "1" : "0",
    fmtDate(item.holdDeadline),
    item.notes ?? "",
  ])

  const escape = (v: unknown) => {
    const s = String(v)
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const csv = [
    headers.join(","),
    ...rows.map(row => row.map(escape).join(",")),
  ].join("\n")

  // BOM付きUTF-8でExcelで開ける
  const bom = "\uFEFF"
  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="supplies_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  })
}
