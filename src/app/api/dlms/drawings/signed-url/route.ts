import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { key } = await req.json()
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 })

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: "japan-sleeve-system-files-936533876784",
      Key: key,
    }),
    { expiresIn: 3600 }
  )

  return NextResponse.json({ url })
}
