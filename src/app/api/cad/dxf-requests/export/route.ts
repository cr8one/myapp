import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { buildXlsxWorkbook } from "@/lib/xlsx-io"
import { desiredTimeLabel } from "@/lib/desired-time"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })

  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword")
  const status = searchParams.get("status")

  const where = {
    flg_del: 0,
    ...(status ? { status } : {}),
    ...(keyword ? {
      OR: [
        { uid: { contains: keyword } },
        { id_cad: { contains: keyword } },
        { worker: { contains: keyword } },
        { purpose: { contains: keyword } },
      ]
    } : {}),
  }

  const records = await prisma.dxfRequest.findMany({
    where,
    orderBy: { uid: "desc" },
  })

  const headers = [
    "依頼番号", "CAD依頼書No", "依頼日", "依頼時刻", "希望納期日", "希望納期時刻",
    "目的", "備考", "作業担当", "ステータス",
  ]

  const rows = records.map(r => [
    r.uid,
    r.id_cad ?? "",
    r.request_date ?? "",
    r.request_time ?? "",
    r.desired_date ? new Date(r.desired_date).toISOString().slice(0, 10) : "",
    desiredTimeLabel(r.desired_time_kbn, r.desired_time),
    r.purpose ?? "",
    r.remarks ?? "",
    r.worker ?? "",
    r.status ?? "",
  ])

  const buf = buildXlsxWorkbook([
    { name: "DxfRequests", headers, rows },
  ])

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="dxf-requests_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  })
}