import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const trays = await prisma.mTray.findMany({
    orderBy: { sort_order: "asc" },
    include: {
      images: { orderBy: { sort_order: "asc" } },
    },
  })
  return NextResponse.json(trays)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, type, maker, rendo_tray_cd, purchase_evaluation, sort_order } = await req.json()
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 })

  const tray = await prisma.mTray.create({
    data: {
      name,
      type: type ?? "",
      maker: maker ?? "",
      rendo_tray_cd: rendo_tray_cd || null,
      purchase_evaluation: purchase_evaluation || "通常",
      sort_order: sort_order ?? 0,
    },
  })
  return NextResponse.json(tray)
}
