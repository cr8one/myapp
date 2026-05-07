import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS login_logs (
        id TEXT PRIMARY KEY,
        "userId" TEXT REFERENCES users(id),
        email TEXT NOT NULL,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        status TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
