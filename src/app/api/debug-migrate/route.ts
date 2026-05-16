import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
export async function GET() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "m_device_models" ADD COLUMN IF NOT EXISTS "device_type" TEXT`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "m_device_models" DROP COLUMN IF EXISTS "device_type_id"`)
  return NextResponse.json({ ok: true })
}
