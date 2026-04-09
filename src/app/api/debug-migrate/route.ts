import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // dev_exhibition_companiesテーブルを削除
    await prisma.$executeRawUnsafe(`
      DROP TABLE IF EXISTS dev_exhibition_companies;
    `)

    // dev_exhibition_visitorsテーブルを作成
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS dev_exhibition_visitors (
        id            TEXT PRIMARY KEY,
        exhibition_id TEXT NOT NULL REFERENCES dev_exhibitions(id) ON DELETE CASCADE,
        user_id       TEXT NOT NULL REFERENCES "User"(id),
        impression    TEXT,
        created_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(exhibition_id, user_id)
      );
    `)

    // dev_exhibition_contactsテーブルを作成
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS dev_exhibition_contacts (
        id            TEXT PRIMARY KEY,
        exhibition_id TEXT NOT NULL REFERENCES dev_exhibitions(id) ON DELETE CASCADE,
        company_id    TEXT NOT NULL REFERENCES dev_companies(id),
        contact_id    TEXT REFERENCES dev_company_contacts(id),
        notes         TEXT,
        created_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // dev_exhibitionsにsummaryとdescriptionを追加
    await prisma.$executeRawUnsafe(`
      ALTER TABLE dev_exhibitions
        ADD COLUMN IF NOT EXISTS summary     TEXT,
        ADD COLUMN IF NOT EXISTS description TEXT;
    `)

    return NextResponse.json({ ok: true, message: "マイグレーション完了" })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
