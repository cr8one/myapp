import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const isAdmin = session.user?.role === "ADMIN"
  const permission = isAdmin ? null : await prisma.userPermission.findUnique({
    where: { userId: session.user.id },
  })
  return NextResponse.json({ isAdmin, permission })
}
