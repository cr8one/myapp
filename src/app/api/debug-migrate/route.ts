import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS t_drawings (
      id                SERIAL PRIMARY KEY,
      drawing_no        TEXT,
      title             TEXT,
      product_no        TEXT,
      paper_size        TEXT,
      paper_type        TEXT,
      blade_size        TEXT,
      note              TEXT,
      storage_location  TEXT,
      created_date      TEXT,
      approved_by       TEXT,
      confirmed_by      TEXT,
      assigned_by       TEXT,
      legacy_file_path  TEXT,
      legacy_file_type  TEXT,
      new_file_path     TEXT,
      new_file_type     TEXT,
      dieline_id        TEXT,
      flg_del           BOOLEAN NOT NULL DEFAULT false,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  return NextResponse.json({ ok: true })
}
