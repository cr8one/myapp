import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

function buildWhere(searchParams: URLSearchParams) {
  const keyword = searchParams.get("keyword")
  const progress = searchParams.get("progress")
  return {
    flg_del: 0,
    ...(progress ? { progress } : {}),
    ...(keyword ? {
      OR: [
        { hinban: { contains: keyword } },
        { hinmei: { contains: keyword } },
        { artist_name: { contains: keyword } },
        { eigyo_tanto: { contains: keyword } },
        { seihan_tanto: { contains: keyword } },
        { biko: { contains: keyword } },
      ],
    } : {}),
  }
}

function csvEscape(v: string) {
  if (v.includes(",") || v.includes("\n") || v.includes('"')) {
    return `"${v.replace(/"/g, '""')}"`
  }
  return v
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const where = buildWhere(searchParams)

  const records = await prisma.dppSchedule.findMany({
    where,
    orderBy: [
      { nouki_date: "asc" },
      { nouki_time: "asc" },
      { created_at: "desc" },
    ],
  })

  const headers = ["No.", "校正段階", "品番", "品名", "アーティスト", "納期日付", "納期時刻", "進捗", "集計台数", "営業担当", "製版担当", "備考"]
  const rows = records.map(r => [
    r.schedule_no,
    r.kosei_stage ?? "",
    r.hinban ?? "",
    r.hinmei ?? "",
    r.artist_name ?? "",
    r.nouki_date ? new Date(r.nouki_date).toISOString().split("T")[0] : "",
    r.nouki_time ?? "",
    r.progress ?? "",
    r.shuukei_daisuu?.toString() ?? "",
    r.eigyo_tanto ?? "",
    r.seihan_tanto ?? "",
    r.biko ?? "",
  ])

  const csv = [headers, ...rows].map(row => row.map(v => csvEscape(String(v))).join(",")).join("\n")
  const bom = "\uFEFF"

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=dpp_schedules.csv",
    },
  })
}
