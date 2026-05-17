import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS m_software (
      id           SERIAL PRIMARY KEY,
      name         TEXT NOT NULL,
      version      TEXT,
      vendor       TEXT,
      license_type TEXT,
      license_count INT,
      note         TEXT,
      flg_del      BOOLEAN DEFAULT FALSE,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      updated_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  return NextResponse.json({ ok: true })
}
