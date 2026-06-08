import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE t_devices ADD COLUMN IF NOT EXISTS procurement_type TEXT
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS t_device_leases (
      id SERIAL PRIMARY KEY,
      device_id INTEGER NOT NULL UNIQUE REFERENCES t_devices(device_id),
      lease_company TEXT,
      lease_start TIMESTAMP,
      lease_end TIMESTAMP,
      contract_no TEXT,
      lease_item_no TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)
  return NextResponse.json({ ok: true })
}
