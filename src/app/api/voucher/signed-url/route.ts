import { NextRequest, NextResponse } from "next/server"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { requirePermission } from "@/lib/permissions"
import { voucherS3, VOUCHER_BUCKET, isVoucherKey } from "@/lib/voucher-storage"

export async function GET(req: NextRequest) {
  const denied = await requirePermission("voucherView")
  if (denied) return denied
  const key = new URL(req.url).searchParams.get("key")
  if (!isVoucherKey(key)) return NextResponse.json({ error: "key が正しくありません" }, { status: 400 })
  const url = await getSignedUrl(voucherS3, new GetObjectCommand({ Bucket: VOUCHER_BUCKET, Key: key }), { expiresIn: 300 })
  return NextResponse.json({ url })
}
