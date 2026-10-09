import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/permissions"
import { buildXlsxWorkbook } from "@/lib/xlsx-io"
import { IRREGULAR_ORDER_HEADERS } from "@/lib/tray-irregular-order-xlsx"

const pad = (n: number) => String(n).padStart(2, "0")

export async function GET() {
  const denied = await requirePermission("trayView")
  if (denied) return denied

  const orders = await prisma.trayIrregularOrder.findMany({ orderBy: { order_no: "asc" } })

  const buf = buildXlsxWorkbook([
    {
      name: "イレギュラートレイ発注書",
      headers: IRREGULAR_ORDER_HEADERS,
      rows: orders.map(o => {
        const d = new Date(o.request_date.getTime() + 9 * 60 * 60 * 1000)
        return [
          o.order_no,
          o.status,
          `${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())}`,
          o.title,
          o.requester_name,
        ]
      }),
    },
  ])

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="tray_irregular_orders.xlsx"`,
    },
  })
}
