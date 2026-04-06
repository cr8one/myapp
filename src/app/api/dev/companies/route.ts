import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const companies = await prisma.devCompany.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      contacts: { where: { isPrimary: true }, take: 1 },
      types: { include: { typeMaster: true } },
    },
  })
  return NextResponse.json(companies)
}

export async function POST(req: Request) {
  const { name, nameKana, industry, status, postalCode, address, phone, url, notes, contacts, typeIds } = await req.json()
  if (!name) return NextResponse.json({ error: "会社名は必須です" }, { status: 400 })

  const company = await prisma.devCompany.create({
    data: {
      name, nameKana, industry,
      status: status ?? "登録のみ",
      postalCode, address, phone, url, notes,
      contacts: contacts?.length
        ? { create: contacts }
        : undefined,
      types: typeIds?.length
        ? { create: typeIds.map((id: string) => ({ typeMasterId: id })) }
        : undefined,
    },
    include: {
      contacts: true,
      types: { include: { typeMaster: true } },
    },
  })
  return NextResponse.json(company)
}