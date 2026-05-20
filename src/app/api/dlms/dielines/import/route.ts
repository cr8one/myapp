import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"

const s3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { key, offset } = await req.json()
  const CHUNK = 100

  // S3からCSV取得
  const s3Res = await s3.send(new GetObjectCommand({
    Bucket: "japan-sleeve-system-files-936533876784",
    Key: key,
  }))
  const raw = await s3Res.Body?.transformToByteArray()
  if (!raw) return NextResponse.json({ error: "ファイル取得失敗" }, { status: 500 })

  // Shift-JISデコード
  const text = new TextDecoder("shift-jis").decode(raw)
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  const dataLines = lines.slice(1) // ヘッダースキップ
  const total = dataLines.length
  const chunk = dataLines.slice(offset, offset + CHUNK)

  let count = 0
  for (const line of chunk) {
    const cols = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g) ?? []
    const clean = cols.map(c => c.replace(/^"|"$/g, "").trim())

    const [
      uid_ntemp, kyugataban, genre, spec, hinmoku,
      , , sizey, sizex, widthy,
      cond1, cond2, cond3, cond4,
    ] = clean

    if (!uid_ntemp) continue

    const conditions = [cond1, cond2, cond3, cond4]
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
        sizey: sizey ? parseFloat(sizey) : null,
        sizex: sizex ? parseFloat(sizex) : null,
        widthy: widthy ? parseFloat(widthy) : null,
        conditions: { create: conditions },
      },
      update: {
        kyugataban: kyugataban || null,
        genre: genre || null,
        spec: spec || null,
        hinmoku: hinmoku || null,
        sizey: sizey ? parseFloat(sizey) : null,
        sizex: sizex ? parseFloat(sizex) : null,
        widthy: widthy ? parseFloat(widthy) : null,
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
