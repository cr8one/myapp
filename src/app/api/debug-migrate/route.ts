import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
export async function GET() {
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS cad_view BOOLEAN NOT NULL DEFAULT true`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS cad_edit BOOLEAN NOT NULL DEFAULT false`)
  return NextResponse.json({ ok: true })
}
