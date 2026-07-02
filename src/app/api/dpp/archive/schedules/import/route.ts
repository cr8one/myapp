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

  for (const row of chunk) {
    const sc_id = row["sc_id"] ? String(row["sc_id"]).trim() : ""
    if (!sc_id) continue

    const data = {
      hinban: row["品番"] ? String(row["品番"]) : null,
      hinmei: row["品名"] ? String(row["品名"]) : null,
      artist_name: row["アーティスト名"] ? String(row["アーティスト名"]) : null,
      kosei_stage: row["校正段階"] ? String(row["校正段階"]) : null,
      nouki_date: excelDateToJs(row["納期日付"]),
      nouki_time: excelTimeToStr(row["納期時刻"]),
      progress: row["進捗"] ? String(row["進捗"]) : null,
      eigyo_tanto: row["営業担当"] ? String(row["営業担当"]) : null,
      seihan_tanto: row["製版担当"] ? String(row["製版担当"]) : null,
      biko: row["備考"] ? String(row["備考"]) : null,
      shuukei_daisuu: row["集計台数"] ? parseFloat(String(row["集計台数"])) : null,
      fm_created_at: excelDateToJs(row["TimeStamp_作成情報"]),
      fm_updated_at: excelDateToJs(row["TimeStamp_修正情報"]),
    }

    await prisma.dppScheduleArchive.upsert({
      where: { sc_id },
      update: data,
      create: { ...data, sc_id },
    })
  }

  const newOffset = offset + chunk.length
  const done = newOffset >= total
  return NextResponse.json({ ok: true, count: chunk.length, total, offset: newOffset, done })
}
