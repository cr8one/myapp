import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"

const s3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})
const CHUNK = 100

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { key, offset } = await req.json()

  const obj = await s3.send(new GetObjectCommand({
    Bucket: "japan-sleeve-system-files-936533876784",
    Key: key,
  }))
  const raw = await obj.Body!.transformToString("utf-8")
  const text = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw
  const lines = text.split("\n").filter(l => l.trim() !== "")
  const dataLines = lines.slice(1)
  const total = dataLines.length
  const chunk = dataLines.slice(offset, offset + CHUNK)

  const last = await prisma.dppSchedule.findFirst({ orderBy: { schedule_no: "desc" } })
  let nextNum = last ? parseInt(last.schedule_no) + 1 : 1

  for (const line of chunk) {
    const cols = line.match(/("([^"]*)"|([^,]*))(,|$)/g)
      ?.map(c => c.replace(/^"|"$|,$/g, "").trim()) ?? []
    const [
      schedule_no, kosei_stage, hinban, hinmei, artist_name,
      nouki_date, nouki_time, progress, shuukei_daisuu,
      eigyo_tanto, seihan_tanto, biko
    ] = cols

    const data = {
      kosei_stage: kosei_stage || null,
      hinban: hinban || null,
      hinmei: hinmei || null,
      artist_name: artist_name || null,
      nouki_date: nouki_date ? new Date(nouki_date) : null,
      nouki_time: nouki_time || null,
      progress: progress || null,
      shuukei_daisuu: shuukei_daisuu ? parseFloat(shuukei_daisuu) : null,
      eigyo_tanto: eigyo_tanto || null,
      seihan_tanto: seihan_tanto || null,
      biko: biko || null,
      flg_del: 0,
      updated_at: new Date(),
    }

    const targetNo = schedule_no || String(nextNum).padStart(5, "0")
    if (!schedule_no) nextNum++

    await prisma.dppSchedule.upsert({
      where: { schedule_no: targetNo },
      update: data,
      create: { ...data, schedule_no: targetNo },
    })
  }

  const newOffset = offset + chunk.length
  const done = newOffset >= total
  return NextResponse.json({ ok: true, count: chunk.length, total, offset: newOffset, done })
}
