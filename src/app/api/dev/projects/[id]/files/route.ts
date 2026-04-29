import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: projectId } = await params
  const files = await prisma.devProjectFile.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(files)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: projectId } = await params
  const { fileName, fileKey, fileSize, mimeType, comment } = await req.json()

  const file = await prisma.devProjectFile.create({
    data: {
      projectId,
      fileName,
      fileKey,
      fileSize,
      mimeType,
      comment: comment || null,
      createdBy: session.user?.name || session.user?.email || null,
    },
  })

  return NextResponse.json(file)
}
