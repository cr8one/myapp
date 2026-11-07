import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { DEV_COMPANY_LABELS, logDevUpdate, logDevDelete } from "@/lib/dev-history"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const company = await prisma.devCompany.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      types: { include: { typeMaster: { select: { id: true, name: true } } } },
      primaryProjects: { select: { id: true, title: true, status: true } },
    },
  })
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(company)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, nameKana, industry, status, postalCode, address, phone, url, notes, contacts, typeIds } = await req.json()

  const session = await auth()
  const before = await prisma.devCompany.findUnique({ where: { id } })

  // 担当者・種別は一旦削除して再作成
  await prisma.devCompanyContact.deleteMany({ where: { companyId: id } })
  await prisma.devCompanyType.deleteMany({ where: { companyId: id } })

  const company = await prisma.devCompany.update({
    where: { id },
    data: {
      name, nameKana, industry, status, postalCode, address, phone, url, notes,
      contacts: contacts?.length
        ? { create: contacts }
        : undefined,
      types: typeIds?.length
        ? { create: typeIds.map((tid: string) => ({ typeMasterId: tid })) }
        : undefined,
    },
    include: {
      contacts: true,
      types: { include: { typeMaster: true } },
    },
  })
  if (before) {
    await logDevUpdate({
      userId: session?.user?.id, targetModel: "DevCompany", targetId: id, targetLabel: company.name,
      before, after: company, labels: DEV_COMPANY_LABELS,
    })
  }
  return NextResponse.json(company)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const before = await prisma.devCompany.findUnique({ where: { id }, select: { name: true } })
  await prisma.devCompany.delete({ where: { id } })
  if (before) {
    await logDevDelete({ userId: session?.user?.id, targetModel: "DevCompany", targetId: id, targetLabel: before.name })
  }
  return NextResponse.json({ ok: true })
}