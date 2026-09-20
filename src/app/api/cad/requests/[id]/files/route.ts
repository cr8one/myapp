import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { createAuditLog } from "@/lib/audit"

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

  await createAuditLog({
    userId: session.user?.id,
    service: "cad",
    action: "UPDATE",
    targetModel: "CadRequest",
    targetId: id,
    diff: {
      classification: "添付追加",
      changedFields: [{ field: "attachment", label: "添付ファイル", before: "—", after: fileName }],
    },
  })

  return NextResponse.json(record)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const fileId = searchParams.get("fileId")
  if (!fileId) return NextResponse.json({ error: "fileId required" }, { status: 400 })
  const target = await prisma.cadRequestFile.findUnique({ where: { id: fileId } })
  await prisma.cadRequestFile.delete({ where: { id: fileId } })

  await createAuditLog({
    userId: session.user?.id,
    service: "cad",
    action: "UPDATE",
    targetModel: "CadRequest",
    targetId: id,
    diff: {
      classification: "添付削除",
      changedFields: [{ field: "attachment", label: "添付ファイル", before: target?.file_name ?? "—", after: "—" }],
    },
  })

  return NextResponse.json({ ok: true })
}
