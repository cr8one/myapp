import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { exhibitions, visitors, contacts } = await req.json()

    for (const row of exhibitions) {
      if (!row.name) continue
      await prisma.devExhibition.upsert({
        where: { id: row.id ?? "" },
        update: {
          name: row.name,
          location: row.location || null,
          startDate: row.startDate ? new Date(row.startDate) : null,
          endDate: row.endDate ? new Date(row.endDate) : null,
          summary: row.summary || null,
          description: row.description || null,
          notes: row.notes || null,
        },
        create: {
          name: row.name,
          location: row.location || null,
          startDate: row.startDate ? new Date(row.startDate) : null,
          endDate: row.endDate ? new Date(row.endDate) : null,
          summary: row.summary || null,
          description: row.description || null,
          notes: row.notes || null,
        },
      })
    }

    // visitorsのインポート
    for (const row of visitors) {
      if (!row.exhibitionId || !row.userId) continue
      await prisma.devExhibitionVisitor.upsert({
        where: { exhibitionId_userId: { exhibitionId: row.exhibitionId, userId: row.userId } },
        update: { impression: row.impression || null },
        create: { exhibitionId: row.exhibitionId, userId: row.userId, impression: row.impression || null },
      })
    }

    // contactsのインポート
    for (const row of contacts) {
      if (!row.exhibitionId || !row.companyId) continue
      await prisma.devExhibitionContact.create({
        data: {
          exhibitionId: row.exhibitionId,
          companyId: row.companyId,
          contactId: row.contactId || null,
          notes: row.notes || null,
        },
      })
    }

    return NextResponse.json({ ok: true, message: "インポートしました" })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "インポートに失敗しました" }, { status: 500 })
  }
}
