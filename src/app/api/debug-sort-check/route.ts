import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`SET max_parallel_workers_per_gather = 0`)
  const raw = await prisma.$queryRawUnsafe<{ id: string; furigana_last_name: string | null }[]>(
    `SELECT id, furigana_last_name FROM "User" ORDER BY furigana_last_name ASC NULLS LAST`
  )
  const collation = await prisma.$queryRawUnsafe<{ datcollate: string; datctype: string }[]>(
    `SELECT datcollate, datctype FROM pg_database WHERE datname = current_database()`
  )
  return NextResponse.json({ sorted: raw.map(r => r.furigana_last_name), collation })
}
