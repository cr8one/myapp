import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json()

    const users = await prisma.user.findMany()
    const userMap = new Map(users.map((u) => [u.name, u.id]))

    const productMap = new Map<string, {
      code: string
      name: string
      userId: string
      parts: { code: string; name: string }[]
    }>()

    for (const row of rows) {
      const { productCode, productName, userName, partsCode, partsName } = row

      if (!productCode || !productName) continue

      const userId = userMap.get(userName)
      if (!userId) {
        return NextResponse.json(
          { error: `ユーザー「${userName}」が見つかりません` },
          { status: 400 }
        )
      }

      if (!productMap.has(productCode)) {
        productMap.set(productCode, {
          code: productCode,
          name: productName,
          userId,
          parts: [],
        })
      }

      if (partsCode && partsName) {
        productMap.get(productCode)!.parts.push({
          code: partsCode,
          name: partsName,
        })
      }
    }

    let upsertCount = 0
    for (const product of productMap.values()) {
      const existing = await prisma.product.findUnique({
        where: { code: product.code },
      })

      if (existing) {
        await prisma.part.deleteMany({ where: { productId: existing.id } })
        await prisma.product.update({
          where: { code: product.code },
          data: {
            name: product.name,
            userId: product.userId,
            parts: { create: product.parts },
          },
        })
      } else {
        await prisma.product.create({
          data: {
            code: product.code,
            name: product.name,
            userId: product.userId,
            parts: { create: product.parts },
          },
        })
      }
      upsertCount++
    }

    return NextResponse.json({ message: `${upsertCount}件の製品をインポートしました` })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "インポートに失敗しました" }, { status: 500 })
  }
}
