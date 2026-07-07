import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "m_cad_options" (
        "id" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "sort_order" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "m_cad_options_pkey" PRIMARY KEY ("id")
      )
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "t_cad_requests"
      ADD COLUMN IF NOT EXISTS "flg_tray_spec" INTEGER NOT NULL DEFAULT 0
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "t_cad_requests"
      ALTER COLUMN "tray_count" TYPE TEXT USING "tray_count"::TEXT
    `)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
