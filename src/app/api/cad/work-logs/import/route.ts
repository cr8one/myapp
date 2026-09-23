import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { readXlsxWorkbook } from "@/lib/xlsx-io"

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

function toTimeStr(v: unknown): string {
  if (v === null || v === undefined || v === "") return ""
  if (v instanceof Date) return v.toISOString().slice(11, 16)
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
  const dataRows = sheets["CadWorkLogs"] ?? []
  const total = dataRows.length
  const chunk = dataRows.slice(offset, offset + CHUNK)

  let created = 0
  for (const row of chunk) {
    const work_date = toDateStr(row["日付"])
    const start_time_t = toTimeStr(row["開始時刻"])
    const end_time_t = toTimeStr(row["終了時刻"])
    const request_no = str(row["依頼書No"])
    const department_group = str(row["所属G"])
    const person_in_charge = str(row["担当者"])
    const customer = str(row["顧客"])
    const title = str(row["タイトル"])
    const content = str(row["内容"])
    const parts_name = str(row["パーツ名"])
    const paper_name = str(row["用紙名"])
    const quantity = str(row["数量"])
    const remarks = str(row["備考"])
    const flg_same_day = str(row["当日対応"])
    const creator = str(row["作成者"])

    if (!work_date || !start_time_t) continue

    await prisma.cadWorkLog.create({
      data: {
        creator: creator || (session.user?.name || ""),
        work_date: new Date(work_date),
        start_time: new Date(`${work_date}T${start_time_t}:00`),
        end_time: end_time_t ? new Date(`${work_date}T${end_time_t}:00`) : null,
        request_no: request_no || null,
        department_group: department_group || null,
        person_in_charge: person_in_charge || null,
        customer: customer || null,
        title: title || null,
        content: content || null,
        parts_name: parts_name || null,
        paper_name: paper_name || null,
        quantity: quantity ? parseInt(quantity, 10) : null,
        remarks: remarks || null,
        flg_same_day: flg_same_day === "1" ? 1 : 0,
      },
    })
    created++
  }

  const newOffset = offset + chunk.length
  const done = newOffset >= total

  return NextResponse.json({ ok: true, count: created, total, offset: newOffset, done })
}