import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const members = await prisma.user.findMany({
    where: { dppMember: true },
    select: { id: true, name: true, shortName: true },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(members)
}
