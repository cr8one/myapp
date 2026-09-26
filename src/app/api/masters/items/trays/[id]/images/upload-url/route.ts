import { NextRequest, NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { auth } from "@/auth"
import { randomUUID } from "crypto"

const s3 = new S3Client({ region: "ap-northeast-1" })
const BUCKET = "japan-sleeve-system-files-936533876784"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: trayId } = await params
  const { fileName, fileType, fileSize } = await req.json()

  if (!ALLOWED_TYPES.includes(fileType)) {
    return NextResponse.json({ error: "許可されていない画像形式です（JPEG/PNG/WebP/GIFのみ）" }, { status: 400 })
  }
  if (fileSize > MAX_SIZE) {
    return NextResponse.json({ error: "ファイルサイズは10MB以下にしてください" }, { status: 400 })
  }

  const uuid = randomUUID()
  const fileKey = `masters/items/trays/${trayId}/${uuid}/${fileName}`

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
    ContentType: fileType,
  })

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 })

  return NextResponse.json({ uploadUrl, fileKey })
}
