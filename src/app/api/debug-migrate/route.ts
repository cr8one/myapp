import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS t_dxf_requests (
      id TEXT PRIMARY KEY,
      uid TEXT NOT NULL UNIQUE,
      id_cad TEXT,
      request_date TEXT NOT NULL,
      request_time TEXT NOT NULL,
      desired_date TIMESTAMP,
      desired_time TEXT,
      purpose TEXT,
      remarks TEXT,
      history TEXT,
      worker TEXT,
      status TEXT,
      flg_del INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)
  return NextResponse.json({ ok: true })
}
