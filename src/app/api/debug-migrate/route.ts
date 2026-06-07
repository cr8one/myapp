import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS m_cad_clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS m_cad_papers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      width DOUBLE PRECISION,
      height DOUBLE PRECISION,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)
  return NextResponse.json({ ok: true })
}
