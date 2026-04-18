import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // dev_project_assignees テーブル作成
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "dev_project_assignees" (
        "id" TEXT NOT NULL,
        "project_id" TEXT NOT NULL,
        "user_id" TEXT NOT NULL,
        "role" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "dev_project_assignees_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "dev_project_assignees_project_id_user_id_key" UNIQUE ("project_id", "user_id"),
        CONSTRAINT "dev_project_assignees_project_id_fkey"
          FOREIGN KEY ("project_id") REFERENCES "dev_projects"("id") ON DELETE CASCADE,
        CONSTRAINT "dev_project_assignees_user_id_fkey"
          FOREIGN KEY ("user_id") REFERENCES "User"("id")
      );
    `)

    // estimated_amount, ordered_amount カラム追加
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "dev_projects"
      ADD COLUMN IF NOT EXISTS "estimated_amount" INTEGER,
      ADD COLUMN IF NOT EXISTS "ordered_amount" INTEGER;
    `)

    // _prisma_migrations に登録
    await prisma.$executeRawUnsafe(`
      INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count)
      VALUES (gen_random_uuid()::text, 'baselined', now(), '20260414070300_add_project_amounts', 1)
      ON CONFLICT DO NOTHING;
    `)

    await prisma.$executeRawUnsafe(`
      INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count)
      VALUES (gen_random_uuid()::text, 'baselined', now(), '20260418050004_add_project_assignees', 1)
      ON CONFLICT DO NOTHING;
    `)

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
