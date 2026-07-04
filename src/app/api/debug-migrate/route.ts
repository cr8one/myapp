import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "t_dpp_storage_ledger_entry" (
        "id" TEXT NOT NULL,
        "storage_location" TEXT NOT NULL,
        "hinban" TEXT NOT NULL,
        "category" TEXT,
        "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "t_dpp_storage_ledger_entry_pkey" PRIMARY KEY ("id")
      );
    `)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "t_dpp_storage_ledger_entry_storage_location_idx" ON "t_dpp_storage_ledger_entry"("storage_location");
    `)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "t_dpp_storage_ledger_entry_hinban_idx" ON "t_dpp_storage_ledger_entry"("hinban");
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "user_permissions" ADD COLUMN IF NOT EXISTS "dpp_storage_ledger_import" BOOLEAN NOT NULL DEFAULT false;
    `)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
