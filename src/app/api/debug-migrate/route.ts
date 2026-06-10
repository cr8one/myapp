import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS t_daishi_db (
      id TEXT PRIMARY KEY,
      uid TEXT NOT NULL UNIQUE,
      file_ai TEXT,
      file_dxf TEXT,
      file_pdf TEXT,
      preview_image TEXT,
      remarks TEXT,
      flg_del INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS t_daishi_tags (
      id SERIAL PRIMARY KEY,
      daishi_id TEXT NOT NULL REFERENCES t_daishi_db(id) ON DELETE CASCADE,
      tag_name TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)
  return NextResponse.json({ ok: true })
}
