import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { requirePermission } from "@/lib/permissions"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import iconv from "iconv-lite"
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
  const denied = await requirePermission("dppStorageLedgerImport")
  if (denied) return denied
  const { key, offset } = await req.json()
  const CHUNK = 100
  const s3Res = await s3.send(new GetObjectCommand({
    Bucket: "japan-sleeve-system-files-936533876784",
    Key: key,
  }))
  const raw = await s3Res.Body?.transformToByteArray()
  if (!raw) return NextResponse.json({ error: "ファイル取得失敗" }, { status: 500 })
  const text = iconv.decode(Buffer.from(raw), "shift_jis").replace(/^\uFEFF/, "")
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  // ヘッダー行の有無を問わず、先頭が数値のみの行はデータ行として扱う。
  // FileMaker書き出しにヘッダーが付く場合を考慮し、1行目が「保管場所」等の文字列ヘッダーなら除外する。
  const looksLikeHeader = lines.length > 0 && !/^\d/.test(parseCSVLine(lines[0])[0] ?? "")
  const dataLines = looksLikeHeader ? lines.slice(1) : lines
  const total = dataLines.length
  const chunk = dataLines.slice(offset, offset + CHUNK)
  let count = 0
  for (const line of chunk) {
    const clean = parseCSVLine(line)
    const [storage_location, hinban, category] = clean
    if (!storage_location || !hinban) continue
    await prisma.dppStorageLedgerEntry.create({
      data: {
        storage_location,
        hinban,
        category: category || null,
      },
    })
    count++
  }
  const done = offset + CHUNK >= total
  return NextResponse.json({ ok: true, count, total, offset: offset + CHUNK, done })
}
