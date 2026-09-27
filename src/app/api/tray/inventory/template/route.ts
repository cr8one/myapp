import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const trays = await prisma.mTray.findMany({
    where: { rendo_tray_cd: { not: null } },
    orderBy: { sort_order: "asc" },
    select: { rendo_tray_cd: true },
  })

  const lines = trays
    .filter(t => t.rendo_tray_cd)
    .map(t => `${t.rendo_tray_cd},0`)
  const csv = lines.join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tray_inventory_template.csv"`,
    },
  })
}
