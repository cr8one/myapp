import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma"

const PAGE_SIZE = 50

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword")?.trim() ?? ""
  const rack = searchParams.get("rack")?.trim() ?? ""
  const page = parseInt(searchParams.get("page") ?? "1", 10)

  const where: Prisma.ShelfStockWhereInput = {}
  const and: Prisma.ShelfStockWhereInput[] = []

  if (keyword) {
    and.push({
      OR: [
        { item_code: { contains: keyword, mode: "insensitive" } },
        { item_name: { contains: keyword, mode: "insensitive" } },
        { shelf_no: { contains: keyword, mode: "insensitive" } },
        { lot_no: { contains: keyword, mode: "insensitive" } },
      ],
    })
  }
  if (rack) {
    and.push({ shelf_rack: rack })
  }
  if (and.length > 0) where.AND = and

  const [total, records, racks] = await Promise.all([
    prisma.shelfStock.count({ where }),
    prisma.shelfStock.findMany({
      where,
      orderBy: [{ shelf_rack: "asc" }, { shelf_row: "asc" }, { shelf_col: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.shelfStock.findMany({
      distinct: ["shelf_rack"],
      select: { shelf_rack: true },
      orderBy: { shelf_rack: "asc" },
    }),
  ])

  return NextResponse.json({
    records,
    total,
    racks: racks.map(r => r.shelf_rack).filter(Boolean),
  })
}
