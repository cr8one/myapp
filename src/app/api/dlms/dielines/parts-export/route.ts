import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const parts = await prisma.dlmsDielinePart.findMany({
    include: { parent: { select: { uid_ntemp: true, flg_del: true } } },
    orderBy: [{ parent: { uid_ntemp: "asc" } }, { sort_order: "asc" }],
  })
  const filtered = parts.filter(p => p.parent.flg_del === 0)
  const header = ["型番号", "パーツ名", "展開天地", "展開左右", "展開背", "仕上げ背", "仕上げ高さ", "仕上げ奥行き", "内寸背", "内寸高さ", "内寸奥行き"]
  const rows = filtered.map(p => [
    p.parent.uid_ntemp,
    p.part_name ?? "",
    p.developy?.toString() ?? "",
    p.developx?.toString() ?? "",
    p.develop_depth?.toString() ?? "",
    p.sizey?.toString() ?? "",
    p.sizex?.toString() ?? "",
    p.widthy?.toString() ?? "",
    p.inner_height?.toString() ?? "",
    p.inner_width?.toString() ?? "",
    p.inner_depth?.toString() ?? "",
  ])
  const csv = [header, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\r\n")
  const bom = "\uFEFF"
  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dieline-parts_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
