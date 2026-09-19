import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { fileKey, fileName, fileType } = await req.json()
  const record = await prisma.cadRequestFile.create({
    data: {
      request_id: id,
      file_key: fileKey,
      file_name: fileName,
      file_type: fileType,
    },
  })
  return NextResponse.json(record)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const fileId = searchParams.get("fileId")
  if (!fileId) return NextResponse.json({ error: "fileId required" }, { status: 400 })
  await prisma.cadRequestFile.delete({ where: { id: fileId } })
  return NextResponse.json({ ok: true })
}
