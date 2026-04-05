import { NextResponse } from "next/server"
import { PrismaClient } from "@/generated/prisma"

const prisma = new PrismaClient()

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { title, status, description, expectedOrderDate, notes, primaryCompanyId, companyIds } = await req.json()

  // 既存の関連会社を一旦削除して入れ直す
  await prisma.devProjectCompany.deleteMany({ where: { projectId: params.id } })

  const project = await prisma.devProject.update({
    where: { id: params.id },
    data: {
      title,
      status,
      description,
      expectedOrderDate: expectedOrderDate ? new Date(expectedOrderDate) : null,
      notes,
      primaryCompanyId: primaryCompanyId || null,
      companies: {
        create: (companyIds ?? []).map((id: string) => ({ companyId: id })),
      },
    },
    include: {
      primaryCompany: true,
      companies: { include: { company: true } },
    },
  })
  return NextResponse.json(project)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.devProjectCompany.deleteMany({ where: { projectId: params.id } })
  await prisma.devProject.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
