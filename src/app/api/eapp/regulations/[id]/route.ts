import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRegulationViewer, deleteRegulationObject, text } from "@/lib/eapp-regulations"

// 名前・説明・表示順の変更
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getRegulationViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!viewer.canManage) return NextResponse.json({ error: "システム管理者と経理担当だけが操作できます" }, { status: 403 })
  const { id } = await params

  const b = await req.json().catch(() => ({}))
  const data: { title?: string; description?: string | null; sort_order?: number } = {}
  if (b.title !== undefined) {
    const title = text(b.title, 100)
    if (!title) return NextResponse.json({ error: "名前を入力してください" }, { status: 400 })
    data.title = title
  }
  if (b.description !== undefined) data.description = text(b.description, 500) || null
  if (b.sort_order !== undefined) {
    if (!Number.isInteger(Number(b.sort_order))) return NextResponse.json({ error: "表示順は整数で入力してください" }, { status: 400 })
    data.sort_order = Number(b.sort_order)
  }
  const updated = await prisma.eappRegulation.updateMany({ where: { id }, data })
  if (updated.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}

// 削除：規定と、すべての版（データベースの行と、S3の実物）
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getRegulationViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!viewer.canManage) return NextResponse.json({ error: "システム管理者と経理担当だけが操作できます" }, { status: 403 })
  const { id } = await params

  const reg = await prisma.eappRegulation.findUnique({ where: { id }, select: { versions: { select: { file_key: true } } } })
  if (!reg) return NextResponse.json({ error: "Not found" }, { status: 404 })
  await prisma.eappRegulation.delete({ where: { id } })
  for (const v of reg.versions) await deleteRegulationObject(v.file_key)
  return NextResponse.json({ ok: true })
}
