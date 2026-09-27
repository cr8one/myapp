import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await prisma.trayInventory.findMany({
    distinct: ["inventory_month"],
    select: { inventory_month: true },
    orderBy: { inventory_month: "desc" },
  })
  return NextResponse.json(rows.map(r => r.inventory_month))
}
