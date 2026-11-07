import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { DEV_EXHIBITION_LABELS, logDevCreate, logDevUpdate } from "@/lib/dev-history"

export async function POST(req: NextRequest) {
  try {
    const { exhibitions, visitors, contacts } = await req.json()
    const session = await auth()

    for (const row of exhibitions) {
      if (!row.name) continue
      const before = row.id ? await prisma.devExhibition.findUnique({ where: { id: row.id } }) : null
      const exhibition = await prisma.devExhibition.upsert({
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
      if (before) {
        await logDevUpdate({
          userId: session?.user?.id, targetModel: "DevExhibition", targetId: exhibition.id, targetLabel: exhibition.name,
          before, after: exhibition, labels: DEV_EXHIBITION_LABELS, classification: "インポート（編集）",
        })
      } else {
        await logDevCreate({
          userId: session?.user?.id, targetModel: "DevExhibition", targetId: exhibition.id, targetLabel: exhibition.name,
          classification: "インポート（新規）",
        })
      }
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
