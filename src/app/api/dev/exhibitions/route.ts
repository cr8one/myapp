import { NextResponse } from "next/server"
import { PrismaClient } from "@/generated/prisma"

const prisma = new PrismaClient()

export async function GET() {
  const exhibitions = await prisma.devExhibition.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      companies: { include: { company: true } },
    },
  })
  return NextResponse.json(exhibitions)
}

export async function POST(req: Request) {
  const { name, location, startDate, endDate, notes, companyIds } = await req.json()
  if (!name) return NextResponse.json({ error: "展示会名は必須です" }, { status: 400 })

  const exhibition = await prisma.devExhibition.create({
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
