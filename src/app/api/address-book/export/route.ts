import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword") ?? ""
  const where: Record<string, unknown> = { flg_del: 0 }
  if (keyword) {
    where.OR = [
      { uid: { contains: keyword, mode: "insensitive" } },
      { company_name: { contains: keyword, mode: "insensitive" } },
      { name: { contains: keyword, mode: "insensitive" } },
    ]
  }
  const records = await prisma.addressBook.findMany({
    where,
    orderBy: { uid: "asc" },
  })
  const headers = ["No", "会社名", "会社名フリガナ", "部門名", "役職名", "氏名", "敬称", "郵便番号", "住所1", "住所2", "担当部署", "備考"]
  const rows = records.map(r => [
    r.uid,
    r.company_name ?? "",
    r.company_name_kana ?? "",
    r.department ?? "",
    r.position ?? "",
    r.name ?? "",
    r.honorific ?? "",
    r.postal_code ?? "",
    r.address1 ?? "",
    r.address2 ?? "",
    r.department_in_charge ?? "",
    r.remarks ?? "",
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")
  const bom = "\uFEFF"
  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv;charset=utf-8;",
      "Content-Disposition": "attachment; filename=address-book.csv",
    },
  })
}
