import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAccountingViewer, DRAFT_STATUS } from "@/lib/accounting-slip-access"
import { STATUS_REQUESTER_APPROVING, STATUS_ACCOUNTING_APPROVING } from "@/lib/accounting-slip-approval"
import { STATE_CHANGED, STATE_CHANGED_MESSAGE } from "@/lib/accounting-slip-step"

// 取り下げ：起案者本人が、承認中の伝票を下書きに戻す。承認ステップは消え、履歴に残る。
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const slip = await prisma.acctSlip.findFirst({
    where: { id, requester_id: viewer.userId },
    select: { status: true },
  })
  if (!slip) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (slip.status !== STATUS_REQUESTER_APPROVING && slip.status !== STATUS_ACCOUNTING_APPROVING) {
    return NextResponse.json({ error: "承認中の伝票だけ取り下げできます" }, { status: 400 })
  }

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.acctSlip.updateMany({
        where: { id, requester_id: viewer.userId, status: { in: [STATUS_REQUESTER_APPROVING, STATUS_ACCOUNTING_APPROVING] } },
        data: { status: DRAFT_STATUS, submitted_at: null, completed_at: null },
      })
      if (updated.count === 0) throw new Error(STATE_CHANGED)
      await tx.acctSlipApprovalStep.deleteMany({ where: { slip_id: id } })
      await tx.acctSlipHistory.create({
        data: { slip_id: id, action: "取り下げ", actor_id: viewer.userId, actor_name: viewer.name ?? viewer.email },
      })
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e?.message === STATE_CHANGED) return NextResponse.json({ error: STATE_CHANGED_MESSAGE }, { status: 409 })
    throw e
  }
}
