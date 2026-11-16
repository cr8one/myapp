import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { DEV_COMPANY_TYPE_MASTER_LABELS, logDevUpdate, logDevDelete } from "@/lib/dev-history"
import { normalizeFurigana } from "@/lib/kana"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, description, furigana } = await req.json()
  if (!name) return NextResponse.json({ error: "種別名は必須です" }, { status: 400 })
  const f = normalizeFurigana(furigana)
  if (!f.ok) return NextResponse.json({ error: "フリガナは、カタカナ（ひらがなも可）で入力してください" }, { status: 400 })
  if (f.value === null) return NextResponse.json({ error: "フリガナは必須です" }, { status: 400 })
  const session = await auth()
  const before = await prisma.devCompanyTypeMaster.findUnique({ where: { id } })
  const master = await prisma.devCompanyTypeMaster.update({
    where: { id },
    data: { name, description, furigana: f.value },
  })
  if (before) {
    await logDevUpdate({
      userId: session?.user?.id, targetModel: "DevCompanyTypeMaster", targetId: id, targetLabel: master.name,
      before, after: master, labels: DEV_COMPANY_TYPE_MASTER_LABELS,
    })
  }
  return NextResponse.json(master)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const before = await prisma.devCompanyTypeMaster.findUnique({ where: { id }, select: { name: true } })
  await prisma.devCompanyTypeMaster.delete({ where: { id } })
  if (before) {
    await logDevDelete({ userId: session?.user?.id, targetModel: "DevCompanyTypeMaster", targetId: id, targetLabel: before.name })
  }
  return NextResponse.json({ ok: true })
}
