import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"

const s3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})

function parseCSVLine(line: string): string[] {
  const cols: string[] = []
  let field = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { field += '"'; i++ }
      else if (ch === '"') { inQuotes = false }
      else { field += ch }
    } else {
      if (ch === '"') { inQuotes = true }
      else if (ch === ',') { cols.push(field.trim()); field = "" }
      else { field += ch }
    }
  }
  cols.push(field.trim())
  return cols
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { key, offset } = await req.json()
  const CHUNK = 100

  const s3Res = await s3.send(new GetObjectCommand({
    Bucket: "japan-sleeve-system-files-936533876784",
    Key: key,
  }))
  const raw = await s3Res.Body?.transformToByteArray()
  if (!raw) return NextResponse.json({ error: "ファイル取得失敗" }, { status: 500 })

  const textRaw = new TextDecoder("utf-8").decode(raw)
  const text = textRaw.replace(/^\uFEFF/, "")
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  const dataLines = lines.slice(1)
  const total = dataLines.length
  const chunk = dataLines.slice(offset, offset + CHUNK)

  let count = 0
  for (const line of chunk) {
    const clean = parseCSVLine(line)
    const [
      genre, spec, hinmoku, tag1, tag2,
      genre_sort, spec_sort, hinmoku_sort, tag1_sort, tag2_sort,
    ] = clean

    if (!genre && !spec && !hinmoku && !tag1) continue

    await prisma.dlmsTypeCondition.create({
      data: {
        genre: genre || null,
        spec: spec || null,
        hinmoku: hinmoku || null,
        tag1: tag1 || null,
        tag2: tag2 || null,
        genre_sort: parseInt(genre_sort) || 0,
        spec_sort: parseInt(spec_sort) || 0,
        hinmoku_sort: parseInt(hinmoku_sort) || 0,
        tag1_sort: parseInt(tag1_sort) || 0,
        tag2_sort: parseInt(tag2_sort) || 0,
      },
    })
    count++
  }

  const done = offset + CHUNK >= total
  return NextResponse.json({ ok: true, count, total, offset: offset + CHUNK, done })
}
