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
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs")
      pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")
      const { createCanvas } = await import("canvas")
      class NodeCanvasFactory {
        create(width: number, height: number) {
          const canvas = createCanvas(width, height)
          const context = canvas.getContext("2d")
          return { canvas, context }
        }
        reset(canvasAndContext: { canvas: import("canvas").Canvas; context: unknown }, width: number, height: number) {
          canvasAndContext.canvas.width = width
          canvasAndContext.canvas.height = height
        }
        destroy(canvasAndContext: { canvas: import("canvas").Canvas | null; context: unknown }) {
          canvasAndContext.canvas!.width = 0
          canvasAndContext.canvas!.height = 0
          canvasAndContext.canvas = null
          canvasAndContext.context = null
        }
      }
      const canvasFactory = new NodeCanvasFactory()
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer), CanvasFactory: NodeCanvasFactory }).promise
      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 2.0 })
      const canvasAndContext = canvasFactory.create(viewport.width, viewport.height)
      await page.render({ canvasContext: canvasAndContext.context as unknown as CanvasRenderingContext2D, canvas: canvasAndContext.canvas as unknown as HTMLCanvasElement, viewport }).promise
      const pngBuffer = canvasAndContext.canvas.toBuffer("image/png")
      const resized = await sharp(pngBuffer).resize(800, null, { withoutEnlargement: true }).toBuffer()
      previewKey = `daishi/${record.uid}/preview.png`
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: previewKey,
        Body: resized,
        ContentType: "image/png",
      }))
      canvasFactory.destroy(canvasAndContext)
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
