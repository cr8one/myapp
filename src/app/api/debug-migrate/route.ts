import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS m_dlms_type_conditions (
      id SERIAL PRIMARY KEY,
      genre TEXT,
      spec TEXT,
      hinmoku TEXT,
      tag1 TEXT,
      tag2 TEXT,
      genre_sort INTEGER NOT NULL DEFAULT 0,
      spec_sort INTEGER NOT NULL DEFAULT 0,
      hinmoku_sort INTEGER NOT NULL DEFAULT 0,
      tag1_sort INTEGER NOT NULL DEFAULT 0,
      tag2_sort INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `)
  await prisma.$executeRawUnsafe(`
    DROP TABLE IF EXISTS dlms_condition_masters;
  `)
  return NextResponse.json({ ok: true })
}
