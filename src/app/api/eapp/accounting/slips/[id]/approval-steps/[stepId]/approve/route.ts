import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAccountingViewer, slipVisibilityWhere } from "@/lib/accounting-slip-access"
import { STAGE_REQUESTER, STATUS_REQUESTER_APPROVING, STATUS_ACCOUNTING_APPROVING, STATUS_COMPLETED } from "@/lib/accounting-slip-approval"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, stepId } = await params

  // 見てよい伝票だけを対象にする。見られない伝票は、存在しない伝票と同じく404
  const slip = await prisma.acctSlip.findFirst({
    where: { AND: [{ id }, slipVisibilityWhere(viewer)] },
    select: {
      status: true,
      approval_steps: {
        orderBy: { step_order: "asc" },
        select: { id: true, stage: true, step_order: true, approver_id: true, status: true },
      },
    },
  })
  if (!slip) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const target = slip.approval_steps.find(s => s.id === stepId)
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (slip.status !== STATUS_REQUESTER_APPROVING && slip.status !== STATUS_ACCOUNTING_APPROVING) {
    return NextResponse.json({ error: "この伝票は、今は承認できません" }, { status: 400 })
  }
  if (!target.approver_id || target.approver_id !== viewer.userId) {
    return NextResponse.json({ error: "このステップの承認者本人のみ承認できます" }, { status: 403 })
  }
  if (target.status === "承認済み") {
    return NextResponse.json({ error: "既に承認済みです" }, { status: 400 })
  }
  const blockedByEarlier = slip.approval_steps.some(s => s.step_order < target.step_order && s.status !== "承認済み")
  if (blockedByEarlier) {
    return NextResponse.json({ error: "前の順序の承認が完了していないため承認できません" }, { status: 400 })
  }

  // 同時に2回押されても1回しか通らないよう、未承認のものだけを更新する。複数の書き込みは、コールバック形式のトランザクションで行う
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.acctSlipApprovalStep.updateMany({
      where: { id: stepId, slip_id: id, status: "未承認" },
      data: { status: "承認済み", approved_at: new Date() },
    })
    if (updated.count === 0) return { error: "既に承認済みです" }
    const steps = await tx.acctSlipApprovalStep.findMany({
      where: { slip_id: id },
      select: { stage: true, status: true },
    })
    const remaining = steps.filter(s => s.status !== "承認済み")
    const status = remaining.length === 0
      ? STATUS_COMPLETED
      : remaining.some(s => s.stage === STAGE_REQUESTER) ? STATUS_REQUESTER_APPROVING : STATUS_ACCOUNTING_APPROVING
    await tx.acctSlip.update({
      where: { id },
      data: { status, ...(status === STATUS_COMPLETED ? { completed_at: new Date() } : {}) },
    })
    return { status }
  })
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ ok: true, status: result.status })
}
