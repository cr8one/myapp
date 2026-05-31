import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import sharp from "sharp"

const s3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})
const BUCKET = "japan-sleeve-system-files-936533876784"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { key, drawingId, kind } = await req.json()
  if (!key || !drawingId || !kind) return NextResponse.json({ error: "Invalid params" }, { status: 400 })

  try {
    const getCmd = new GetObjectCommand({ Bucket: BUCKET, Key: key })
    const response = await s3.send(getCmd)
    const chunks: Uint8Array[] = []
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk)
    }
    const tifBuffer = Buffer.concat(chunks)

    const pngBuffer = await sharp(tifBuffer).png().toBuffer()

    const pngKey = key.replace(/\.(tif|tiff)$/i, ".png")
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: pngKey,
      Body: pngBuffer,
      ContentType: "image/png",
    }))

    await prisma.drawing.update({
      where: { id: parseInt(drawingId) },
      data: kind === "legacy"
        ? { legacy_file_path: pngKey, legacy_file_type: "png" }
        : { new_file_path: pngKey, new_file_type: "png" },
    })

    return NextResponse.json({ ok: true, pngKey })
  } catch (err: any) {
    console.error("TIF convert error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
