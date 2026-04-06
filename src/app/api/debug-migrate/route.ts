import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const cols = await prisma.$queryRawUnsafe<{column_name: string}[]>(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'dev_company_type_masters'
      ORDER BY ordinal_position;
    `)
    return NextResponse.json({ ok: true, columns: cols.map(c => c.column_name) })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
