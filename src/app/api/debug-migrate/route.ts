import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ssss_ishii_emails (
      id         SERIAL PRIMARY KEY,
      email      TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active  BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  return NextResponse.json({ ok: true })
}
