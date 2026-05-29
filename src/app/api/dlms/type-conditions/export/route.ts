import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const records = await prisma.dlmsTypeCondition.findMany({
    orderBy: [
      { genre_sort: "asc" },
      { spec_sort: "asc" },
      { hinmoku_sort: "asc" },
      { tag1_sort: "asc" },
      { tag2_sort: "asc" },
    ],
  })

  const header = ["ジャンル", "仕様", "品目", "条件タグ1", "条件タグ2", "ジャンル順", "仕様順", "品目順", "タグ1順", "タグ2順"]
  const rows = records.map(r => [
    r.genre ?? "", r.spec ?? "", r.hinmoku ?? "",
    r.tag1 ?? "", r.tag2 ?? "",
    r.genre_sort.toString(), r.spec_sort.toString(), r.hinmoku_sort.toString(),
    r.tag1_sort.toString(), r.tag2_sort.toString(),
  ])

  const csv = [header, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\r\n")

  const bom = "\uFEFF"
  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="DLMS型条件マスタ_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
