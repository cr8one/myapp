import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS m_bases (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE m_departments ADD COLUMN IF NOT EXISTS base_id TEXT REFERENCES m_bases(id)
  `)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE m_groups ADD COLUMN IF NOT EXISTS base_id TEXT REFERENCES m_bases(id)
  `)
  return NextResponse.json({ ok: true })
}
