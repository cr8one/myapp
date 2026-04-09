import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const contacts = await prisma.devCompanyContact.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      companyId: true,
    },
  })
  return NextResponse.json(contacts)
}
