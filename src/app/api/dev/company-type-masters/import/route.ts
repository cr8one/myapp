import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json()
    const validRows = rows.filter((r: Record<string, string>) => r.name?.trim())

    // 既存の名前一覧を取得
    const existing = await prisma.devCompanyTypeMaster.findMany({
      select: { name: true }
    })
    const existingNames = new Set(existing.map((e) => e.name))

    const toCreate = validRows.filter((r: Record<string, string>) => !existingNames.has(r.name.trim()))
    const toUpdate = validRows.filter((r: Record<string, string>) => existingNames.has(r.name.trim()))

    // 新規一括作成
    if (toCreate.length > 0) {
      await prisma.devCompanyTypeMaster.createMany({
        data: toCreate.map((r: Record<string, string>) => ({
          name: r.name.trim(),
          description: r.description?.trim() || null,
          sortOrder: r.sortOrder ? Number(r.sortOrder) : 0,
        })),
        skipDuplicates: true,
      })
    }

    // 更新は並列処理
    await Promise.all(
      toUpdate.map((r: Record<string, string>) =>
        prisma.devCompanyTypeMaster.update({
          where: { name: r.name.trim() },
          data: {
            description: r.description?.trim() || null,
            sortOrder: r.sortOrder ? Number(r.sortOrder) : 0,
          },
        })
      )
    )

    return NextResponse.json({ message: `${validRows.length}件をインポートしました` })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "インポートに失敗しました" }, { status: 500 })
  }
}