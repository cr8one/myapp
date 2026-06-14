import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
export async function GET() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "t_daishi_db" ADD COLUMN IF NOT EXISTS "cad_request_uid" TEXT;`)
  return NextResponse.json({ ok: true })
}
