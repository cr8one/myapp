import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPcViewer } from "@/lib/pc-takeout-access"
import { STATE_CHANGED, STATE_CHANGED_MESSAGE } from "@/lib/pc-takeout-step"
import { PC_STATUS_DRAFT, PC_STATUS_CONFIRMING, PC_STATUS_ISMS } from "@/lib/pc-takeout"

// 取り下げ：申請者本人が、承認中の申請を下書きに戻す。承認ステップは消え、履歴に残る。
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getPcViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const request = await prisma.pcTakeoutRequest.findFirst({
    where: { id, requester_id: viewer.userId },
    select: { status: true },
  })
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (request.status !== PC_STATUS_CONFIRMING && request.status !== PC_STATUS_ISMS) {
    return NextResponse.json({ error: "承認中の申請だけ取り下げできます" }, { status: 400 })
  }

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.pcTakeoutRequest.updateMany({
        where: { id, requester_id: viewer.userId, status: { in: [PC_STATUS_CONFIRMING, PC_STATUS_ISMS] } },
        data: { status: PC_STATUS_DRAFT, submitted_at: null, completed_at: null },
      })
      if (updated.count === 0) throw new Error(STATE_CHANGED)
      await tx.pcTakeoutApprovalStep.deleteMany({ where: { request_id: id } })
      await tx.pcTakeoutHistory.create({
        data: { request_id: id, action: "取り下げ", actor_id: viewer.userId, actor_name: viewer.name ?? viewer.email },
      })
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e?.message === STATE_CHANGED) return NextResponse.json({ error: STATE_CHANGED_MESSAGE }, { status: 409 })
    throw e
  }
}
