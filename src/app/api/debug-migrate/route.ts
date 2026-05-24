import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE t_devices ADD COLUMN IF NOT EXISTS parent_device_id INT NULL;
  `)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE t_device_software ADD COLUMN IF NOT EXISTS user_id VARCHAR NULL;
  `)
  return NextResponse.json({ ok: true })
}
