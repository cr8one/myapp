import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const logs = await prisma.auditLog.findMany({
    where: { targetModel: "DxfRequest", targetId: id },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(logs)
}