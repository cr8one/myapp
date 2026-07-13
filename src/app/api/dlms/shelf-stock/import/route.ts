import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import * as XLSX from "xlsx"

const s3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})

const CHUNK = 100

function excelDateTimeToJs(v: unknown): Date | null {
  if (v === null || v === undefined || v === "") return null
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v)
    if (!d) return null
    return new Date(Date.UTC(d.y, d.m - 1, d.d, d.H || 0, d.M || 0, Math.floor(d.S || 0)))
  }
  const s = String(v).trim().replace(/\//g, "-")
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { key, offset } = await req.json()

  const obj = await s3.send(new GetObjectCommand({
    Bucket: "japan-sleeve-system-files-936533876784",
    Key: key,
  }))
  const buf = await obj.Body!.transformToByteArray()
  const wb = XLSX.read(buf, { type: "array", cellDates: false })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: null })
  const total = rows.length

  if (offset === 0) {
    await prisma.shelfStock.deleteMany({})
  }

  const chunk = rows.slice(offset, offset + CHUNK)

  const data = chunk
    .map((row) => {
      const shelfNo = row["棚No."] ? String(row["棚No."]).trim() : ""
      if (!shelfNo) return null
      const parts = shelfNo.split("-")
      return {
        shelf_no: shelfNo,
        shelf_rack: parts[0] ?? null,
        shelf_row: parts[1] ?? null,
        shelf_col: parts[2] ?? null,
        shelf_status: row["棚状態"] ? String(row["棚状態"]).trim() : null,
        item_code: row["品名コード"] ? String(row["品名コード"]).trim() : null,
        item_name: row["品名"] ? String(row["品名"]).trim() : null,
        lot_no: row["ロットNo."] ? String(row["ロットNo."]).trim() : null,
        remarks: row["備考"] ? String(row["備考"]).trim() : null,
        category: row["区分"] ? String(row["区分"]).trim() : null,
        stocked_at: excelDateTimeToJs(row["入庫日時"]),
        stock_count: row["在庫数"] !== null && row["在庫数"] !== undefined && row["在庫数"] !== ""
          ? parseInt(String(row["在庫数"]), 10)
          : null,
      }
    })
    .filter((d): d is NonNullable<typeof d> => d !== null)

  if (data.length > 0) {
    await prisma.shelfStock.createMany({ data })
  }

  const newOffset = offset + chunk.length
  const done = newOffset >= total

  return NextResponse.json({ ok: true, count: data.length, total, offset: newOffset, done })
}
