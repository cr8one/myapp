import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const byIcu = await prisma.$queryRawUnsafe<{ furigana_last_name: string | null }[]>(
    `SELECT furigana_last_name FROM "User" ORDER BY furigana_last_name COLLATE "und-x-icu" ASC NULLS LAST`
  )
  const byDefault = await prisma.$queryRawUnsafe<{ furigana_last_name: string | null }[]>(
    `SELECT furigana_last_name FROM "User" ORDER BY furigana_last_name ASC NULLS LAST`
  )
  return NextResponse.json({
    byIcu: byIcu.map(r => r.furigana_last_name),
    byDefault: byDefault.map(r => r.furigana_last_name),
  })
}
