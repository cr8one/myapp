import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
export async function GET() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "m_device_models" ADD COLUMN IF NOT EXISTS "vendor_name" TEXT`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "m_device_models" DROP COLUMN IF EXISTS "vendor_id"`)
  return NextResponse.json({ ok: true })
}
