import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE m_cad_mail_recipients ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'cad_request';
  `)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE m_cad_mail_templates ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'cad_request';
  `)
  return NextResponse.json({ ok: true })
}
