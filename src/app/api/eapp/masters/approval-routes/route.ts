import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const routes = await prisma.mApprovalRoute.findMany({
    orderBy: { step_order: "asc" },
    include: {
      position: { select: { id: true, name: true } },
      approver: { select: { id: true, name: true, email: true } },
    },
  })
  return NextResponse.json(routes)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { step_order, position_id, approver_user_id } = await req.json()
  const route = await prisma.mApprovalRoute.create({
    data: {
      step_order: step_order ?? 0,
      position_id: position_id || null,
      approver_user_id: approver_user_id || null,
    },
    include: {
      position: { select: { id: true, name: true } },
      approver: { select: { id: true, name: true, email: true } },
    },
  })
  return NextResponse.json(route)
}
