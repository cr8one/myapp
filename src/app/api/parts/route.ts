import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const parts = await prisma.part.findMany({
    include: {
      product: {
        select: { code: true, name: true }
      }
    },
    orderBy: { createdAt: "desc" }
  })
  return NextResponse.json(parts)
}
