import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, stepId } = await params

  const steps = await prisma.tokuiCreditRequestApprovalStep.findMany({
    where: { request_id: id },
    orderBy: { step_order: "asc" },
  })
  const target = steps.find(s => s.id === stepId)
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // 承認者本人のみ承認可能（メールアドレス照合）
  if (!target.approver_email || target.approver_email !== session.user.email) {
    return NextResponse.json({ error: "このステップの承認者本人のみ承認できます" }, { status: 403 })
  }

  // 自分より前のステップが全て承認済みでなければ承認不可
  const firstPending = steps.find(s => s.status === "未承認")
  if (!firstPending || firstPending.id !== stepId) {
    return NextResponse.json({ error: "前のステップが未承認のため承認できません" }, { status: 400 })
  }

  await prisma.tokuiCreditRequestApprovalStep.update({
    where: { id: stepId },
    data: { status: "承認済み", approved_at: new Date() },
  })

  // 全ステップ承認済みなら申請本体のステータスを更新
  const remaining = steps.filter(s => s.id !== stepId && s.status === "未承認")
  if (remaining.length === 0) {
    await prisma.tokuiCreditRequest.update({
      where: { id },
      data: { status: "承認完了" },
    })
  }

  const updated = await prisma.tokuiCreditRequestApprovalStep.findMany({
    where: { request_id: id },
    orderBy: { step_order: "asc" },
  })
  return NextResponse.json({ steps: updated, allApproved: remaining.length === 0 })
}
