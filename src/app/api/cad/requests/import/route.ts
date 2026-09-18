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

  // S3からExcelファイル取得
  const obj = await s3.send(new GetObjectCommand({
    Bucket: "japan-sleeve-system-files-936533876784",
    Key: key,
  }))
  const buf = Buffer.from(await obj.Body!.transformToByteArray())

  const sheets = readXlsxWorkbook(buf)
  const dataRows = sheets["CadRequests"] ?? []
  const total = dataRows.length
  const chunk = dataRows.slice(offset, offset + CHUNK)

  // 採番用：現在の最大uid取得
  const last = await prisma.cadRequest.findFirst({ orderBy: { uid: "desc" } })
  let nextNum = last ? parseInt(last.uid) + 1 : 10001

  for (const row of chunk) {
    const uid = str(row["依頼番号"])
    const request_date = toDateStr(row["依頼日"])
    const request_time = str(row["依頼時刻"])
    const requester_name = str(row["依頼営業名"])
    const department = str(row["依頼部署"])
    const content = str(row["依頼内容"])
    const client = str(row["クライアント"])
    const title = str(row["タイトル"])
    const genre = str(row["ジャンル"])
    const hinmoku = str(row["品目名"])
    const hinban = str(row["品番"])
    const status = str(row["ステータス"])
    const dieline_no = str(row["型台帳番号"])
    const develop_y = str(row["展開天地"])
    const develop_x = str(row["展開左右"])
    const paper = str(row["用紙"])
    const finish_count = str(row["仕上個数"])
    const desired_date = toDateStr(row["希望納期日"])
    const desired_time_raw = str(row["希望納期時刻"])
    const { kbn: desired_time_kbn, time: desired_time } = parseDesiredTimeLabel(desired_time_raw)
    const flg_tray_spec = str(row["トレイ仕様flg"])
    const tray = str(row["使用トレイ"])
    const degi_spec = str(row["デジ仕様"])
    const tray_count = str(row["トレイ枚数"])
    const pocket = str(row["ポケット"])
    const remarks = str(row["備考"])

    const data = {
      request_date: request_date ? new Date(request_date) : new Date(),
      request_time: request_time || "",
      requester_name: requester_name || "",
      department: department || null,
      content: content || null,
      client: client || null,
      title: title || null,
      genre: genre || null,
      hinmoku: hinmoku || null,
      hinban: hinban || null,
      status: status || "作成中",
      dieline_no: dieline_no || null,
      develop_y: develop_y ? parseFloat(develop_y) : null,
      develop_x: develop_x ? parseFloat(develop_x) : null,
      paper: paper || null,
      finish_count: finish_count ? parseInt(finish_count) : null,
      desired_date: desired_date ? new Date(desired_date) : null,
      desired_time: desired_time,
      desired_time_kbn,
      tray: tray || null,
      degi_spec: degi_spec || null,
      flg_tray_spec: flg_tray_spec === "1" ? 1 : 0,
      tray_count: tray_count || null,
      pocket: pocket || null,
      remarks: remarks || null,
      flg_del: 0,
      updated_at: new Date(),
    }

    const targetUid = uid || String(nextNum).padStart(5, "0")
    if (!uid) nextNum++

    await prisma.cadRequest.upsert({
      where: { uid: targetUid },
      update: data,
      create: { ...data, uid: targetUid },
    })
  }

  const newOffset = offset + chunk.length
  const done = newOffset >= total

  return NextResponse.json({ ok: true, count: chunk.length, total, offset: newOffset, done })
}
