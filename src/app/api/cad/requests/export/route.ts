import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword")
  const status = searchParams.get("status")

  const where = {
    flg_del: 0,
    ...(status ? { status } : {}),
    ...(keyword ? {
      OR: [
        { uid: { contains: keyword } },
        { requester_name: { contains: keyword } },
        { client: { contains: keyword } },
        { title: { contains: keyword } },
        { hinban: { contains: keyword } },
      ]
    } : {}),
  }

  const records = await prisma.cadRequest.findMany({
    where,
    orderBy: { uid: "desc" },
  })

  const headers = [
    "依頼番号", "依頼日", "依頼時刻", "依頼営業名", "依頼部署", "依頼内容",
    "クライアント", "タイトル", "ジャンル", "品目名", "品番", "ステータス", "型台帳番号",
    "展開天地", "展開左右", "用紙", "仕上個数", "希望納期日", "希望納期時刻",
    "使用トレイ", "デジ仕様", "トレイ枚数", "ポケット", "備考",
  ]

  const rows = records.map(r => [
    r.uid,
    r.request_date ? new Date(r.request_date).toISOString().slice(0, 10) : "",
    r.request_time ?? "",
    r.requester_name ?? "",
    r.department ?? "",
    r.content ?? "",
    r.client ?? "",
    r.title ?? "",
    r.genre ?? "",
    r.hinmoku ?? "",
    r.hinban ?? "",
    r.status ?? "",
    r.dieline_no ?? "",
    r.develop_y?.toString() ?? "",
    r.develop_x?.toString() ?? "",
    r.paper ?? "",
    r.finish_count?.toString() ?? "",
    r.desired_date ? new Date(r.desired_date).toISOString().slice(0, 10) : "",
    r.desired_time ?? "",
    r.tray ?? "",
    r.degi_spec ?? "",
    r.tray_count?.toString() ?? "",
    r.pocket ?? "",
    r.remarks ?? "",
  ])

  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n")
  const bom = "\uFEFF"

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv;charset=utf-8;",
      "Content-Disposition": "attachment; filename=cad-requests.csv",
    },
  })
}
