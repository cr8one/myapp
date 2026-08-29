import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE t_m_approval_routes ADD COLUMN IF NOT EXISTS category TEXT;
  `)
  return NextResponse.json({ ok: true })
}
