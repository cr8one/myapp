import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRegulationViewer, text } from "@/lib/eapp-regulations"

// 一覧：ログインしている全員が見られる（入力の候補に使う）
export async function GET() {
  const viewer = await getRegulationViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const areas = await prisma.eappTripArea.findMany({
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
    select: { id: true, name: true, sort_order: true },
  })
  return NextResponse.json({ areas, can_manage: viewer.canManage })
}

// 追加：システム管理者と経理担当だけ
export async function POST(req: NextRequest) {
  const viewer = await getRegulationViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!viewer.canManage) return NextResponse.json({ error: "システム管理者と経理担当だけが操作できます" }, { status: 403 })

  const b = await req.json().catch(() => ({}))
  const name = text(b.name, 200)
  if (!name) return NextResponse.json({ error: "名前を入力してください" }, { status: 400 })
  if (name.length > 60) return NextResponse.json({ error: "名前は60文字までです" }, { status: 400 })
  const sortOrder = Number.isInteger(Number(b.sort_order)) ? Number(b.sort_order) : 0
  if (await prisma.eappTripArea.findUnique({ where: { name }, select: { id: true } })) {
    return NextResponse.json({ error: "同じ名前が、既に登録されています" }, { status: 400 })
  }
  const record = await prisma.eappTripArea.create({ data: { name, sort_order: sortOrder }, select: { id: true, name: true, sort_order: true } })
  return NextResponse.json(record)
}
