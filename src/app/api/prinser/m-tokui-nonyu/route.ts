import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
export const maxDuration = 60
const s3 = new S3Client({ region: "ap-northeast-1", requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED" })
const BUCKET = "japan-sleeve-system-files-936533876784"
const PAGE_SIZE = 50
const CSV_COLUMNS = [
  "tokuicd","tokuinm","tantou_nm","nonyu_cd","nonyu_nm1","nonyu_nm2",
  "nonyu_kana","nonyu_kigou","sy_shoyou_nissu","yubin_no","address1","address2",
  "tel_no","fax_no","tekiyou","dtindt","dtintm","dtinuid","dtupdt","dtuptm",
  "dtupuid","del_flg","mitsumonavi_nohinsaki_name"
]
function parseShiftJisCsv(buffer: Buffer): Record<string, string>[] {
  const { TextDecoder } = require("util")
  const decoder = new TextDecoder("shift-jis")
  const text = decoder.decode(buffer)
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean)
  return lines.map((line: string) => {
    const values: string[] = []
    let current = ""
    let inQuotes = false
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes }
      else if (char === "," && !inQuotes) { values.push(current); current = "" }
      else { current += char }
    }
    values.push(current)
    const row: Record<string, string> = {}
    CSV_COLUMNS.forEach((col, i) => { row[col] = values[i] ?? "" })
    return row
  }).filter((r: Record<string, string>) => r.nonyu_cd && r.nonyu_cd.trim() !== "")
}
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword")
  const delFlg = searchParams.get("delFlg")
  const page = parseInt(searchParams.get("page") ?? "1") || 1
  const where = {
    ...(keyword ? { OR: [
      { nonyu_cd: { contains: keyword } },
      { nonyu_nm1: { contains: keyword } },
      { nonyu_nm2: { contains: keyword } },
      { nonyu_kana: { contains: keyword } },
      { tokuicd: { contains: keyword } },
      { tokuinm: { contains: keyword } },
    ]} : {}),
    ...(delFlg !== null && delFlg !== "" ? { del_flg: parseInt(delFlg) } : {}),
  }
  const [records, total] = await Promise.all([
    prisma.prinserMTokuiNonyu.findMany({
      where,
      orderBy: { nonyu_cd: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.prinserMTokuiNonyu.count({ where }),
  ])
  return NextResponse.json({ records, total })
}
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const key = `prinser/m_tokui_nonyu_import_${Date.now()}.csv`
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: "text/csv" })
  const url = await getSignedUrl(s3, command, { expiresIn: 300 })
  return NextResponse.json({ url, key })
}
export async function DELETE() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await prisma.prinserMTokuiNonyu.deleteMany({})
  return NextResponse.json({ ok: true })
}
