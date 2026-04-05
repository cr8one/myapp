import { NextResponse } from "next/server"
import { PrismaClient } from "@/generated/prisma"

const prisma = new PrismaClient()

export async function GET() {
  const companies = await prisma.devCompany.findMany({
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(companies)
}

export async function POST(req: Request) {
  const { name, nameKana, industry, contactName, contactEmail, contactPhone, notes } = await req.json()
  if (!name) return NextResponse.json({ error: "会社名は必須です" }, { status: 400 })
  const company = await prisma.devCompany.create({
    data: { name, nameKana, industry, contactName, contactEmail, contactPhone, notes },
  })
  return NextResponse.json(company)
}
