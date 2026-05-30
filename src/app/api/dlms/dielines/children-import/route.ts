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

  // 親レコードのマップを作成
  const allParents = await prisma.dlmsDielineParent.findMany({
    select: { id: true, uid_ntemp: true },
  })
  const parentMap = new Map(allParents.map(p => [p.uid_ntemp, p.id]))

  let count = 0
  const errors: string[] = []

  for (const line of chunk) {
    const clean = parseCSVLine(line)
    const [uid_ntemp, edaban, han, me, kiri, men, sizey, sizex, 咥え, location] = clean

    if (!uid_ntemp || !edaban) continue

    const parentId = parentMap.get(uid_ntemp)
    if (!parentId) {
      errors.push(`型番号 "${uid_ntemp}" が見つかりません`)
      continue
    }

    const edabanPadded = String(parseInt(edaban)).padStart(2, "0")

    // 既存の枝番を検索
    const existing = await prisma.dlmsDielineChild.findFirst({
      where: { parentId, edaban: edabanPadded, flg_del: 0 },
    })

    const data = {
      han: han || null,
      me: me || null,
      kiri: kiri || null,
      men: men || null,
      sizey: sizey ? parseFloat(sizey) : null,
      sizex: sizex ? parseFloat(sizex) : null,
      咥え: 咥え ? parseFloat(咥え) : null,
      location: location || null,
    }

    if (existing) {
      await prisma.dlmsDielineChild.update({
        where: { id: existing.id },
        data,
      })
    } else {
      await prisma.dlmsDielineChild.create({
        data: { ...data, parentId, edaban: edabanPadded },
      })
    }
    count++
  }

  const done = offset + CHUNK >= total
  return NextResponse.json({ ok: true, count, total, offset: offset + CHUNK, done, errors })
}
