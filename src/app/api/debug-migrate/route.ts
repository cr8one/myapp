import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS t_device_remarks (
      id SERIAL PRIMARY KEY,
      device_id INTEGER NOT NULL REFERENCES t_devices(device_id),
      date TIMESTAMP,
      title TEXT,
      content TEXT,
      flg_del BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `)
  return NextResponse.json({ ok: true })
}
