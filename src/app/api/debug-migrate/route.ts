import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE dlms_dieline_parents
    ADD COLUMN IF NOT EXISTS develop_depth DOUBLE PRECISION
  `)
  return NextResponse.json({ ok: true })
}
