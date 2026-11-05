import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRegulationViewer, text } from "@/lib/eapp-regulations"
import { isAllowanceClass } from "@/lib/eapp-trip-area-classes"

// 変更：システム管理者と経理担当だけ
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getRegulationViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!viewer.canManage) return NextResponse.json({ error: "システム管理者と経理担当だけが操作できます" }, { status: 403 })
  const { id } = await params

  const b = await req.json().catch(() => ({}))
  const data: { name?: string; sort_order?: number; allowance_class?: string | null } = {}
  if (b.name !== undefined) {
    const name = text(b.name, 200)
    if (!name) return NextResponse.json({ error: "名前を入力してください" }, { status: 400 })
    if (name.length > 60) return NextResponse.json({ error: "名前は60文字までです" }, { status: 400 })
    const dup = await prisma.eappTripArea.findUnique({ where: { name }, select: { id: true } })
    if (dup && dup.id !== id) return NextResponse.json({ error: "同じ名前が、既に登録されています" }, { status: 400 })
    data.name = name
  }
  if (b.sort_order !== undefined) {
    if (!Number.isInteger(Number(b.sort_order))) return NextResponse.json({ error: "表示順は整数で入力してください" }, { status: 400 })
    data.sort_order = Number(b.sort_order)
  }
  if (b.allowance_class !== undefined) {
    if (b.allowance_class === null || b.allowance_class === "") {
      data.allowance_class = null
    } else if (isAllowanceClass(b.allowance_class)) {
      data.allowance_class = b.allowance_class
    } else {
      return NextResponse.json({ error: "日当の区分が正しくありません" }, { status: 400 })
    }
  }
  const updated = await prisma.eappTripArea.updateMany({ where: { id }, data })
  if (updated.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}

// 削除：システム管理者と経理担当だけ。すでに伝票に入った出張区域の文字は、そのまま残る（候補から消えるだけ）
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getRegulationViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!viewer.canManage) return NextResponse.json({ error: "システム管理者と経理担当だけが操作できます" }, { status: 403 })
  const { id } = await params
  const deleted = await prisma.eappTripArea.deleteMany({ where: { id } })
  if (deleted.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
