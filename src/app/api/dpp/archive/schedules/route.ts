import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

const PAGE_SIZE = 50

function buildWhere(searchParams: URLSearchParams) {
  const keyword = searchParams.get("keyword")
  const progress = searchParams.get("progress")
  return {
    ...(progress ? { progress } : {}),
    ...(keyword ? {
      OR: [
        { sc_id: { contains: keyword } },
        { hinban: { contains: keyword } },
        { hinmei: { contains: keyword } },
        { artist_name: { contains: keyword } },
        { eigyo_tanto: { contains: keyword } },
        { seihan_tanto: { contains: keyword } },
        { biko: { contains: keyword } },
      ],
    } : {}),
  }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const where = buildWhere(searchParams)
  const page = parseInt(searchParams.get("page") ?? "1")

  const [total, records] = await Promise.all([
    prisma.dppScheduleArchive.count({ where }),
    prisma.dppScheduleArchive.findMany({
      where,
      orderBy: [
        { sc_id: "desc" },
      ],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ])
  return NextResponse.json({ records, total })
}
