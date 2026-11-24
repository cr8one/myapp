import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAccountingViewer } from "@/lib/accounting-slip-access"
import { STATUS_COMPLETED } from "@/lib/accounting-slip-approval"
import { STATE_CHANGED, STATE_CHANGED_MESSAGE } from "@/lib/accounting-slip-step"

// 実際額の記録。起案者本人だけが、承認が完了したあと、接待のあとに、1回だけ記録できる
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const b = await req.json().catch(() => ({}))

  // 他人の伝票は、存在しない伝票と同じく404
  const slip = await prisma.acctSlip.findFirst({
    where: { id, requester_id: viewer.userId },
    select: {
      slip_type: true,
      status: true,
      reception_approval: { select: { actual_recorded_at: true } },
    },
  })
  if (!slip || slip.slip_type !== "reception_approval" || !slip.reception_approval) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (slip.status !== STATUS_COMPLETED) return NextResponse.json({ error: "承認が完了した承認書だけ、実際額を記録できます" }, { status: 400 })
  if (slip.reception_approval.actual_recorded_at) return NextResponse.json({ error: "すでに実際額が記録されています" }, { status: 400 })

  const n = Number(b?.actual_amount)
  if (b?.actual_amount === "" || b?.actual_amount === null || b?.actual_amount === undefined || !Number.isInteger(n) || n < 0 || n > 99999999) {
    return NextResponse.json({ error: "実際額を正しく入力してください" }, { status: 400 })
  }

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.acctReceptionApproval.updateMany({
        where: { slip_id: id, actual_recorded_at: null },
        data: { actual_amount: n, actual_recorded_at: new Date(), actual_recorded_by_id: viewer.userId, actual_recorded_by_name: viewer.name ?? viewer.email },
      })
      if (updated.count === 0) throw new Error(STATE_CHANGED)
      await tx.acctSlipHistory.create({
        data: { slip_id: id, action: "実際額記録", actor_id: viewer.userId, actor_name: viewer.name ?? viewer.email },
      })
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e?.message === STATE_CHANGED) return NextResponse.json({ error: STATE_CHANGED_MESSAGE }, { status: 409 })
    throw e
  }
}
