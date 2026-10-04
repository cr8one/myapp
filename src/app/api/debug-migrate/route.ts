import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE t_tray_usage_plans ADD COLUMN IF NOT EXISTS usage_group TEXT;
  `)
  return NextResponse.json({ ok: true })
}
