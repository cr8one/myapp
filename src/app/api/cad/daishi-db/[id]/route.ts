import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const record = await prisma.daishiDb.findUnique({
    where: { id },
    include: { tags: true },
  })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(record)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  // タグの更新（全削除→再作成）
  await prisma.daishiTag.deleteMany({ where: { daishi_id: id } })

  const record = await prisma.daishiDb.update({
    where: { id },
    data: {
      remarks: body.remarks || null,
      file_ai: body.file_ai !== undefined ? body.file_ai || null : undefined,
      file_dxf: body.file_dxf !== undefined ? body.file_dxf || null : undefined,
      file_pdf: body.file_pdf !== undefined ? body.file_pdf || null : undefined,
      preview_image: body.preview_image !== undefined ? body.preview_image || null : undefined,
      tags: body.tags?.length > 0 ? {
        create: body.tags.map((t: string) => ({ tag_name: t })),
      } : undefined,
    },
    include: { tags: true },
  })
  return NextResponse.json(record)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.daishiDb.update({ where: { id }, data: { flg_del: 1 } })
  return NextResponse.json({ ok: true })
}
