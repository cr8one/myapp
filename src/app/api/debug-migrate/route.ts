import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const tables = [
      'dev_companies',
      'dev_company_contacts',
      'dev_company_type_masters',
      'dev_company_types',
      'dev_projects',
      'dev_project_companies',
      'dev_exhibitions',
      'dev_exhibition_companies',
    ]
    const result: Record<string, string[]> = {}
    for (const table of tables) {
      const cols = await prisma.$queryRawUnsafe<{column_name: string}[]>(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = '${table}'
        ORDER BY ordinal_position;
      `)
      result[table] = cols.map(c => c.column_name)
    }
    return NextResponse.json({ ok: true, tables: result })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
