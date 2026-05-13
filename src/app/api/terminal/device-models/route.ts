import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3 = new S3Client({ region: "ap-northeast-1", requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED" })
const BUCKET = "japan-sleeve-system-files-936533876784"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword")
  const records = await prisma.deviceModel.findMany({
    where: keyword ? { OR: [
      { modelName: { contains: keyword } },
      { modelNumber: { contains: keyword } },
      { osName: { contains: keyword } },
    ]} : undefined,
    orderBy: { modelId: "asc" },
  })
  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const record = await prisma.deviceModel.create({
    data: {
      vendorId: body.vendorId ? parseInt(body.vendorId) : null,
      deviceTypeId: body.deviceTypeId ? parseInt(body.deviceTypeId) : null,
      modelName: body.modelName,
      modelNumber: body.modelNumber || null,
      osName: body.osName || null,
      cpuInfo: body.cpuInfo || null,
      memoryDefault: body.memoryDefault || null,
      storageDefault: body.storageDefault || null,
      eolDate: body.eolDate ? new Date(body.eolDate) : null,
      imagePath: body.imagePath || null,
      note: body.note || null,
    },
  })
  return NextResponse.json(record)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  if (type === "presigned") {
    const { filename, contentType } = await req.json()
    const key = `terminal/device-models/${Date.now()}_${filename}`
    const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType })
    const url = await getSignedUrl(s3, command, { expiresIn: 300 })
    return NextResponse.json({ url, key })
  }
  const body = await req.json()
  const record = await prisma.deviceModel.update({
    where: { modelId: parseInt(body.modelId) },
    data: {
      vendorId: body.vendorId ? parseInt(body.vendorId) : null,
      deviceTypeId: body.deviceTypeId ? parseInt(body.deviceTypeId) : null,
      modelName: body.modelName,
      modelNumber: body.modelNumber || null,
      osName: body.osName || null,
      cpuInfo: body.cpuInfo || null,
      memoryDefault: body.memoryDefault || null,
      storageDefault: body.storageDefault || null,
      eolDate: body.eolDate ? new Date(body.eolDate) : null,
      imagePath: body.imagePath || null,
      note: body.note || null,
    },
  })
  return NextResponse.json(record)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  await prisma.deviceModel.delete({ where: { modelId: parseInt(id) } })
  return NextResponse.json({ ok: true })
}
