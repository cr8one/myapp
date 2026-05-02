import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const companies = await prisma.sealSupplyCompany.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(companies)
}

export async function POST(request: Request) {
  const body = await request.json()
  const company = await prisma.sealSupplyCompany.create({
    data: { name: body.name, isActive: body.isActive ?? true },
  })
  return NextResponse.json(company, { status: 201 })
}
