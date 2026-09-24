import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { readXlsxWorkbook } from "@/lib/xlsx-io"
import { parseDesiredTimeLabel } from "@/lib/desired-time"

const s3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})

const CHUNK = 100

function str(v: unknown): string {
  if (v === null || v === undefined) return ""
  return String(v).trim()
}

function toDateStr(v: unknown): string {
  if (v === null || v === undefined || v === "") return ""
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v).trim()
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { key, offset } = await req.json()

  const obj = await s3.send(new GetObjectCommand({
    Bucket: "japan-sleeve-system-files-936533876784",
    Key: key,
  }))
  const buf = Buffer.from(await obj.Body!.transformToByteArray())

  const sheets = readXlsxWorkbook(buf)
  const dataRows = sheets["DxfRequests"] ?? []
  const total = dataRows.length
  const chunk = dataRows.slice(offset, offset + CHUNK)

  // 採番用：数値キャストで安全にMAX取得（文字列桁数混在によるソート誤判定を防ぐ、CAD依頼書と同様の対策）
  const maxResult = await prisma.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(uid AS INTEGER)) as max FROM t_dxf_requests WHERE uid ~ '^[0-9]+$'
  `
  let nextNum = (maxResult[0]?.max ?? 0) + 1

  for (const row of chunk) {
    const uid = str(row["依頼番号"])
    const id_cad = str(row["CAD依頼書No"])
    const request_date = toDateStr(row["依頼日"])
    const request_time = str(row["依頼時刻"])
    const desired_date = toDateStr(row["希望納期日"])
    const desired_time_raw = str(row["希望納期時刻"])
    const { kbn: desired_time_kbn, time: desired_time } = parseDesiredTimeLabel(desired_time_raw)
    const purpose = str(row["目的"])
    const remarks = str(row["備考"])
    const worker = str(row["作業担当"])
    const status = str(row["ステータス"])

    const data = {
      id_cad: id_cad || null,
      request_date: request_date || "",
      request_time: request_time || "",
      desired_date: desired_date ? new Date(desired_date) : null,
      desired_time,
      desired_time_kbn,
      purpose: purpose || null,
      remarks: remarks || null,
      worker: worker || null,
      status: status || null,
      flg_del: 0,
      updated_at: new Date(),
    }

    const targetUid = uid || String(nextNum).padStart(6, "0")
    if (!uid) nextNum++

    await prisma.dxfRequest.upsert({
      where: { uid: targetUid },
      update: data,
      create: { ...data, uid: targetUid },
    })
  }

  const newOffset = offset + chunk.length
  const done = newOffset >= total

  return NextResponse.json({ ok: true, count: chunk.length, total, offset: newOffset, done })
}