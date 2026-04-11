import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const user = await prisma.user.update({
    where: { email: "admin@example.com" },
    data: { role: "ADMIN" },
    select: { id: true, email: true, role: true },
  })
  return NextResponse.json(user)
}
