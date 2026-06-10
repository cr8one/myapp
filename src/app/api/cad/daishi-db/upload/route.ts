import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import path from "path"
import sharp from "sharp"

const s3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})
const BUCKET = "japan-sleeve-system-files-936533876784"

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const id = formData.get("id") as string
  const fileType = formData.get("fileType") as string // "ai" | "dxf" | "pdf"
  const file = formData.get("file") as File

  if (!id || !fileType || !file) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 })
  }

  const record = await prisma.daishiDb.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const ext = path.extname(file.name).toLowerCase()
  const key = `daishi/${record.uid}/${fileType}${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  // S3にアップロード
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: file.type || "application/octet-stream",
  }))

  // PDFの場合プレビュー画像を生成
  let previewKey: string | null = null
  if (fileType === "pdf") {
    try {
      const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs")
      const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise
      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 2.0 })
      const { createCanvas } = await import("canvas")
      const canvas = createCanvas(viewport.width, viewport.height)
      const ctx = canvas.getContext("2d")
      await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport, canvas: canvas as unknown as HTMLCanvasElement }).promise
      const pngBuffer = canvas.toBuffer("image/png")
      const resized = await sharp(pngBuffer).resize(800, null, { withoutEnlargement: true }).toBuffer()
      previewKey = `daishi/${record.uid}/preview.png`
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: previewKey,
        Body: resized,
        ContentType: "image/png",
      }))
    } catch (e) {
      console.error("PDF preview generation failed:", e)
    }
  }

  // DBを更新
  const updateData: Record<string, string | null> = {}
  if (fileType === "ai") updateData.file_ai = key
  if (fileType === "dxf") updateData.file_dxf = key
  if (fileType === "pdf") updateData.file_pdf = key
  if (previewKey) updateData.preview_image = previewKey

  const updated = await prisma.daishiDb.update({
    where: { id },
    data: updateData,
    include: { tags: true },
  })

  return NextResponse.json({ ok: true, key, previewKey, record: updated })
}
