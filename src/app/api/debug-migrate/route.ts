import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS t_device_software (
      id          SERIAL PRIMARY KEY,
      device_id   INT NOT NULL,
      software_id INT NOT NULL,
      version     TEXT,
      note        TEXT,
      flg_del     BOOLEAN DEFAULT FALSE,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  return NextResponse.json({ ok: true })
}
