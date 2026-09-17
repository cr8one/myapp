import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
export const maxDuration = 60
const s3 = new S3Client({ region: "ap-northeast-1", requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED" })
const BUCKET = "japan-sleeve-system-files-936533876784"
const CSV_COLUMNS = [
  "t_shop","t_maker","t_type","tray_cd","tray_nm","t_atumi","t_logo","t_foot","t_col",
  "bikou","tray_nm2","t_wide","tray_tanka","rendo_tray_cd","t_sort","del_flg",
  "dtindt","dtintm","dtinuid","dtupdt","dtuptm","dtupuid","tray_ryaku_nm","tray_warimashi"
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
  }).filter((r: Record<string, string>) => r.tray_cd && r.tray_cd.trim() !== "")
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
    if (!r.tray_cd) continue
    const data = {
      t_shop: r.t_shop || "",
      t_maker: r.t_maker || "",
      t_type: r.t_type || "",
      tray_nm: r.tray_nm || "",
      t_atumi: r.t_atumi ? parseInt(r.t_atumi) : 0,
      t_logo: r.t_logo || "",
      t_foot: r.t_foot || "",
      t_col: r.t_col || "",
      bikou: r.bikou || "",
      tray_nm2: r.tray_nm2 || "",
      t_wide: r.t_wide || null,
      tray_tanka: r.tray_tanka ? r.tray_tanka : null,
      rendo_tray_cd: r.rendo_tray_cd || "",
      t_sort: r.t_sort ? parseInt(r.t_sort) : 0,
      del_flg: r.del_flg ? parseInt(r.del_flg) : 0,
      dtindt: r.dtindt || "",
      dtintm: r.dtintm || "",
      dtinuid: r.dtinuid || "",
      dtupdt: r.dtupdt || "",
      dtuptm: r.dtuptm || "",
      dtupuid: r.dtupuid || "",
      tray_ryaku_nm: r.tray_ryaku_nm || "",
      tray_warimashi: r.tray_warimashi ? r.tray_warimashi : 0,
      rawData: JSON.stringify(r),
    }
    await prisma.prinserMTray.upsert({
      where: { tray_cd: r.tray_cd },
      update: data,
      create: { tray_cd: r.tray_cd, ...data },
    })
    count++
  }
  const done = offset + CHUNK_SIZE >= total
  return NextResponse.json({ ok: true, count, total, done })
}
