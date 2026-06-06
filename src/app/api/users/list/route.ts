import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const users = await prisma.user.findMany({
    select: { id: true, name: true, department: true, position: true },
    orderBy: [{ department: "asc" }, { name: "asc" }],
  })

  return NextResponse.json(users)
}
