import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import sharp from "sharp"

const s3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})
const BUCKET = "japan-sleeve-system-files-936533876784"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const formData = await req.formData()
  const file = formData.get("file") as File
  if (!file) return NextResponse.json({ error: "file required" }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const buffer = Buffer.from(await file.arrayBuffer())
  // 正方形にリサイズ・透過PNG化
  const resized = await sharp(buffer)
    .resize(300, 300, { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer()

  const key = `users/${id}/inkan.png`
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: resized,
    ContentType: "image/png",
  }))

  const updated = await prisma.user.update({
    where: { id },
    data: { inkanImageKey: key },
  })

  return NextResponse.json({ ok: true, key, inkanImageKey: updated.inkanImageKey })
}