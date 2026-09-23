import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { buildXlsxWorkbook } from "@/lib/xlsx-io"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })

  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword")

  const where = keyword
    ? {
        OR: [
          { title: { contains: keyword, mode: "insensitive" as const } },
          { customer: { contains: keyword, mode: "insensitive" as const } },
          { request_no: { contains: keyword, mode: "insensitive" as const } },
          { person_in_charge: { contains: keyword, mode: "insensitive" as const } },
        ],
      }
    : {}

  const records = await prisma.cadWorkLog.findMany({
    where,
    orderBy: { start_time: "desc" },
  })

  const headers = [
    "日付", "開始時刻", "終了時刻", "依頼書No", "所属G", "担当者", "顧客",
    "タイトル", "内容", "パーツ名", "用紙名", "数量", "備考", "当日対応", "作成者",
  ]

  const formatDate = (d: Date) => d.toISOString().slice(0, 10)
  const formatTime = (d: Date) => d.toISOString().slice(11, 16)

  const rows = records.map(r => [
    formatDate(r.work_date),
    formatTime(r.start_time),
    r.end_time ? formatTime(r.end_time) : "",
    r.request_no ?? "",
    r.department_group ?? "",
    r.person_in_charge ?? "",
    r.customer ?? "",
    r.title ?? "",
    r.content ?? "",
    r.parts_name ?? "",
    r.paper_name ?? "",
    r.quantity ?? "",
    r.remarks ?? "",
    r.flg_same_day,
    r.creator,
  ])

  const buf = buildXlsxWorkbook([
    { name: "CadWorkLogs", headers, rows },
  ])

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="cad-work-logs_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  })
}