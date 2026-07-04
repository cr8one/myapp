import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim() ?? ""
  const page = parseInt(searchParams.get("page") ?? "1", 10)
  const pageSize = 50
  const where = q
    ? {
        OR: [
          { storage_location: { contains: q, mode: "insensitive" as const } },
          { hinban: { contains: q, mode: "insensitive" as const } },
          { category: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {}
  const [records, total] = await Promise.all([
    prisma.dppStorageLedgerEntry.findMany({
      where,
      orderBy: [{ storage_location: "asc" }, { hinban: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.dppStorageLedgerEntry.count({ where }),
  ])
  return NextResponse.json({ records, total })
}
