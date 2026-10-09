import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { buildXlsxWorkbook } from "@/lib/xlsx-io"
import { USAGE_PLAN_HEADERS } from "@/lib/tray-usage-plan-xlsx"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const submissionMonth = searchParams.get("submission_month")
  const usageMonth = searchParams.get("usage_month")

  const records = await prisma.trayUsagePlan.findMany({
    where: {
      ...(submissionMonth ? { submission_month: submissionMonth } : {}),
      ...(usageMonth ? { usage_month: usageMonth } : {}),
    },
    orderBy: [{ usage_month: "asc" }, { rendo_tray_cd: "asc" }],
    include: { irregular_order: { select: { order_no: true } } },
  })

  const buf = buildXlsxWorkbook([
    {
      name: "トレイ使用予定情報",
      headers: USAGE_PLAN_HEADERS,
      rows: records.map(r => [
        r.id,
        r.submission_month,
        r.usage_month,
        r.rendo_tray_cd,
        r.item_name,
        r.usage_dept,
        r.usage_group,
        r.usage_person_name,
        r.planned_qty,
        r.lock_flg ? 1 : 0,
        r.temp_lock_flg ? 1 : 0,
        r.approved_flg ? 1 : 0,
        r.irregular_order_flg ? 1 : 0,
        r.irregular_order?.order_no ?? "",
      ]),
    },
  ])

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="tray_usage_plans.xlsx"`,
    },
  })
}
