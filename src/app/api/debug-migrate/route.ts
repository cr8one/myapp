import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  // dlms_dieline_parentsからサイズフィールドを削除
  await prisma.$executeRawUnsafe(`ALTER TABLE dlms_dieline_parents DROP COLUMN IF EXISTS developy`)
  await prisma.$executeRawUnsafe(`ALTER TABLE dlms_dieline_parents DROP COLUMN IF EXISTS developx`)
  await prisma.$executeRawUnsafe(`ALTER TABLE dlms_dieline_parents DROP COLUMN IF EXISTS develop_depth`)
  await prisma.$executeRawUnsafe(`ALTER TABLE dlms_dieline_parents DROP COLUMN IF EXISTS sizey`)
  await prisma.$executeRawUnsafe(`ALTER TABLE dlms_dieline_parents DROP COLUMN IF EXISTS sizex`)
  await prisma.$executeRawUnsafe(`ALTER TABLE dlms_dieline_parents DROP COLUMN IF EXISTS widthy`)
  await prisma.$executeRawUnsafe(`ALTER TABLE dlms_dieline_parents DROP COLUMN IF EXISTS inner_height`)
  await prisma.$executeRawUnsafe(`ALTER TABLE dlms_dieline_parents DROP COLUMN IF EXISTS inner_width`)
  await prisma.$executeRawUnsafe(`ALTER TABLE dlms_dieline_parents DROP COLUMN IF EXISTS inner_depth`)
  // dlms_dieline_partsテーブルを作成
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS dlms_dieline_parts (
      id TEXT PRIMARY KEY,
      "parentId" TEXT NOT NULL REFERENCES dlms_dieline_parents(id) ON DELETE CASCADE,
      part_name TEXT,
      developy DOUBLE PRECISION,
      developx DOUBLE PRECISION,
      develop_depth DOUBLE PRECISION,
      sizey DOUBLE PRECISION,
      sizex DOUBLE PRECISION,
      widthy DOUBLE PRECISION,
      inner_height DOUBLE PRECISION,
      inner_width DOUBLE PRECISION,
      inner_depth DOUBLE PRECISION,
      sort_order INTEGER NOT NULL DEFAULT 0,
      dtindt TIMESTAMP NOT NULL DEFAULT NOW(),
      dtupdt TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)
  return NextResponse.json({ ok: true })
}
