import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { filename } = await req.json()
  const key = `dlms-shelf-stock-imports/${Date.now()}-${filename}`

  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: "japan-sleeve-system-files-936533876784",
      Key: key,
      ContentType: "application/vnd.ms-excel",
    }),
    { expiresIn: 300 }
  )

  return NextResponse.json({ url, key })
}
