import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPcViewer } from "@/lib/pc-takeout-access"
import { checkActionablePcStep, STATE_CHANGED, STATE_CHANGED_MESSAGE } from "@/lib/pc-takeout-step"
import { sendPcApprovalRequestMail } from "@/lib/pc-takeout-mail"
import { PC_STATUS_CONFIRMING, PC_STATUS_ISMS, PC_STATUS_COMPLETED, PC_ROLE_CONFIRMER } from "@/lib/pc-takeout"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  const viewer = await getPcViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, stepId } = await params
  const body = await req.json().catch(() => ({}))
  const sendMail = body?.send_mail === true

  const denied = await checkActionablePcStep(viewer, id, stepId)
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })

  try {
    // 複数の書き込みは、コールバック形式のトランザクションで行う。状態が途中で変わっていたら、すべて取り消す
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.pcTakeoutApprovalStep.updateMany({
        where: { id: stepId, request_id: id, status: "未承認" },
        data: { status: "承認済み", approved_at: new Date() },
      })
      if (updated.count === 0) throw new Error(STATE_CHANGED)
      const steps = await tx.pcTakeoutApprovalStep.findMany({
        where: { request_id: id },
        select: { id: true, role: true, step_order: true, status: true },
      })
      const remaining = steps.filter(s => s.status !== "承認済み")
      const myOrder = steps.find(s => s.id === stepId)?.step_order
      const orderCompleted = !remaining.some(s => s.step_order === myOrder)
      const next = remaining.length === 0
        ? PC_STATUS_COMPLETED
        : remaining.some(s => s.role === PC_ROLE_CONFIRMER) ? PC_STATUS_CONFIRMING : PC_STATUS_ISMS
      const requestUpdated = await tx.pcTakeoutRequest.updateMany({
        where: { id, status: { in: [PC_STATUS_CONFIRMING, PC_STATUS_ISMS] } },
        data: { status: next, ...(next === PC_STATUS_COMPLETED ? { completed_at: new Date() } : {}) },
      })
      if (requestUpdated.count === 0) throw new Error(STATE_CHANGED)
      await tx.pcTakeoutHistory.create({
        data: { request_id: id, action: "承認", actor_id: viewer.userId, actor_name: viewer.name ?? viewer.email },
      })
      return { status: next, orderCompleted }
    })
    // 次の順序に進んだときだけ、次の承認者へ依頼メールを送る（最後の承認や、同じ順序が残っているときは送らない）
    if (sendMail && result.orderCompleted && result.status !== PC_STATUS_COMPLETED) await sendPcApprovalRequestMail(id)
    return NextResponse.json({ ok: true, status: result.status })
  } catch (e: any) {
    if (e?.message === STATE_CHANGED) return NextResponse.json({ error: STATE_CHANGED_MESSAGE }, { status: 409 })
    throw e
  }
}
