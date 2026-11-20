import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAccountingViewer } from "@/lib/accounting-slip-access"
import { STATUS_COMPLETED } from "@/lib/accounting-slip-approval"
import { STATE_CHANGED, STATE_CHANGED_MESSAGE } from "@/lib/accounting-slip-step"

// 受領の記録。起案者本人だけが、支払の記録のあとに、記録できる。受領日は、サーバー側で今日の日付（日本時間）を入れる。取り消しはできない
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  // 他人の伝票は、存在しない伝票と同じく404
  const slip = await prisma.acctSlip.findFirst({
    where: { id, requester_id: viewer.userId },
    select: {
      slip_type: true,
      status: true,
      advance_request: { select: { paid_date: true, received_date: true } },
    },
  })
  if (!slip || slip.slip_type !== "advance_request" || !slip.advance_request) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (slip.status !== STATUS_COMPLETED) return NextResponse.json({ error: "承認が完了した仮払金請求だけ、受領を記録できます" }, { status: 400 })
  if (!slip.advance_request.paid_date) return NextResponse.json({ error: "支払が記録されてから、受領を記録できます" }, { status: 400 })
  if (slip.advance_request.received_date) return NextResponse.json({ error: "すでに受領が記録されています" }, { status: 400 })

  // 日本時間の今日の日付
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const today = new Date(`${jst.toISOString().slice(0, 10)}T00:00:00.000Z`)

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.acctAdvanceRequest.updateMany({
        where: { slip_id: id, paid_date: { not: null }, received_date: null },
        data: { received_date: today, received_by_id: viewer.userId, received_by_name: viewer.name ?? viewer.email },
      })
      if (updated.count === 0) throw new Error(STATE_CHANGED)
      await tx.acctSlipHistory.create({
        data: { slip_id: id, action: "受領記録", actor_id: viewer.userId, actor_name: viewer.name ?? viewer.email },
      })
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e?.message === STATE_CHANGED) return NextResponse.json({ error: STATE_CHANGED_MESSAGE }, { status: 409 })
    throw e
  }
}
