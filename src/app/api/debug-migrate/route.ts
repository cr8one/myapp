import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE t_dxf_requests
      ADD COLUMN IF NOT EXISTS daishi_desired_date TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS daishi_desired_time TEXT,
      ADD COLUMN IF NOT EXISTS daishi_desired_time_kbn INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS daishi_remarks TEXT;
  `)
  return NextResponse.json({ ok: true })
}
