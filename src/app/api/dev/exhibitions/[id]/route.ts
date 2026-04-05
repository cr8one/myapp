import { NextResponse } from "next/server"
import { PrismaClient } from "@/generated/prisma"

const prisma = new PrismaClient()

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { name, location, startDate, endDate, notes, companyIds } = await req.json()

  await prisma.devExhibitionCompany.deleteMany({ where: { exhibitionId: params.id } })

  const exhibition = await prisma.devExhibition.update({
    where: { id: params.id },
    data: {
      name,
      location,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      notes,
      companies: {
        create: (companyIds ?? []).map((id: string) => ({ companyId: id })),
      },
    },
    include: {
      companies: { include: { company: true } },
    },
  })
  return NextResponse.json(exhibition)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.devExhibitionCompany.deleteMany({ where: { exhibitionId: params.id } })
  await prisma.devExhibition.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
