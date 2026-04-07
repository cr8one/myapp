import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json()
    let count = 0
    for (const row of rows) {
      const { name, description, sortOrder } = row
      if (!name) continue
      await prisma.devCompanyTypeMaster.upsert({
        where: { name },
        update: { description: description ?? null, sortOrder: sortOrder ? Number(sortOrder) : 0 },
        create: { name, description: description ?? null, sortOrder: sortOrder ? Number(sortOrder) : 0 },
      })
      count++
    }
    return NextResponse.json({ message: `${count}件をインポートしました` })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "インポートに失敗しました" }, { status: 500 })
  }
}