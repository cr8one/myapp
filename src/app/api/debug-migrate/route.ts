import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "dlms_dieline_parts" ADD COLUMN IF NOT EXISTS "tray_thickness" DOUBLE PRECISION;
  `)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "dlms_dieline_parts" ADD COLUMN IF NOT EXISTS "tray_sheets" INTEGER;
  `)
  return NextResponse.json({ ok: true })
}
