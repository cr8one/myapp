import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  // 新カラム追加・旧カラム削除
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS spec_view BOOLEAN NOT NULL DEFAULT true`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS spec_edit BOOLEAN NOT NULL DEFAULT false`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS estimate_view BOOLEAN NOT NULL DEFAULT true`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS estimate_edit BOOLEAN NOT NULL DEFAULT false`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS eapp_view BOOLEAN NOT NULL DEFAULT true`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS eapp_edit BOOLEAN NOT NULL DEFAULT false`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS travel_view BOOLEAN NOT NULL DEFAULT true`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS travel_edit BOOLEAN NOT NULL DEFAULT false`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS sop_view BOOLEAN NOT NULL DEFAULT true`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS sop_edit BOOLEAN NOT NULL DEFAULT false`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS report_view BOOLEAN NOT NULL DEFAULT true`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS report_edit BOOLEAN NOT NULL DEFAULT false`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS bpms_view BOOLEAN NOT NULL DEFAULT true`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS bpms_edit BOOLEAN NOT NULL DEFAULT false`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS dlms_view BOOLEAN NOT NULL DEFAULT true`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS dlms_edit BOOLEAN NOT NULL DEFAULT false`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS dpp_view BOOLEAN NOT NULL DEFAULT true`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS dpp_edit BOOLEAN NOT NULL DEFAULT false`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS masters_view BOOLEAN NOT NULL DEFAULT false`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS masters_edit BOOLEAN NOT NULL DEFAULT false`)
  // 旧カラム削除
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions DROP COLUMN IF EXISTS products_view`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions DROP COLUMN IF EXISTS products_edit`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions DROP COLUMN IF EXISTS parts_view`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions DROP COLUMN IF EXISTS parts_edit`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions DROP COLUMN IF EXISTS dev_view`)
  await prisma.$executeRawUnsafe(`ALTER TABLE user_permissions DROP COLUMN IF EXISTS dev_edit`)
  return NextResponse.json({ ok: true })
}
