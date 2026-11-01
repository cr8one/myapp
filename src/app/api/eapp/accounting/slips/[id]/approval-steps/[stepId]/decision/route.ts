import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAccountingViewer } from "@/lib/accounting-slip-access"
import { STATUS_REQUESTER_APPROVING, STATUS_ACCOUNTING_APPROVING, STATUS_RETURNED, STATUS_REJECTED } from "@/lib/accounting-slip-approval"
import { checkActionableStep, STATE_CHANGED, STATE_CHANGED_MESSAGE } from "@/lib/accounting-slip-step"

// 差戻し（起案者が直して再申請できる）と却下（終了）。どちらも、理由の入力が必須。
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, stepId } = await params

  const body = await req.json()
  if (body.action !== "return" && body.action !== "reject") {
    return NextResponse.json({ error: "操作の種類が正しくありません" }, { status: 400 })
  }
  const comment = String(body.comment ?? "").trim().slice(0, 1000)
  if (!comment) return NextResponse.json({ error: "理由を入力してください" }, { status: 400 })

  const denied = await checkActionableStep(viewer, id, stepId)
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })

  const isReturn = body.action === "return"
  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.acctSlip.updateMany({
        where: { id, status: { in: [STATUS_REQUESTER_APPROVING, STATUS_ACCOUNTING_APPROVING] } },
        data: { status: isReturn ? STATUS_RETURNED : STATUS_REJECTED },
      })
      if (updated.count === 0) throw new Error(STATE_CHANGED)
      await tx.acctSlipHistory.create({
        data: {
          slip_id: id,
          action: isReturn ? "差戻し" : "却下",
          actor_id: viewer.userId,
          actor_name: viewer.name ?? viewer.email,
          comment,
        },
      })
    })
    return NextResponse.json({ ok: true, status: isReturn ? STATUS_RETURNED : STATUS_REJECTED })
  } catch (e: any) {
    if (e?.message === STATE_CHANGED) return NextResponse.json({ error: STATE_CHANGED_MESSAGE }, { status: 409 })
    throw e
  }
}
