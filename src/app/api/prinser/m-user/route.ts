import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3 = new S3Client({ region: "ap-northeast-1" })
const BUCKET = "japan-sleeve-system-files-936533876784"

const CSV_COLUMNS = [
  "uid","upass","unm","ukana","kencd","biko","ukbn","ulevel","listflg","folder_dl",
  "kanriuid","bumon_cd","ukbn_eigyo","ukbn_koumu","ukbn_prep","ukbn_press","ukbn_kako",
  "ukbn_gaichu","ukbn_yoshi","ukbn_haiso","ukbn_sappan","ukbn_dansai","ukbn_koujyo",
  "ukbn_cv","ukbn_gehan","utel","ufax","umail","del_flg","dtindt","dtintm","dtupdt",
  "dtuptm","cv_upfolder","smc_uid","smc_upass","ukbn_kobetuseikyu","ukbn_sz","smc_unm",
  "ukbn_tray","ukbn_genka","menu_kbn","siyo_disp_kako","siyo_disp_sample_seal",
  "siyo_disp_youchui","siyo_disp__tray","siyo_disp_henkorireki","jt_disp_kako",
  "jt_disp_gaichu","jt_disp_henkoirai","jt_disp_genkauchiwake","jt_disp_nohinjyoho",
  "jt_disp_henkorireki","yoteihyo_tanto_gehan","yoteihyo_tanto_ctp","yoteihyo_tanto_film",
  "yoteihyo_tanto_kenpan","yoteihyo_tanto_insatsu","yoteihyo_tanto_hyomenkako",
  "yoteihyo_tanto_nuki","yoteihyo_tanto_ori","yoteihyo_tanto_seihon","yoteihyo_tanto_nagekomi",
  "yoteihyo_tanto_dansai","yoteihyo_tanto_siage","yoteihyo_tanto_hari","yoteihyo_tanto_trayhari",
  "hinban_sakujyo","ukbn_nyuryoku","kanribumon","jimusyo","ukbn_password","wgs_login_flg",
  "wgs_login_dt","wgs_login_tm","wgs_logout_dt","wgs_logout_tm","gaichu_flg","gaichu_cd",
  "mitsumonavi_user_flg"
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
  }).filter(r => r.uid && r.uid.trim() !== "")
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword")
  const delFlg = searchParams.get("delFlg")

  const users = await prisma.prinserMUser.findMany({
    where: {
      ...(keyword ? {
        OR: [
          { uid: { contains: keyword } },
          { unm: { contains: keyword } },
          { ukana: { contains: keyword } },
          { umail: { contains: keyword } },
          { bumon_cd: { contains: keyword } },
        ]
      } : {}),
      ...(delFlg !== null && delFlg !== "" ? { del_flg: delFlg } : {}),
    },
    orderBy: { uid: "asc" },
  })
  return NextResponse.json(users)
}

// presigned URL発行
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const key = `prinser/m_user_import_${Date.now()}.csv`
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: "text/csv",
  })
  const url = await getSignedUrl(s3, command, { expiresIn: 300 })
  return NextResponse.json({ url, key })
}

// S3からCSVを取得してDB保存
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { key } = await req.json()
  if (!key) return NextResponse.json({ error: "No key" }, { status: 400 })

  // S3からファイル取得
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  const response = await s3.send(command)
  const chunks: Uint8Array[] = []
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk)
  }
  const buffer = Buffer.concat(chunks)

  // Shift-JISパース
  const records = parseShiftJisCsv(buffer)
  if (records.length === 0) {
    return NextResponse.json({ error: "No records" }, { status: 400 })
  }

  // DB保存（upsert）
  let count = 0
  for (const r of records) {
    if (!r.uid) continue
    await prisma.prinserMUser.upsert({
      where: { uid: r.uid },
      update: {
        upass: r.upass || null, unm: r.unm || null, ukana: r.ukana || null,
        kencd: r.kencd || null, biko: r.biko || null, ukbn: r.ukbn || null,
        ulevel: r.ulevel || null, listflg: r.listflg || null, kanriuid: r.kanriuid || null,
        bumon_cd: r.bumon_cd || null, utel: r.utel || null, ufax: r.ufax || null,
        umail: r.umail || null, del_flg: r.del_flg || null, dtindt: r.dtindt || null,
        dtupdt: r.dtupdt || null, kanribumon: r.kanribumon || null, jimusyo: r.jimusyo || null,
        gaichu_flg: r.gaichu_flg || null, gaichu_cd: r.gaichu_cd || null,
        rawData: JSON.stringify(r),
      },
      create: {
        uid: r.uid, upass: r.upass || null, unm: r.unm || null, ukana: r.ukana || null,
        kencd: r.kencd || null, biko: r.biko || null, ukbn: r.ukbn || null,
        ulevel: r.ulevel || null, listflg: r.listflg || null, kanriuid: r.kanriuid || null,
        bumon_cd: r.bumon_cd || null, utel: r.utel || null, ufax: r.ufax || null,
        umail: r.umail || null, del_flg: r.del_flg || null, dtindt: r.dtindt || null,
        dtupdt: r.dtupdt || null, kanribumon: r.kanribumon || null, jimusyo: r.jimusyo || null,
        gaichu_flg: r.gaichu_flg || null, gaichu_cd: r.gaichu_cd || null,
        rawData: JSON.stringify(r),
      },
    })
    count++
  }

  return NextResponse.json({ ok: true, count })
}

export async function DELETE() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await prisma.prinserMUser.deleteMany({})
  return NextResponse.json({ ok: true })
}
