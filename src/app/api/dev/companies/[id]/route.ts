import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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
  return NextResponse.json(company)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.devCompany.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}