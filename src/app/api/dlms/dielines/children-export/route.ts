import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const children = await prisma.dlmsDielineChild.findMany({
    where: { flg_del: 0 },
    include: { parent: { select: { uid_ntemp: true } } },
    orderBy: [{ parent: { uid_ntemp: "asc" } }, { edaban: "asc" }],
  })

  const header = ["型番号", "枝番", "判", "目", "切", "面", "天地(mm)", "左右(mm)", "咥え(mm)", "所在"]
  const rows = children.map(c => [
    c.parent.uid_ntemp,
    c.edaban,
    c.han ?? "",
    c.me ?? "",
    c.kiri ?? "",
    c.men ?? "",
    c.sizey?.toString() ?? "",
    c.sizex?.toString() ?? "",
    c.咥え?.toString() ?? "",
    c.location ?? "",
  ])

  const csv = [header, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\r\n")

  const bom = "\uFEFF"
  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dieline-children_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
