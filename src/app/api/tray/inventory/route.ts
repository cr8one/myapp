import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get("month")

  const records = await prisma.trayInventory.findMany({
    where: month ? { inventory_month: month } : {},
    orderBy: { rendo_tray_cd: "asc" },
  })
  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { inventory_month, records } = await req.json()
  if (!inventory_month || !Array.isArray(records)) {
    return NextResponse.json({ error: "inventory_month and records are required" }, { status: 400 })
  }

  // 同月分の既存データがあれば洗い替え
  await prisma.trayInventory.deleteMany({ where: { inventory_month } })

  const created = await prisma.trayInventory.createMany({
    data: records.map((r: { rendo_tray_cd: string; remaining_qty: number }) => ({
      inventory_month,
      rendo_tray_cd: r.rendo_tray_cd,
      remaining_qty: r.remaining_qty,
    })),
  })

  return NextResponse.json({ count: created.count })
}
