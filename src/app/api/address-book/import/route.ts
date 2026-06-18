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
  for (const line of chunk) {
    const cols = line.match(/("([^"]*)"|([^,]*))(,|$)/g)
      ?.map(c => c.replace(/^"|"$|,$/g, "").trim()) ?? []
    const [uid, company_name, company_name_kana, postal_code, address1, address2, department_in_charge, remarks, department, position, name, honorific] = cols
    if (!uid) continue
    const addressData = {
      company_name: company_name || null,
      company_name_kana: company_name_kana || null,
      postal_code: postal_code || null,
      address1: address1 || null,
      address2: address2 || null,
      department_in_charge: department_in_charge || null,
      remarks: remarks || null,
      flg_del: 0,
      updated_at: new Date(),
    }
    const existing = await prisma.addressBook.findUnique({ where: { uid } })
    if (existing) {
      // 既存レコードの場合：会社情報を更新し、担当者を追加（既存担当者は保持）
      await prisma.addressBook.update({ where: { uid }, data: addressData })
      if (name || department || position) {
        const contactCount = await prisma.addressBookContact.count({ where: { address_book_id: existing.id } })
        await prisma.addressBookContact.create({
          data: {
            address_book_id: existing.id,
            department: department || null,
            position: position || null,
            name: name || null,
            honorific: honorific || null,
            sort_order: contactCount,
          },
        })
      }
    } else {
      // 新規レコードの場合
      const newRecord = await prisma.addressBook.create({
        data: { ...addressData, uid },
      })
      if (name || department || position) {
        await prisma.addressBookContact.create({
          data: {
            address_book_id: newRecord.id,
            department: department || null,
            position: position || null,
            name: name || null,
            honorific: honorific || null,
            sort_order: 0,
          },
        })
      }
    }
  }
  const newOffset = offset + chunk.length
  const done = newOffset >= total
  return NextResponse.json({ ok: true, count: chunk.length, total, offset: newOffset, done })
}
