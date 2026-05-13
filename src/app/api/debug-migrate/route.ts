import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
export async function GET() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "prinser_m_tokui_nonyu" (
      "nonyu_cd" VARCHAR(10) NOT NULL,
      "tokuicd" VARCHAR(20),
      "tokuinm" VARCHAR(64),
      "tantou_nm" VARCHAR(10),
      "nonyu_nm1" VARCHAR(64),
      "nonyu_nm2" VARCHAR(64),
      "nonyu_kana" VARCHAR(40),
      "nonyu_kigou" VARCHAR(3),
      "sy_shoyou_nissu" INTEGER NOT NULL DEFAULT 0,
      "yubin_no" VARCHAR(8),
      "address1" VARCHAR(30),
      "address2" VARCHAR(30),
      "tel_no" VARCHAR(16),
      "fax_no" VARCHAR(16),
      "tekiyou" VARCHAR(255),
      "dtindt" CHAR(10) NOT NULL DEFAULT '',
      "dtintm" CHAR(8) NOT NULL DEFAULT '',
      "dtinuid" VARCHAR(10) NOT NULL DEFAULT '',
      "dtupdt" CHAR(10) NOT NULL DEFAULT '',
      "dtuptm" CHAR(8) NOT NULL DEFAULT '',
      "dtupuid" VARCHAR(10) NOT NULL DEFAULT '',
      "del_flg" INTEGER NOT NULL DEFAULT 0,
      "mitsumonavi_nohinsaki_name" VARCHAR(64) NOT NULL DEFAULT '',
      "rawData" TEXT,
      "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "prinser_m_tokui_nonyu_pkey" PRIMARY KEY ("nonyu_cd")
    )
  `)
  return NextResponse.json({ ok: true })
}
