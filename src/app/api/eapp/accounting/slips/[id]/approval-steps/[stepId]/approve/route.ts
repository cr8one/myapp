import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAccountingViewer } from "@/lib/accounting-slip-access"
import { STAGE_REQUESTER, STATUS_REQUESTER_APPROVING, STATUS_ACCOUNTING_APPROVING, STATUS_COMPLETED } from "@/lib/accounting-slip-approval"
import { checkActionableStep, STATE_CHANGED, STATE_CHANGED_MESSAGE } from "@/lib/accounting-slip-step"
import { sendApprovalRequestMail } from "@/lib/accounting-slip-mail"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, stepId } = await params
  const body = await req.json().catch(() => ({}))
  const sendMail = body?.send_mail === true

  const denied = await checkActionableStep(viewer, id, stepId)
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })

  try {
    // 複数の書き込みは、コールバック形式のトランザクションで行う。状態が途中で変わっていたら、すべて取り消す
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.acctSlipApprovalStep.updateMany({
        where: { id: stepId, slip_id: id, status: "未承認" },
        data: { status: "承認済み", approved_at: new Date() },
      })
      if (updated.count === 0) throw new Error(STATE_CHANGED)
      // 経理側は、同じ順序の承認者のうち1人が承認したら、その順序は完了とする。まだ承認していない同じ順序のステップは、ここで削除する
      let skipNote: string | null = null
      const mine = await tx.acctSlipApprovalStep.findUnique({ where: { id: stepId }, select: { stage: true, step_order: true } })
      if (mine && mine.stage !== STAGE_REQUESTER) {
        const others = await tx.acctSlipApprovalStep.findMany({
          where: { slip_id: id, stage: mine.stage, step_order: mine.step_order, status: "未承認", id: { not: stepId } },
          select: { id: true, approver_name: true },
        })
        if (others.length > 0) {
          await tx.acctSlipApprovalStep.deleteMany({ where: { id: { in: others.map(o => o.id) }, status: "未承認" } })
          skipNote = `同じ順序の他の承認者（${others.map(o => o.approver_name ?? "不明").join("、")}）の承認は、不要になりました`
        }
      }
      const steps = await tx.acctSlipApprovalStep.findMany({
        where: { slip_id: id },
        select: { id: true, stage: true, step_order: true, status: true },
      })
      const remaining = steps.filter(s => s.status !== "承認済み")
      const myOrder = steps.find(s => s.id === stepId)?.step_order
      const orderCompleted = !remaining.some(s => s.step_order === myOrder)
      const next = remaining.length === 0
        ? STATUS_COMPLETED
        : remaining.some(s => s.stage === STAGE_REQUESTER) ? STATUS_REQUESTER_APPROVING : STATUS_ACCOUNTING_APPROVING
      const slipUpdated = await tx.acctSlip.updateMany({
        where: { id, status: { in: [STATUS_REQUESTER_APPROVING, STATUS_ACCOUNTING_APPROVING] } },
        data: { status: next, ...(next === STATUS_COMPLETED ? { completed_at: new Date() } : {}) },
      })
      if (slipUpdated.count === 0) throw new Error(STATE_CHANGED)
      await tx.acctSlipHistory.create({
        data: { slip_id: id, action: "承認", actor_id: viewer.userId, actor_name: viewer.name ?? viewer.email, comment: skipNote },
      })
      return { status: next, orderCompleted }
    })
    // 次の順序に進んだときだけ、次の承認者へ依頼メールを送る（最後の承認や、同じ順序が残っているときは送らない）
    if (sendMail && result.orderCompleted && result.status !== STATUS_COMPLETED) await sendApprovalRequestMail(id)
    return NextResponse.json({ ok: true, status: result.status })
  } catch (e: any) {
    if (e?.message === STATE_CHANGED) return NextResponse.json({ error: STATE_CHANGED_MESSAGE }, { status: 409 })
    throw e
  }
}
