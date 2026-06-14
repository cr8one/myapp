import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"
const s3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})
const BUCKET = "japan-sleeve-system-files-936533876784"
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const fileType = body.fileType as "ai" | "dxf" | "pdf"
  if (!["ai", "dxf", "pdf"].includes(fileType)) {
    return NextResponse.json({ error: "Invalid fileType" }, { status: 400 })
  }
  const record = await prisma.daishiDb.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const keyMap: Record<string, string | null> = { ai: record.file_ai, dxf: record.file_dxf, pdf: record.file_pdf }
  const fileKey = keyMap[fileType]
  const updateData: Record<string, string | null> = {}
  if (fileKey) {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: fileKey }))
  }
  if (fileType === "ai") updateData.file_ai = null
  if (fileType === "dxf") updateData.file_dxf = null
  if (fileType === "pdf") {
    updateData.file_pdf = null
    if (record.preview_image) {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: record.preview_image }))
      updateData.preview_image = null
    }
  }
  const updated = await prisma.daishiDb.update({
    where: { id },
    data: updateData,
    include: { tags: true },
  })
  return NextResponse.json({ ok: true, record: updated })
}
