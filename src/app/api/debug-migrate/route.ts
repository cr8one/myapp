import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS dpp_member BOOLEAN NOT NULL DEFAULT false;
  `)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS short_name VARCHAR NULL;
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS t_dpp_schedules (
      id TEXT PRIMARY KEY,
      schedule_no TEXT UNIQUE NOT NULL,
      hinban TEXT,
      hinmei TEXT,
      artist_name TEXT,
      kosei_stage TEXT,
      nouki_date TIMESTAMP,
      nouki_time TEXT,
      progress TEXT,
      eigyo_tanto TEXT,
      seihan_tanto TEXT,
      biko TEXT,
      shuukei_daisuu DECIMAL(10,2),
      flg_del INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `)
  return NextResponse.json({ ok: true })
}
