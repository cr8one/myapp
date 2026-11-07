import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

// 履歴を読める対象のモデル（許可リスト）。ここにないモデルの履歴は、このAPIでは返さない
const ALLOWED_MODELS = ["DevCompany", "DevProject", "DevExhibition"]

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const targetModel = req.nextUrl.searchParams.get("targetModel") ?? ""
  const targetId = req.nextUrl.searchParams.get("targetId") ?? ""
  if (!ALLOWED_MODELS.includes(targetModel) || !targetId) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }

  const logs = await prisma.auditLog.findMany({
    where: { targetModel, targetId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(logs)
}
