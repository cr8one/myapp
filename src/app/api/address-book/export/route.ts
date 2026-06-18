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
      { contacts: { some: { name: { contains: keyword, mode: "insensitive" } } } },
    ]
  }
  const records = await prisma.addressBook.findMany({
    where,
    orderBy: { uid: "asc" },
    include: { contacts: { orderBy: { sort_order: "asc" } } },
  })
  const headers = ["No", "会社名", "会社名フリガナ", "郵便番号", "住所1", "住所2", "担当部署", "備考", "部門名", "役職名", "氏名", "敬称"]
  const rows: string[][] = []
  for (const r of records) {
    if (r.contacts.length === 0) {
      rows.push([
        r.uid, r.company_name ?? "", r.company_name_kana ?? "",
        r.postal_code ?? "", r.address1 ?? "", r.address2 ?? "",
        r.department_in_charge ?? "", r.remarks ?? "",
        "", "", "", "",
      ])
    } else {
      for (const c of r.contacts) {
        rows.push([
          r.uid, r.company_name ?? "", r.company_name_kana ?? "",
          r.postal_code ?? "", r.address1 ?? "", r.address2 ?? "",
          r.department_in_charge ?? "", r.remarks ?? "",
          c.department ?? "", c.position ?? "", c.name ?? "", c.honorific ?? "",
        ])
      }
    }
  }
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")
  const bom = "\uFEFF"
  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv;charset=utf-8;",
      "Content-Disposition": "attachment; filename=address-book.csv",
    },
  })
}
