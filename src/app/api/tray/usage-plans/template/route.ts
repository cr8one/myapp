import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { buildXlsxWorkbook } from "@/lib/xlsx-io"
import { USAGE_PLAN_HEADERS } from "@/lib/tray-usage-plan-xlsx"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const buf = buildXlsxWorkbook([
    {
      name: "トレイ使用予定情報",
      headers: USAGE_PLAN_HEADERS,
      rows: [],
    },
  ])

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="tray_usage_plans_template.xlsx"`,
    },
  })
}
