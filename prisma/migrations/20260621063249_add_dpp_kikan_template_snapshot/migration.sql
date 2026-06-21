-- AlterTable
ALTER TABLE "t_dpp_schedules" ADD COLUMN     "kikanSnapshotId" TEXT;

-- CreateTable
CREATE TABLE "t_dpp_kikan_template_snapshots" (
    "id" TEXT NOT NULL,
    "kno" TEXT NOT NULL,
    "case_segment_id" INTEGER,
    "dtindt" TEXT,
    "dtinman" TEXT,
    "dtintm" TEXT,
    "dtupdt" TEXT,
    "dtupman" TEXT,
    "dtuptm" TEXT,
    "gyokai_cd" INTEGER,
    "hinsyu_grp_cd" TEXT,
    "hondenkbn" INTEGER,
    "jt_date" TEXT,
    "media_cd" INTEGER,
    "pp_jtflg" INTEGER,
    "seihin_edano" TEXT,
    "seihin_oyano" TEXT,
    "seihin_syu_cd" INTEGER,
    "seihin_syu_detail_cd" INTEGER,
    "shikyuhin_cdrom" INTEGER,
    "shikyuhin_color_film" INTEGER,
    "shikyuhin_color_hansya_genko" INTEGER,
    "shikyuhin_mail" TEXT,
    "shikyuhin_mail_nm" TEXT,
    "shikyuhin_mo" INTEGER,
    "shikyuhin_monoclo_hansya_genko" TEXT,
    "shikyuhin_server" TEXT,
    "tokuicd" TEXT,
    "ttl_hinmei3" TEXT,
    "ttl_hinmeicode" TEXT,
    "ttl_m_hinsyucd" TEXT,
    "ttl_m_tantocd" TEXT,
    "ttl_m_tantoname" TEXT,
    "ttl_nonyudate" TEXT,
    "ttl_note" TEXT,
    "ttl_tokuname1" TEXT,
    "u_id" INTEGER,
    "uri_yotei_date" TEXT,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imported_by" TEXT,

    CONSTRAINT "t_dpp_kikan_template_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_dpp_kikan_template_snapshots_kno_idx" ON "t_dpp_kikan_template_snapshots"("kno");

-- AddForeignKey
ALTER TABLE "t_dpp_schedules" ADD CONSTRAINT "t_dpp_schedules_kikanSnapshotId_fkey" FOREIGN KEY ("kikanSnapshotId") REFERENCES "t_dpp_kikan_template_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
