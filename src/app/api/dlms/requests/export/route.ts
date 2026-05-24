import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const haichi = searchParams.get("haichi")

  const requests = await prisma.dlmsDielineRequest.findMany({
    where: {
      flg_del: 0,
      ...(haichi && haichi !== "all" ? { haichi_kakunin: haichi } : {}),
    },
    include: {
      parent: { select: { uid_ntemp: true } },
      child: { select: { edaban: true } },
    },
    orderBy: { request_no: "asc" },
  })

  const header = [
    "No.", "型番号", "枝番", "使用品番", "生産管理担当者", "所在",
    "型使用予定日", "型使用AM/PM", "完成予定日", "完成AM/PM",
    "手配確認者", "手配確認", "手配備考", "依頼備考",
  ]

  const rows = requests.map(r => [
    r.request_no,
    r.parent.uid_ntemp,
    r.child?.edaban ?? "",
    r.shohin_no ?? "",
    r.seisan_tanto ?? "",
    r.location ?? "",
    r.use_date ? new Date(r.use_date).toLocaleDateString("ja-JP") : "",
    r.use_time ?? "",
    r.kansei_date ? new Date(r.kansei_date).toLocaleDateString("ja-JP") : "",
    r.kansei_time ?? "",
    r.haichi_kakunin_by ?? "",
    r.haichi_kakunin,
    r.haichi_note ?? "",
    r.request_note ?? "",
  ])

  const csv = [header, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\r\n")

  const bom = "\uFEFF"
  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="抜き型手配依頼書_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
