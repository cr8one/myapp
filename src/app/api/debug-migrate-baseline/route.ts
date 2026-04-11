import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const tables = await prisma.$queryRaw<{tablename: string}[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename = '_prisma_migrations'
    `

    if (tables.length > 0) {
      const migrations = await prisma.$queryRaw<{migration_name: string, finished_at: Date | null}[]>`
        SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at
      `
      return NextResponse.json({ exists: true, migrations })
    }

    return NextResponse.json({ exists: false, migrations: [] })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST() {
  try {
    // _prisma_migrations テーブルを作成
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" VARCHAR(36) NOT NULL,
        "checksum" VARCHAR(64) NOT NULL,
        "finished_at" TIMESTAMPTZ,
        "migration_name" VARCHAR(255) NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMPTZ,
        "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY ("id")
      )
    `

    // 既存の全マイグレーションをapply済みとして登録
    const migrations = [
      "20260316052739_init",
      "20260317025837_add_product_part",
      "20260405000000_add_dev_management",
      "20260406022515_add_company_contacts_and_types",
      "20260409033611_update_exhibition_tables",
      "20260411143148_add_role_and_permissions",
    ]

    for (const name of migrations) {
      await prisma.$executeRaw`
        INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count)
        VALUES (
          gen_random_uuid()::text,
          'baselined',
          now(),
          ${name},
          1
        )
        ON CONFLICT DO NOTHING
      `
    }

    return NextResponse.json({ success: true, baselined: migrations })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
