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

  const text = new TextDecoder("shift-jis").decode(raw)
  const lines = text.split(/\r?\n/).filter(l => l.trim())

  // ヘッダーから条件列数を動的に判定（固定14列以降が条件列）
  const headers = parseCSVLine(lines[0])
  const condStartIndex = 14
  const condCount = headers.slice(condStartIndex).filter(h => h.startsWith("条件")).length

  const dataLines = lines.slice(1)
  const total = dataLines.length
  const chunk = dataLines.slice(offset, offset + CHUNK)

  let count = 0
  for (const line of chunk) {
    const clean = parseCSVLine(line)
    const [
      uid_ntemp, kyugataban, genre, spec, hinmoku,
      developy, developx, develop_depth,
      sizey, sizex, widthy,
      inner_height, inner_width, inner_depth,
    ] = clean

    if (!uid_ntemp) continue

    const conditions = clean.slice(condStartIndex, condStartIndex + condCount)
      .filter(Boolean)
      .map((value, i) => ({ value, sortOrder: i }))

    await prisma.dlmsDielineParent.upsert({
      where: { uid_ntemp },
      create: {
        uid_ntemp,
        kyugataban: kyugataban || null,
        genre: genre || null,
        spec: spec || null,
        hinmoku: hinmoku || null,
        developy: developy ? parseFloat(developy) : null,
        developx: developx ? parseFloat(developx) : null,
        develop_depth: develop_depth ? parseFloat(develop_depth) : null,
        sizey: sizey ? parseFloat(sizey) : null,
        sizex: sizex ? parseFloat(sizex) : null,
        widthy: widthy ? parseFloat(widthy) : null,
        inner_height: inner_height ? parseFloat(inner_height) : null,
        inner_width: inner_width ? parseFloat(inner_width) : null,
        inner_depth: inner_depth ? parseFloat(inner_depth) : null,
        conditions: { create: conditions },
      },
      update: {
        kyugataban: kyugataban || null,
        genre: genre || null,
        spec: spec || null,
        hinmoku: hinmoku || null,
        developy: developy ? parseFloat(developy) : null,
        developx: developx ? parseFloat(developx) : null,
        develop_depth: develop_depth ? parseFloat(develop_depth) : null,
        sizey: sizey ? parseFloat(sizey) : null,
        sizex: sizex ? parseFloat(sizex) : null,
        widthy: widthy ? parseFloat(widthy) : null,
        inner_height: inner_height ? parseFloat(inner_height) : null,
        inner_width: inner_width ? parseFloat(inner_width) : null,
        inner_depth: inner_depth ? parseFloat(inner_depth) : null,
        conditions: {
          deleteMany: {},
          create: conditions,
        },
      },
    })
    count++
  }

  const done = offset + CHUNK >= total
  return NextResponse.json({ ok: true, count, total, offset: offset + CHUNK, done })
}
