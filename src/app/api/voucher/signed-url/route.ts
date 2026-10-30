import { NextRequest, NextResponse } from "next/server"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { requirePermission } from "@/lib/permissions"
import { voucherS3, VOUCHER_BUCKET, isVoucherKey } from "@/lib/voucher-storage"

export async function GET(req: NextRequest) {
  const denied = await requirePermission("voucherView")
  if (denied) return denied
  const sp = new URL(req.url).searchParams
  const key = sp.get("key")
  const downloadName = sp.get("download_name")
  if (!isVoucherKey(key)) return NextResponse.json({ error: "key が正しくありません" }, { status: 400 })
  const disposition = downloadName
    ? `attachment; filename="download"; filename*=UTF-8''${encodeURIComponent(downloadName)}`
    : undefined
  const url = await getSignedUrl(voucherS3, new GetObjectCommand({ Bucket: VOUCHER_BUCKET, Key: key, ResponseContentDisposition: disposition }), { expiresIn: 300 })
  return NextResponse.json({ url })
}
