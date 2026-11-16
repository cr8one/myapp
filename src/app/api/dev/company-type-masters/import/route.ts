import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { logDevImportSummary } from "@/lib/dev-history"
import { normalizeFurigana } from "@/lib/kana"

export const maxDuration = 60 // 秒

export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json()
    const session = await auth()
    const validRows: Record<string, string>[] = rows.filter((r: Record<string, string>) => r.name?.trim())

    // フリガナの検証（1件でも不正なら、このまとまりは何も書き込まずに止める）
    const items: { name: string; description: string | null; furigana: string | null }[] = []
    const invalid: string[] = []
    for (const r of validRows) {
      const name = r.name.trim()
      const f = normalizeFurigana(r.furigana)
      if (!f.ok) { invalid.push(name); continue }
      items.push({ name, description: r.description?.trim() || null, furigana: f.value })
    }
    if (invalid.length > 0) {
      const shown = invalid.slice(0, 5).join("、")
      const rest = invalid.length > 5 ? ` ほか${invalid.length - 5}件` : ""
      return NextResponse.json({ error: `フリガナが不正です（カタカナ・ひらがなのみ）：${shown}${rest}` }, { status: 400 })
    }

    // 既存の名前一覧を取得
    const existing = await prisma.devCompanyTypeMaster.findMany({
      select: { name: true }
    })
    const existingNames = new Set(existing.map((e) => e.name))

    const toCreate = items.filter((i) => !existingNames.has(i.name))
    const toUpdate = items.filter((i) => existingNames.has(i.name))

    // 新規一括作成（フリガナは空でも可）
    if (toCreate.length > 0) {
      await prisma.devCompanyTypeMaster.createMany({
        data: toCreate.map((i) => ({
          name: i.name,
          description: i.description,
          furigana: i.furigana,
        })),
        skipDuplicates: true,
      })
    }

    // 更新は並列処理（CSVのフリガナが空のときは、今のフリガナを変えない）
    await Promise.all(
      toUpdate.map((i) =>
        prisma.devCompanyTypeMaster.update({
          where: { name: i.name },
          data: {
            description: i.description,
            ...(i.furigana !== null ? { furigana: i.furigana } : {}),
          },
        })
      )
    )

    await logDevImportSummary({ userId: session?.user?.id, targetModel: "DevCompanyTypeMaster", targetLabel: "種別マスタ（インポート）", created: toCreate.length, updated: toUpdate.length })
    return NextResponse.json({ message: `${validRows.length}件をインポートしました` })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "インポートに失敗しました" }, { status: 500 })
  }
}
