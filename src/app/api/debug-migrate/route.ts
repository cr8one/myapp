import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // 新カラム追加
    await prisma.$executeRawUnsafe(`
      ALTER TABLE dev_companies
        ADD COLUMN IF NOT EXISTS status      TEXT NOT NULL DEFAULT '登録のみ',
        ADD COLUMN IF NOT EXISTS postal_code TEXT,
        ADD COLUMN IF NOT EXISTS address     TEXT,
        ADD COLUMN IF NOT EXISTS phone       TEXT,
        ADD COLUMN IF NOT EXISTS url         TEXT;
    `)

    // contactName等の旧カラム削除
    await prisma.$executeRawUnsafe(`
      ALTER TABLE dev_companies
        DROP COLUMN IF EXISTS contact_name,
        DROP COLUMN IF EXISTS contact_email,
        DROP COLUMN IF EXISTS contact_phone;
    `)

    // 担当者テーブル
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS dev_company_contacts (
        id          TEXT PRIMARY KEY,
        company_id  TEXT NOT NULL REFERENCES dev_companies(id) ON DELETE CASCADE,
        name        TEXT NOT NULL,
        name_kana   TEXT,
        email       TEXT,
        phone       TEXT,
        department  TEXT,
        position    TEXT,
        is_primary  BOOLEAN NOT NULL DEFAULT false,
        notes       TEXT,
        created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // 種別マスタテーブル
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS dev_company_type_masters (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL UNIQUE,
        description TEXT,
        sort_order  INTEGER NOT NULL DEFAULT 0,
        created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // 会社×種別 中間テーブル
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS dev_company_types (
        id             TEXT PRIMARY KEY,
        company_id     TEXT NOT NULL REFERENCES dev_companies(id) ON DELETE CASCADE,
        type_master_id TEXT NOT NULL REFERENCES dev_company_type_masters(id) ON DELETE CASCADE,
        created_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(company_id, type_master_id)
      );
    `)

    return NextResponse.json({ ok: true, message: "マイグレーション完了" })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
