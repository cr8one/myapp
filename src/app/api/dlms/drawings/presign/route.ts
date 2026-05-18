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

  const { filename, contentType, fileKind } = await req.json()
  const ext = filename.split(".").pop()
  const key = `dlms/drawings/${fileKind}/${Date.now()}_${filename}`

  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: "japan-sleeve-system-files-936533876784",
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 300 }
  )

  return NextResponse.json({ url, key, ext })
}
