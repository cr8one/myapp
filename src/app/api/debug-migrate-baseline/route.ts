import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const tables = await prisma.$queryRaw<{tablename: string}[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename = '_prisma_migrations'
    `

    if (tables.length > 0) {
      const migrations = await prisma.$queryRaw<{migration_name: string, finished_at: Date | null}[]>`
        SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at
      `
      return NextResponse.json({ exists: true, migrations })
    }

    return NextResponse.json({ exists: false, migrations: [] })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
