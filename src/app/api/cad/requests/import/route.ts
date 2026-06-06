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

  // S3からCSV取得
  const obj = await s3.send(new GetObjectCommand({
    Bucket: "japan-sleeve-system-files-936533876784",
    Key: key,
  }))
  const raw = await obj.Body!.transformToString("utf-8")
  const text = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw // BOM除去

  const lines = text.split("\n").filter(l => l.trim() !== "")
  const dataLines = lines.slice(1) // ヘッダー除去
  const total = dataLines.length
  const chunk = dataLines.slice(offset, offset + CHUNK)

  // 採番用：現在の最大uid取得
  const last = await prisma.cadRequest.findFirst({ orderBy: { uid: "desc" } })
  let nextNum = last ? parseInt(last.uid) + 1 : 10001

  for (const line of chunk) {
    const cols = line.match(/("([^"]*)"|([^,]*))(,|$)/g)
      ?.map(c => c.replace(/^"|"$|,$/g, "").trim()) ?? []

    const [
      uid, request_date, request_time, requester_name, department, content,
      client, title, genre, hinmoku, hinban, dieline_no,
      develop_y, develop_x, paper, finish_count,
      desired_date, desired_time, tray, degi_spec, tray_count, pocket, remarks
    ] = cols

    const data = {
      request_date: request_date ? new Date(request_date) : new Date(),
      request_time: request_time || "",
      requester_name: requester_name || "",
      department: department || null,
      content: content || null,
      client: client || null,
      title: title || null,
      genre: genre || null,
      hinmoku: hinmoku || null,
      hinban: hinban || null,
      dieline_no: dieline_no || null,
      develop_y: develop_y ? parseFloat(develop_y) : null,
      develop_x: develop_x ? parseFloat(develop_x) : null,
      paper: paper || null,
      finish_count: finish_count ? parseInt(finish_count) : null,
      desired_date: desired_date ? new Date(desired_date) : null,
      desired_time: desired_time || null,
      tray: tray || null,
      degi_spec: degi_spec || null,
      tray_count: tray_count ? parseInt(tray_count) : null,
      pocket: pocket || null,
      remarks: remarks || null,
      flg_del: 0,
      updated_at: new Date(),
    }

    const targetUid = uid || String(nextNum).padStart(5, "0")
    if (!uid) nextNum++

    await prisma.cadRequest.upsert({
      where: { uid: targetUid },
      update: data,
      create: { ...data, uid: targetUid },
    })
  }

  const newOffset = offset + chunk.length
  const done = newOffset >= total

  return NextResponse.json({ ok: true, count: chunk.length, total, offset: newOffset, done })
}
