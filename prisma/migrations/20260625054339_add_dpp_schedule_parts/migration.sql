-- CreateTable
CREATE TABLE "t_dpp_schedule_parts" (
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
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_dpp_schedule_parts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_dpp_schedule_parts_schedule_id_idx" ON "t_dpp_schedule_parts"("schedule_id");

-- AddForeignKey
ALTER TABLE "t_dpp_schedule_parts" ADD CONSTRAINT "t_dpp_schedule_parts_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "t_dpp_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
