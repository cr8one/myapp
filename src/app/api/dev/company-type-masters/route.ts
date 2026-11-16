import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { logDevCreate, logDevDeleteAll } from "@/lib/dev-history"
import { normalizeFurigana } from "@/lib/kana"

export async function GET() {
  // 日本語の五十音順は、ICU照合順序の生SQLでIDを並べ、その順に並べ替える（引き継ぎ規約）
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM dev_company_type_masters ORDER BY furigana COLLATE "und-x-icu" ASC NULLS LAST, name COLLATE "und-x-icu" ASC`
  )
  const masters = await prisma.devCompanyTypeMaster.findMany()
  const byId = new Map(masters.map((m) => [m.id, m]))
  const sorted = rows.map((r) => byId.get(r.id)).filter((m): m is NonNullable<typeof m> => m !== undefined)
  return NextResponse.json(sorted)
}

export async function POST(req: Request) {
  const { name, description, furigana } = await req.json()
  if (!name) return NextResponse.json({ error: "種別名は必須です" }, { status: 400 })
  const f = normalizeFurigana(furigana)
  if (!f.ok) return NextResponse.json({ error: "フリガナは、カタカナ（ひらがなも可）で入力してください" }, { status: 400 })
  if (f.value === null) return NextResponse.json({ error: "フリガナは必須です" }, { status: 400 })
  const master = await prisma.devCompanyTypeMaster.create({
    data: { name, description, furigana: f.value },
  })
  const session = await auth()
  await logDevCreate({ userId: session?.user?.id, targetModel: "DevCompanyTypeMaster", targetId: master.id, targetLabel: master.name })
  return NextResponse.json(master)
}

export async function DELETE() {
  const session = await auth()
  const result = await prisma.devCompanyTypeMaster.deleteMany()
  await logDevDeleteAll({ userId: session?.user?.id, targetModel: "DevCompanyTypeMaster", targetLabel: "種別マスタ（全件）", count: result.count })
  return NextResponse.json({ ok: true })
}
