import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE t_ringi_requests ADD COLUMN IF NOT EXISTS planned_approval_steps JSONB;
  `)
  return NextResponse.json({ ok: true })
}
