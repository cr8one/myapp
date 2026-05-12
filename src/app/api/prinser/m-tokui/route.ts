import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

export const maxDuration = 60

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
  }).filter((r: Record<string, string>) => r.tokuisaki_cd && r.tokuisaki_cd.trim() !== "" && r.siten_cd && r.siten_cd.trim() !== "")
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword")
  const delFlg = searchParams.get("delFlg")
  const records = await prisma.prinserMTokui.findMany({
    where: {
      ...(keyword ? { OR: [
        { tokuicd: { contains: keyword } },
        { tokuinm: { contains: keyword } },
        { tokuikana: { contains: keyword } },
        { tmail: { contains: keyword } },
        { aitesaki_tel_no: { contains: keyword } },
      ]} : {}),
      ...(delFlg !== null && delFlg !== "" ? { del_flg: parseInt(delFlg) } : {}),
    },
    orderBy: [{ tokuisaki_cd: "asc" }, { siten_cd: "asc" }],
  })
  return NextResponse.json(records)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const key = `prinser/m_tokui_import_${Date.now()}.csv`
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: "text/csv" })
  const url = await getSignedUrl(s3, command, { expiresIn: 300 })
  return NextResponse.json({ url, key })
}

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
  const records = parseShiftJisCsv(buffer)
  if (records.length === 0) return NextResponse.json({ error: "No records" }, { status: 400 })
  let count = 0
  for (const r of records) {
    if (!r.tokuisaki_cd || !r.siten_cd) continue
    const data = {
      tokuicd: r.tokuicd || null, tokuinm: r.tokuinm || null, tokuinm2: r.tokuinm2 || null,
      tokuinm3: r.tokuinm3 || null, ryk_nm: r.ryk_nm || null, tokuikana: r.tokuikana || null,
      del_flg: r.del_flg ? parseInt(r.del_flg) : null, dtindt: r.dtindt || null,
      dtintm: r.dtintm || null, dtupdt: r.dtupdt || null, dtuptm: r.dtuptm || null,
      aitesaki_bumon_kanji: r.aitesaki_bumon_kanji || null,
      aitesaki_tantosya: r.aitesaki_tantosya || null,
      aitesaki_address1: r.aitesaki_address1 || null, aitesaki_address2: r.aitesaki_address2 || null,
      aitesaki_address3: r.aitesaki_address3 || null, aitesaki_yubin_no: r.aitesaki_yubin_no || null,
      aitesaki_tel_no: r.aitesaki_tel_no || null, tantosya_cd: r.tantosya_cd || null,
      tiiki_cd: r.tiiki_cd || null, gyosyu_cd: r.gyosyu_cd || null, best_juni: r.best_juni || null,
      kyakusaki_bunrui: r.kyakusaki_bunrui || null, gaityu_bunrui: r.gaityu_bunrui || null,
      nokyo_kbn: r.nokyo_kbn || null, sime_date: r.sime_date || null, zei_kbn: r.zei_kbn || null,
      aitesaki_kbn: r.aitesaki_kbn || null, hon_kari_kbn: r.hon_kari_kbn || null,
      president: r.president || null, kabu: r.kabu || null, oya_tokui_cd: r.oya_tokui_cd || null,
      aitesaki_fax_no: r.aitesaki_fax_no || null, group_tokui_cd: r.group_tokui_cd || null,
      seikyum_cd: r.seikyum_cd || null, furikomis_cd: r.furikomis_cd || null,
      tmail: r.tmail || null, kagami_flg: r.kagami_flg || null, ky_mon: r.ky_mon || null,
      ky_dt: r.ky_dt || null, zzan_sei_flg: r.zzan_sei_flg || null, ny_houhou: r.ny_houhou || null,
      ny_kamoku_cd: r.ny_kamoku_cd || null, nykoza_cd: r.nykoza_cd || null,
      fx4_tokui_cd: r.fx4_tokui_cd || null, hasu_kbn: r.hasu_kbn || null,
      shohizei_kbn: r.shohizei_kbn || null, syk_yobi_flg: r.syk_yobi_flg || null,
      mitsumorisho_id: r.mitsumorisho_id || null, mitsumori_calc_id: r.mitsumori_calc_id || null,
      syukin_syubetu1: r.syukin_syubetu1 || null, syukin_koza1: r.syukin_koza1 || null,
      syukin_syubetu2: r.syukin_syubetu2 || null, syukin_koza2: r.syukin_koza2 || null,
      syukin_tani: r.syukin_tani || null, syukin_kingaku: r.syukin_kingaku || null,
      kin_hasu_kbn: r.kin_hasu_kbn || null, zei_marume_tani: r.zei_marume_tani || null,
      mototyo_vis_flg: r.mototyo_vis_flg || null, sony_flg: r.sony_flg || null,
      nohon_kensa_kikaku_id: r.nohon_kensa_kikaku_id || null, seikyu_kbn: r.seikyu_kbn || null,
      non_entertainment_flg: r.non_entertainment_flg || null, smc_online_flg: r.smc_online_flg || null,
      rawData: JSON.stringify(r),
    }
    await prisma.prinserMTokui.upsert({
      where: { tokuisaki_cd_siten_cd: { tokuisaki_cd: r.tokuisaki_cd, siten_cd: r.siten_cd } },
      update: data,
      create: { tokuisaki_cd: r.tokuisaki_cd, siten_cd: r.siten_cd, ...data },
    })
    count++
  }
  return NextResponse.json({ ok: true, count })
}

export async function DELETE() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await prisma.prinserMTokui.deleteMany({})
  return NextResponse.json({ ok: true })
}
