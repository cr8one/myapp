import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get("month")
  if (!month) return NextResponse.json({ error: "month is required" }, { status: 400 })

  const records = await prisma.trayInventory.findMany({
    where: { inventory_month: month },
    orderBy: { rendo_tray_cd: "asc" },
  })

  const lines = records.map(r => `${r.rendo_tray_cd},${r.remaining_qty}`)
  const csv = lines.join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tray_inventory_${month}.csv"`,
    },
  })
}
