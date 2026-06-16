import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
const s3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})
const BUCKET = "japan-sleeve-system-files-936533876784"
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const key = `address-book/import/${Date.now()}.csv`
  const url = await getSignedUrl(s3, new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: "text/csv" }), { expiresIn: 300 })
  return NextResponse.json({ url, key })
}
