import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE dlms_dieline_parents
    ADD COLUMN IF NOT EXISTS inner_height DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS inner_width DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS inner_depth DOUBLE PRECISION
  `)
  return NextResponse.json({ ok: true })
}
