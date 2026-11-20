import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAccountingViewer } from "@/lib/accounting-slip-access"
import { STATUS_COMPLETED } from "@/lib/accounting-slip-approval"
import { STATE_CHANGED, STATE_CHANGED_MESSAGE } from "@/lib/accounting-slip-step"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const toDate = (s: string) => new Date(`${s}T00:00:00.000Z`)

// 支払を記録した伝票の取得（仮払金請求受領書で、承認が完了していること）
async function loadSlip(id: string) {
  return prisma.acctSlip.findUnique({
    where: { id },
    select: {
      slip_type: true,
      status: true,
      advance_request: { select: { advance_amount: true, paid_date: true, received_date: true } },
    },
  })
}

// 支払の記録（経理担当・システム管理者）。支払額は、請求の仮払金額に固定する
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!viewer.canViewAll) return NextResponse.json({ error: "経理担当だけ、支払を記録できます" }, { status: 403 })
  const { id } = await params
  const b = await req.json().catch(() => ({}))

  const slip = await loadSlip(id)
  if (!slip || slip.slip_type !== "advance_request" || !slip.advance_request) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (slip.status !== STATUS_COMPLETED) return NextResponse.json({ error: "承認が完了した仮払金請求だけ、支払を記録できます" }, { status: 400 })
  if (slip.advance_request.paid_date) return NextResponse.json({ error: "すでに支払が記録されています" }, { status: 400 })

  const paidDate = String(b?.paid_date ?? "")
  if (!DATE_RE.test(paidDate) || isNaN(toDate(paidDate).getTime())) return NextResponse.json({ error: "支払日を入力してください" }, { status: 400 })
  const method = String(b?.paid_method ?? "").trim().slice(0, 20)
  if (!method) return NextResponse.json({ error: "支払方法を入力してください" }, { status: 400 })

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.acctAdvanceRequest.updateMany({
        where: { slip_id: id, paid_date: null },
        data: {
          paid_date: toDate(paidDate),
          paid_method: method,
          paid_amount: slip.advance_request!.advance_amount,
          paid_by_id: viewer.userId,
          paid_by_name: viewer.name ?? viewer.email,
        },
      })
      if (updated.count === 0) throw new Error(STATE_CHANGED)
      await tx.acctSlipHistory.create({
        data: { slip_id: id, action: "支払記録", actor_id: viewer.userId, actor_name: viewer.name ?? viewer.email },
      })
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e?.message === STATE_CHANGED) return NextResponse.json({ error: STATE_CHANGED_MESSAGE }, { status: 409 })
    throw e
  }
}

// 支払の取り消し。受領の記録がないときだけ
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!viewer.canViewAll) return NextResponse.json({ error: "経理担当だけ、支払を取り消せます" }, { status: 403 })
  const { id } = await params

  const slip = await loadSlip(id)
  if (!slip || slip.slip_type !== "advance_request" || !slip.advance_request) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!slip.advance_request.paid_date) return NextResponse.json({ error: "支払の記録がありません" }, { status: 400 })
  if (slip.advance_request.received_date) return NextResponse.json({ error: "受領済みのため、取り消せません" }, { status: 400 })

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.acctAdvanceRequest.updateMany({
        where: { slip_id: id, paid_date: { not: null }, received_date: null },
        data: { paid_date: null, paid_method: null, paid_amount: null, paid_by_id: null, paid_by_name: null },
      })
      if (updated.count === 0) throw new Error(STATE_CHANGED)
      await tx.acctSlipHistory.create({
        data: { slip_id: id, action: "支払取消", actor_id: viewer.userId, actor_name: viewer.name ?? viewer.email },
      })
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e?.message === STATE_CHANGED) return NextResponse.json({ error: STATE_CHANGED_MESSAGE }, { status: 409 })
    throw e
  }
}
