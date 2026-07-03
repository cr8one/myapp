import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "t_dpp_schedule_archive" (
        "id" TEXT NOT NULL,
        "sc_id" TEXT NOT NULL,
        "hinban" TEXT,
        "hinmei" TEXT,
        "artist_name" TEXT,
        "kosei_stage" TEXT,
        "nouki_date" TIMESTAMP(3),
        "nouki_time" TEXT,
        "progress" TEXT,
        "eigyo_tanto" TEXT,
        "seihan_tanto" TEXT,
        "biko" TEXT,
        "shuukei_daisuu" DECIMAL(10,2),
        "fm_created_at" TIMESTAMP(3),
        "fm_updated_at" TIMESTAMP(3),
        "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "t_dpp_schedule_archive_pkey" PRIMARY KEY ("id")
      );
    `)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "t_dpp_schedule_archive_parts" (
        "id" TEXT NOT NULL,
        "dsi_u_id" TEXT NOT NULL,
        "siyou_u_id" TEXT,
        "page" TEXT,
        "biko" TEXT,
        "biko_siyou" TEXT,
        "kosei_type" TEXT,
        "kosei_stage" TEXT,
        "paper_name" TEXT,
        "paper_weight" TEXT,
        "part_name" TEXT,
        "color_omote" TEXT,
        "color_ura" TEXT,
        "maisu" TEXT,
        "menzuke_daisuu" INTEGER,
        "flg_dgs" TEXT,
        "dgs_sensuu" TEXT,
        "dgs_seikei_teishutsu" INTEGER,
        "dgs_kakou_ari_teishutsu" INTEGER,
        "dgs_kakou_nashi_teishutsu" INTEGER,
        "dgs_kakou_ari_hikae" INTEGER,
        "dgs_kakou_nashi_hikae" INTEGER,
        "dgs_kakou_ari_sousuu" INTEGER,
        "dgs_kakou_nashi_sousuu" INTEGER,
        "dgs_sousuu" INTEGER,
        "dgs_yohaku_dansai_ari_maisu" INTEGER,
        "dgs_yohaku_dansai_nashi_maisu" INTEGER,
        "dgs_hira_ari_maisu" INTEGER,
        "dgs_hira_nashi_maisu" INTEGER,
        "dgs_hikae_goukei" INTEGER,
        "nyuko_date" TIMESTAMP(3),
        "nyuko_time" TEXT,
        "shiage_date" TIMESTAMP(3),
        "shiage_time" TEXT,
        "fm_created_at" TIMESTAMP(3),
        "fm_updated_at" TIMESTAMP(3),
        "scId" TEXT NOT NULL,
        CONSTRAINT "t_dpp_schedule_archive_parts_pkey" PRIMARY KEY ("id")
      );
    `)

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "t_dpp_schedule_archive_sc_id_key" ON "t_dpp_schedule_archive"("sc_id");
    `)

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "t_dpp_schedule_archive_parts_dsi_u_id_key" ON "t_dpp_schedule_archive_parts"("dsi_u_id");
    `)

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 't_dpp_schedule_archive_parts_scId_fkey'
        ) THEN
          ALTER TABLE "t_dpp_schedule_archive_parts"
          ADD CONSTRAINT "t_dpp_schedule_archive_parts_scId_fkey"
          FOREIGN KEY ("scId") REFERENCES "t_dpp_schedule_archive"("sc_id")
          ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
      END $$;
    `)

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
