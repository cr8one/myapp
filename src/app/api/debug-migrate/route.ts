import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "user_permissions" ADD COLUMN IF NOT EXISTS "manufacturing_view" BOOLEAN NOT NULL DEFAULT true;
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "user_permissions" ADD COLUMN IF NOT EXISTS "manufacturing_edit" BOOLEAN NOT NULL DEFAULT false;
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "user_permissions" ADD COLUMN IF NOT EXISTS "tray_view" BOOLEAN NOT NULL DEFAULT true;
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "user_permissions" ADD COLUMN IF NOT EXISTS "tray_edit" BOOLEAN NOT NULL DEFAULT false;
    `)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
