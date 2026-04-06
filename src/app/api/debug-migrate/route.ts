import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE dev_company_type_masters
        ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
    `)
    return NextResponse.json({ ok: true, message: "カラム追加完了" })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
