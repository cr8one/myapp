import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const all = searchParams.get("all") === "1"

  const companies = await prisma.sealSupplyCompany.findMany({
    where: all ? {} : { isActive: true },
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
