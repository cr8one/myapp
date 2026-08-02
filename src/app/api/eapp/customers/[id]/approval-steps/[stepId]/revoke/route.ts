import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "管理者のみ取り消しできます" }, { status: 403 })
  }
  const { id, stepId } = await params

  await prisma.tokuiCreditRequestApprovalStep.update({
    where: { id: stepId },
    data: { status: "未承認", approved_at: null },
  })

  // 申請本体が承認完了になっていた場合は申請済みに戻す
  const request = await prisma.tokuiCreditRequest.findUnique({ where: { id } })
  if (request?.status === "承認完了") {
    await prisma.tokuiCreditRequest.update({
      where: { id },
      data: { status: "申請済み" },
    })
  }

  const updated = await prisma.tokuiCreditRequestApprovalStep.findMany({
    where: { request_id: id },
    orderBy: { step_order: "asc" },
  })
  return NextResponse.json({ steps: updated })
}
