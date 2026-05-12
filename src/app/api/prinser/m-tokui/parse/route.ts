import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"

const s3 = new S3Client({ region: "ap-northeast-1", requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED" })
const BUCKET = "japan-sleeve-system-files-936533876784"

const CSV_COLUMNS = [
  "tokuicd","tokuinm","tokuinm2","tokuinm3","ryk_nm","tokuikana","del_flg",
  "dtindt","dtintm","dtupdt","dtuptm","aitesaki_bumon_kanji","aitesaki_tantosya",
  "aitesaki_address1","aitesaki_address2","aitesaki_address3","aitesaki_yubin_no",
  "aitesaki_tel_no","tantosya_cd","tiiki_cd","gyosyu_cd","best_juni","kyakusaki_bunrui",
  "gaityu_bunrui","nokyo_kbn","sime_date","zei_kbn","aitesaki_kbn","hon_kari_kbn",
  "president","kabu","oya_tokui_cd","aitesaki_fax_no","group_tokui_cd","seikyum_cd",
  "furikomis_cd","tmail","kagami_flg","ky_mon","ky_dt","zzan_sei_flg","ny_houhou",
  "ny_kamoku_cd","nykoza_cd","fx4_tokui_cd","hasu_kbn","shohizei_kbn","tokuisaki_cd",
  "siten_cd","syk_yobi_flg","mitsumorisho_id","mitsumori_calc_id","syukin_syubetu1",
  "syukin_koza1","syukin_syubetu2","syukin_koza2","syukin_tani","syukin_kingaku",
  "kin_hasu_kbn","zei_marume_tani","mototyo_vis_flg","sony_flg","nohon_kensa_kikaku_id",
  "seikyu_kbn","non_entertainment_flg","smc_online_flg"
]

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { key } = await req.json()
  if (!key) return NextResponse.json({ error: "No key" }, { status: 400 })

  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  const response = await s3.send(command)
  const chunks: Uint8Array[] = []
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) { chunks.push(chunk) }
  const buffer = Buffer.concat(chunks)

  const { TextDecoder } = require("util")
  const decoder = new TextDecoder("shift-jis")
  const text = decoder.decode(buffer)
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean)

  const records = lines.map((line: string) => {
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
  }).filter((r: Record<string, string>) =>
    r.tokuisaki_cd && r.tokuisaki_cd.trim() !== "" &&
    r.siten_cd && r.siten_cd.trim() !== ""
  )

  return NextResponse.json({ records })
}
