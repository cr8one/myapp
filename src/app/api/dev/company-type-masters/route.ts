import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const masters = await prisma.devCompanyTypeMaster.findMany({
    orderBy: { sortOrder: "asc" },
  })
  return NextResponse.json(masters)
}
