import { NextRequest, NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

const s3 = new S3Client({ region: 'ap-northeast-1' })
const BUCKET = 'japan-sleeve-system-files-936533876784'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fileId } = await params
  const file = await prisma.devProjectFile.findUnique({ where: { id: fileId } })
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: file.fileKey,
    ResponseContentDisposition: file.mimeType === 'application/pdf'
      ? `inline; filename="${encodeURIComponent(file.fileName)}"`
      : `attachment; filename="${encodeURIComponent(file.fileName)}"`,
  })

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 })
  return NextResponse.json({ url })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fileId } = await params
  const file = await prisma.devProjectFile.findUnique({ where: { id: fileId } })
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: file.fileKey }))
  await prisma.devProjectFile.delete({ where: { id: fileId } })

  return NextResponse.json({ success: true })
}
