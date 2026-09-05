import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const byId = await prisma.$queryRawUnsafe<{ furigana_last_name: string | null }[]>(
    `SELECT furigana_last_name FROM "User" ORDER BY id ASC`
  )
  const byCreated = await prisma.$queryRawUnsafe<{ furigana_last_name: string | null }[]>(
    `SELECT furigana_last_name FROM "User" ORDER BY "createdAt" ASC`
  )
  const byFurigana = await prisma.$queryRawUnsafe<{ furigana_last_name: string | null }[]>(
    `SELECT furigana_last_name FROM "User" ORDER BY furigana_last_name ASC NULLS LAST`
  )
  return NextResponse.json({
    byId: byId.map(r => r.furigana_last_name),
    byCreated: byCreated.map(r => r.furigana_last_name),
    byFurigana: byFurigana.map(r => r.furigana_last_name),
  })
}
