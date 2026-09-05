import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const plan = await prisma.$queryRawUnsafe<{ "QUERY PLAN": string }[]>(
    `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT furigana_last_name FROM "User" ORDER BY furigana_last_name ASC NULLS LAST`
  )
  const indexes = await prisma.$queryRawUnsafe<{ indexname: string; indexdef: string }[]>(
    `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'User'`
  )
  return NextResponse.json({
    plan: plan.map(p => p["QUERY PLAN"]),
    indexes,
  })
}
