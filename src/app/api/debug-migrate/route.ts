import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "m_cad_mail_recipients" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "sort_order" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "m_cad_mail_recipients_pkey" PRIMARY KEY ("id")
      )
    `)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "m_cad_mail_templates" (
        "id" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "updated_at" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "m_cad_mail_templates_pkey" PRIMARY KEY ("id")
      )
    `)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
