import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE dlms_dieline_parts DROP COLUMN IF EXISTS develop_depth
  `)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE dlms_dieline_parts ADD COLUMN IF NOT EXISTS develop_depths DOUBLE PRECISION[] NOT NULL DEFAULT '{}'
  `)
  return NextResponse.json({ ok: true })
}
