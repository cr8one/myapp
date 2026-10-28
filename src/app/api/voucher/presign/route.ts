import { NextRequest, NextResponse } from "next/server"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { requirePermission } from "@/lib/permissions"
import { voucherS3, VOUCHER_BUCKET, ALLOWED_EXTENSIONS, fileExtension } from "@/lib/voucher-storage"

export async function POST(req: NextRequest) {
  const denied = await requirePermission("voucherEdit")
  if (denied) return denied
  const { filename } = await req.json()
  const name = String(filename ?? "").replace(/[\\/]/g, "_").trim()
  if (!name || !ALLOWED_EXTENSIONS.includes(fileExtension(name))) {
    return NextResponse.json({ error: "PDF・PNG・JPEGのファイルを選択してください" }, { status: 400 })
  }
  const year = new Date(Date.now() + 9 * 60 * 60 * 1000).getUTCFullYear()
  const key = `voucher/${year}/${Date.now()}_${name}`
  const url = await getSignedUrl(voucherS3, new PutObjectCommand({ Bucket: VOUCHER_BUCKET, Key: key }), { expiresIn: 300 })
  return NextResponse.json({ url, key })
}
