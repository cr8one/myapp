import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
const s3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})
const BUCKET = "japan-sleeve-system-files-936533876784"
const CHUNK = 100
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { key, offset } = await req.json()
  const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
  const raw = await obj.Body!.transformToString("utf-8")
  const text = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw
  const lines = text.split("\n").filter(l => l.trim() !== "")
  const dataLines = lines.slice(1)
  const total = dataLines.length
  const chunk = dataLines.slice(offset, offset + CHUNK)
  const last = await prisma.addressBook.findFirst({ orderBy: { uid: "desc" }, select: { uid: true } })
  let nextNum = last ? parseInt(last.uid) + 1 : 1
  for (const line of chunk) {
    const cols = line.match(/("([^"]*)"|([^,]*))(,|$)/g)
      ?.map(c => c.replace(/^"|"$|,$/g, "").trim()) ?? []
    const [uid, company_name, company_name_kana, department, position, name, honorific, postal_code, address1, address2, remarks] = cols
    const data = {
      company_name: company_name || null,
      company_name_kana: company_name_kana || null,
      department: department || null,
      position: position || null,
      name: name || null,
      honorific: honorific || null,
      postal_code: postal_code || null,
      address1: address1 || null,
      address2: address2 || null,
      remarks: remarks || null,
      flg_del: 0,
      updated_at: new Date(),
    }
    const targetUid = uid || String(nextNum).padStart(6, "0")
    if (!uid) nextNum++
    await prisma.addressBook.upsert({
      where: { uid: targetUid },
      update: data,
      create: { ...data, uid: targetUid },
    })
  }
  const newOffset = offset + chunk.length
  const done = newOffset >= total
  return NextResponse.json({ ok: true, count: chunk.length, total, offset: newOffset, done })
}
