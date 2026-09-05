import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const raw = await prisma.$queryRawUnsafe<{ id: string; furigana_last_name: string | null }[]>(
    `SELECT id, furigana_last_name FROM "User" ORDER BY furigana_last_name ASC NULLS LAST`
  )
  return NextResponse.json(raw.map(r => r.furigana_last_name))
}
