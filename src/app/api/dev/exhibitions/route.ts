import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const exhibitions = await prisma.devExhibition.findMany({
    orderBy: { startDate: "desc" },
    include: {
      visitors: { include: { user: { select: { id: true, name: true } } } },
      contacts: { include: { company: true, contact: true } },
    },
  })
  return NextResponse.json(exhibitions)
}

export async function POST(req: Request) {
  const { name, location, startDate, endDate, notes, summary, description, visitors, contacts } = await req.json()
  if (!name) return NextResponse.json({ error: "展示会名は必須です" }, { status: 400 })
  const exhibition = await prisma.devExhibition.create({
    data: {
      name, location, notes, summary, description,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      visitors: visitors?.length
        ? { create: visitors.map((v: { userId: string; impression?: string }) => ({
            userId: v.userId,
            impression: v.impression ?? null,
          })) }
        : undefined,
      contacts: contacts?.length
        ? { create: contacts.map((c: { companyId: string; contactId?: string; notes?: string }) => ({
            companyId: c.companyId,
            contactId: c.contactId || null,
            notes: c.notes ?? null,
          })) }
        : undefined,
    },
    include: {
      visitors: { include: { user: { select: { id: true, name: true } } } },
      contacts: { include: { company: true, contact: true } },
    },
  })
  return NextResponse.json(exhibition)
}