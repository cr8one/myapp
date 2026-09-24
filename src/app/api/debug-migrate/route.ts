import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE t_dxf_requests DROP COLUMN IF EXISTS history;
  `)
  return NextResponse.json({ ok: true })
}