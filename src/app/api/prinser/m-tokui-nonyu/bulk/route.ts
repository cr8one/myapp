import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
export const maxDuration = 60
const s3 = new S3Client({ region: "ap-northeast-1", requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED" })
const BUCKET = "japan-sleeve-system-files-936533876784"
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
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { key, offset } = await req.json()
  if (!key) return NextResponse.json({ error: "No key" }, { status: 400 })
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  const response = await s3.send(command)
  const chunks: Uint8Array[] = []
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) { chunks.push(chunk) }
  const buffer = Buffer.concat(chunks)
  const allRecords = parseShiftJisCsv(buffer)
  const total = allRecords.length
  const CHUNK_SIZE = 100
  const slice = allRecords.slice(offset, offset + CHUNK_SIZE)
  let count = 0
  for (const r of slice) {
    if (!r.nonyu_cd) continue
    const data = {
      tokuicd: r.tokuicd || null,
      tokuinm: r.tokuinm || null,
      tantou_nm: r.tantou_nm || null,
      nonyu_nm1: r.nonyu_nm1 || null,
      nonyu_nm2: r.nonyu_nm2 || null,
      nonyu_kana: r.nonyu_kana || null,
      nonyu_kigou: r.nonyu_kigou || null,
      sy_shoyou_nissu: r.sy_shoyou_nissu ? parseInt(r.sy_shoyou_nissu) : 0,
      yubin_no: r.yubin_no || null,
      address1: r.address1 || null,
      address2: r.address2 || null,
      tel_no: r.tel_no || null,
      fax_no: r.fax_no || null,
      tekiyou: r.tekiyou || null,
      dtindt: r.dtindt || "",
      dtintm: r.dtintm || "",
      dtinuid: r.dtinuid || "",
      dtupdt: r.dtupdt || "",
      dtuptm: r.dtuptm || "",
      dtupuid: r.dtupuid || "",
      del_flg: r.del_flg ? parseInt(r.del_flg) : 0,
      mitsumonavi_nohinsaki_name: r.mitsumonavi_nohinsaki_name || "",
      rawData: JSON.stringify(r),
    }
    await prisma.prinserMTokuiNonyu.upsert({
      where: { nonyu_cd: r.nonyu_cd },
      update: data,
      create: { nonyu_cd: r.nonyu_cd, ...data },
    })
    count++
  }
  const done = offset + CHUNK_SIZE >= total
  return NextResponse.json({ ok: true, count, total, done })
}
