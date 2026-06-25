import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "t_dpp_schedule_parts" (
        "id" TEXT NOT NULL,
        "schedule_id" TEXT NOT NULL,
        "siyou_u_id" TEXT,
        "part_name" TEXT,
        "kosei_shu" TEXT,
        "kosei_dankai" TEXT,
        "yoshi_name" TEXT,
        "yoshi_renryo" TEXT,
        "iro_omote" TEXT,
        "iro_ura" TEXT,
        "maisu" TEXT,
        "mentuke_daisuu" INTEGER,
        "page" TEXT,
        "nyuko_date" TIMESTAMP(3),
        "nyuko_time" TEXT,
        "shiagari_date" TIMESTAMP(3),
        "shiagari_time" TEXT,
        "biko" TEXT,
        "biko_shiyosho" TEXT,
        "flg_dgs" INTEGER NOT NULL DEFAULT 0,
        "dgs_sensuu" TEXT,
        "dgs_seikei_teishutsu" INTEGER,
        "dgs_kako_ari_teishutsu" INTEGER,
        "dgs_kako_nashi_teishutsu" INTEGER,
        "dgs_kako_ari_hikae" INTEGER,
        "dgs_kako_nashi_hikae" INTEGER,
        "dgs_kako_ari_sosuu" INTEGER,
        "dgs_kako_nashi_sosuu" INTEGER,
        "dgs_sosuu" INTEGER,
        "dgs_yohaku_ari_maisu" INTEGER,
        "dgs_taira_ari_maisu" INTEGER,
        "dgs_yohaku_nashi_maisu" INTEGER,
        "dgs_taira_nashi_maisu" INTEGER,
        "dgs_hikae_goukei" INTEGER,
        "sort_order" INTEGER NOT NULL DEFAULT 0,
        "flg_del" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "t_dpp_schedule_parts_pkey" PRIMARY KEY ("id")
      );
    `)

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "t_dpp_schedule_parts_schedule_id_idx"
      ON "t_dpp_schedule_parts"("schedule_id");
    `)

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 't_dpp_schedule_parts_schedule_id_fkey'
        ) THEN
          ALTER TABLE "t_dpp_schedule_parts"
          ADD CONSTRAINT "t_dpp_schedule_parts_schedule_id_fkey"
          FOREIGN KEY ("schedule_id") REFERENCES "t_dpp_schedules"("id")
          ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
      END $$;
    `)

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
