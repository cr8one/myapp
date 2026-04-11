import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const exhibition = await prisma.devExhibition.findUnique({
    where: { id },
    include: {
      visitors: { include: { user: { select: { id: true, name: true } } } },
      contacts: { include: { company: true, contact: true } },
    },
  })
  if (!exhibition) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(exhibition)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, location, startDate, endDate, notes, summary, description, visitors, contacts } = await req.json()

  await prisma.devExhibitionVisitor.deleteMany({ where: { exhibitionId: id } })
  await prisma.devExhibitionContact.deleteMany({ where: { exhibitionId: id } })

  const exhibition = await prisma.devExhibition.update({
    where: { id },
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

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.devExhibition.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}