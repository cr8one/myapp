import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS is_purchasing_staff BOOLEAN NOT NULL DEFAULT false;
  `)
  return NextResponse.json({ ok: true })
}
