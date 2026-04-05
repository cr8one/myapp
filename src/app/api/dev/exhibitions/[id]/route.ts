import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, location, startDate, endDate, notes, companyIds } = await req.json()
  await prisma.devExhibitionCompany.deleteMany({ where: { exhibitionId: id } })
  const exhibition = await prisma.devExhibition.update({
    where: { id },
    data: {
      name,
      location,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      notes,
      companies: {
        create: (companyIds ?? []).map((cid: string) => ({ companyId: cid })),
      },
    },
    include: {
      companies: { include: { company: true } },
    },
  })
  return NextResponse.json(exhibition)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.devExhibitionCompany.deleteMany({ where: { exhibitionId: id } })
  await prisma.devExhibition.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
