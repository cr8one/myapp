import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        "userId" TEXT REFERENCES users(id),
        action TEXT NOT NULL,
        "targetModel" TEXT NOT NULL,
        "targetId" TEXT NOT NULL,
        "targetLabel" TEXT,
        diff TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
