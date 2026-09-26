import { NextRequest, NextResponse } from "next/server"
import { S3Client, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

const s3 = new S3Client({ region: "ap-northeast-1" })
const BUCKET = "japan-sleeve-system-files-936533876784"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { imageId } = await params
  const image = await prisma.mTrayImage.findUnique({ where: { id: imageId } })
  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: image.file_key,
  })

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 })
  return NextResponse.json({ url })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { imageId } = await params
  const image = await prisma.mTrayImage.findUnique({ where: { id: imageId } })
  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: image.file_key }))
  await prisma.mTrayImage.delete({ where: { id: imageId } })

  return NextResponse.json({ success: true })
}
