import { NextRequest, NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const s3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const target = await prisma.cadRequest.findUnique({ where: { id }, select: { status: true } })
  if (target?.status === "完了") {
    return NextResponse.json({ error: "完了済みの依頼書は添付ファイルを追加できません" }, { status: 400 })
  }
  const { filename } = await req.json()
  const key = `cad/requests/${id}/${Date.now()}_${filename}`
  const command = new PutObjectCommand({
    Bucket: "japan-sleeve-system-files-936533876784",
    Key: key,
  })
  const url = await getSignedUrl(s3, command, { expiresIn: 300 })
  return NextResponse.json({ url, key })
}
