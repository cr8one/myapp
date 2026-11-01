import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAccountingViewer } from "@/lib/accounting-slip-access"
import { STAGE_REQUESTER, STATUS_REQUESTER_APPROVING, STATUS_ACCOUNTING_APPROVING, STATUS_COMPLETED } from "@/lib/accounting-slip-approval"
import { checkActionableStep, STATE_CHANGED, STATE_CHANGED_MESSAGE } from "@/lib/accounting-slip-step"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, stepId } = await params

  const denied = await checkActionableStep(viewer, id, stepId)
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })

  try {
    // 複数の書き込みは、コールバック形式のトランザクションで行う。状態が途中で変わっていたら、すべて取り消す
    const status = await prisma.$transaction(async (tx) => {
      const updated = await tx.acctSlipApprovalStep.updateMany({
        where: { id: stepId, slip_id: id, status: "未承認" },
        data: { status: "承認済み", approved_at: new Date() },
      })
      if (updated.count === 0) throw new Error(STATE_CHANGED)
      const steps = await tx.acctSlipApprovalStep.findMany({
        where: { slip_id: id },
        select: { stage: true, status: true },
      })
      const remaining = steps.filter(s => s.status !== "承認済み")
      const next = remaining.length === 0
        ? STATUS_COMPLETED
        : remaining.some(s => s.stage === STAGE_REQUESTER) ? STATUS_REQUESTER_APPROVING : STATUS_ACCOUNTING_APPROVING
      const slipUpdated = await tx.acctSlip.updateMany({
        where: { id, status: { in: [STATUS_REQUESTER_APPROVING, STATUS_ACCOUNTING_APPROVING] } },
        data: { status: next, ...(next === STATUS_COMPLETED ? { completed_at: new Date() } : {}) },
      })
      if (slipUpdated.count === 0) throw new Error(STATE_CHANGED)
      await tx.acctSlipHistory.create({
        data: { slip_id: id, action: "承認", actor_id: viewer.userId, actor_name: viewer.name ?? viewer.email },
      })
      return next
    })
    return NextResponse.json({ ok: true, status })
  } catch (e: any) {
    if (e?.message === STATE_CHANGED) return NextResponse.json({ error: STATE_CHANGED_MESSAGE }, { status: 409 })
    throw e
  }
}
