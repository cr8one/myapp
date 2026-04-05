import { NextResponse } from "next/server"
import { PrismaClient } from "@/generated/prisma"

const prisma = new PrismaClient()

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { title, status, description, expectedOrderDate, notes, primaryCompanyId, companyIds } = await req.json()

  await prisma.devProjectCompany.deleteMany({ where: { projectId: id } })

  const project = await prisma.devProject.update({
    where: { id },
    data: {
      title,
      status,
      description,
      expectedOrderDate: expectedOrderDate ? new Date(expectedOrderDate) : null,
      notes,
      primaryCompanyId: primaryCompanyId || null,
      companies: {
        create: (companyIds ?? []).map((cid: string) => ({ companyId: cid })),
      },
    },
    include: {
      primaryCompany: true,
      companies: { include: { company: true } },
    },
  })
  return NextResponse.json(project)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.devProjectCompany.deleteMany({ where: { projectId: id } })
  await prisma.devProject.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
