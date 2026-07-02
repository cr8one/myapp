import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import * as XLSX from "xlsx"

const s3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})
const CHUNK = 100

function excelDateToJs(v: unknown): Date | null {
  if (v === null || v === undefined || v === "") return null
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v)
    if (!d) return null
    return new Date(Date.UTC(d.y, d.m - 1, d.d))
  }
  const d = new Date(String(v))
  return isNaN(d.getTime()) ? null : d
}

function excelTimeToStr(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v)
    if (!d) return null
    return `${String(d.H).padStart(2, "0")}:${String(d.M).padStart(2, "0")}`
  }
  return String(v)
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null
  const n = parseInt(String(v), 10)
  return isNaN(n) ? null : n
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { key, offset } = await req.json()

  const obj = await s3.send(new GetObjectCommand({
    Bucket: "japan-sleeve-system-files-936533876784",
    Key: key,
  }))
  const buf = await obj.Body!.transformToByteArray()
  const wb = XLSX.read(buf, { type: "array", cellDates: false })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: null })

  const total = rows.length
  const chunk = rows.slice(offset, offset + CHUNK)
  let skipped = 0

  for (const row of chunk) {
    const dsi_u_id = row["dsi_u_id"] ? String(row["dsi_u_id"]).trim() : ""
    const sc_id = row["sc_id"] ? String(row["sc_id"]).trim() : ""
    if (!dsi_u_id || !sc_id) { skipped++; continue }

    const parent = await prisma.dppScheduleArchive.findUnique({ where: { sc_id } })
    if (!parent) { skipped++; continue }

    const data = {
      siyou_u_id: row["siyou_u_id"] ? String(row["siyou_u_id"]) : null,
      page: row["頁"] ? String(row["頁"]) : null,
      biko: row["備考"] ? String(row["備考"]) : null,
      biko_siyou: row["備考_仕様書"] ? String(row["備考_仕様書"]) : null,
      kosei_type: row["校正種"] ? String(row["校正種"]) : null,
      kosei_stage: row["校正段階"] ? String(row["校正段階"]) : null,
      paper_name: row["用紙名"] ? String(row["用紙名"]) : null,
      paper_weight: row["用紙連量"] ? String(row["用紙連量"]) : null,
      part_name: row["パーツ名"] ? String(row["パーツ名"]) : null,
      color_omote: row["色表"] ? String(row["色表"]) : null,
      color_ura: row["色裏"] ? String(row["色裏"]) : null,
      maisu: row["枚数"] ? String(row["枚数"]) : null,
      menzuke_daisuu: numOrNull(row["面付台数"]),
      flg_dgs: row["flg_dgs"] ? String(row["flg_dgs"]) : null,
      dgs_sensuu: row["DGS_線数"] ? String(row["DGS_線数"]) : null,
      dgs_seikei_teishutsu: numOrNull(row["DGS_成形提出数"]),
      dgs_kakou_ari_teishutsu: numOrNull(row["DGS_加工有_提出"]),
      dgs_kakou_nashi_teishutsu: numOrNull(row["DGS_加工無_提出"]),
      dgs_kakou_ari_hikae: numOrNull(row["DGS_加工有_控え"]),
      dgs_kakou_nashi_hikae: numOrNull(row["DGS_加工無_控え"]),
      dgs_kakou_ari_sousuu: numOrNull(row["DGS_加工有_総数"]),
      dgs_kakou_nashi_sousuu: numOrNull(row["DGS_加工無_総数"]),
      dgs_sousuu: numOrNull(row["DGS_総数"]),
      dgs_yohaku_dansai_ari_maisu: numOrNull(row["DGS_余白断裁_有_枚数"]),
      dgs_yohaku_dansai_nashi_maisu: numOrNull(row["DGS_余白断裁_無_枚数"]),
      dgs_hira_ari_maisu: numOrNull(row["DGS_平_有_枚数"]),
      dgs_hira_nashi_maisu: numOrNull(row["DGS_平_無_枚数"]),
      dgs_hikae_goukei: numOrNull(row["DGS_控え合計"]),
      nyuko_date: excelDateToJs(row["入稿日付"]),
      nyuko_time: excelTimeToStr(row["入稿時刻"]),
      shiage_date: excelDateToJs(row["仕上日付"]),
      shiage_time: excelTimeToStr(row["仕上時刻"]),
      fm_created_at: excelDateToJs(row["TimeStamp_作成情報"]),
      fm_updated_at: excelDateToJs(row["TimeStamp_修正情報"]),
      scId: sc_id,
    }

    await prisma.dppScheduleArchivePart.upsert({
      where: { dsi_u_id },
      update: data,
      create: { ...data, dsi_u_id },
    })
  }

  const newOffset = offset + chunk.length
  const done = newOffset >= total
  return NextResponse.json({ ok: true, count: chunk.length, total, offset: newOffset, done, skipped })
}
