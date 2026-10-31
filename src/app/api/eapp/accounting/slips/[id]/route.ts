import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAccountingViewer, slipVisibilityWhere } from "@/lib/accounting-slip-access"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  // 見てよい伝票だけを探す。見られない伝票は、存在しない伝票と同じく404を返す
  const slip = await prisma.acctSlip.findFirst({
    where: { AND: [{ id }, slipVisibilityWhere(viewer)] },
    select: {
      id: true,
      slip_no: true,
      slip_type: true,
      title: true,
      status: true,
      slip_date: true,
      amount: true,
      requester_id: true,
      requester_name: true,
      department_name: true,
      submitted_at: true,
      completed_at: true,
      created_at: true,
      approval_steps: {
        orderBy: { step_order: "asc" },
        select: { id: true, stage: true, step_order: true, position_name: true, approver_id: true, approver_name: true, status: true, approved_at: true },
      },
      trip_expense: {
        select: {
          account_name: true,
          account_code: true,
          tax_category: true,
          area_purpose: true,
          trip_dates: true,
          transport_items: true,
          lodging_items: true,
          allowance_items: true,
          transport_subtotal: true,
          lodging_subtotal: true,
          allowance_subtotal: true,
          total_amount: true,
        },
      },
    },
  })
  if (!slip) return NextResponse.json({ error: "Not found" }, { status: 404 })
  // 今この人が承認できるステップ（自分が承認者で、前の順序がすべて承認済み）。承認者のIDは画面に返さない
  const inApproval = slip.status === "起案部承認中" || slip.status === "経理承認中"
  const approvable = inApproval
    ? slip.approval_steps.find(s =>
        s.approver_id === viewer.userId &&
        s.status !== "承認済み" &&
        !slip.approval_steps.some(o => o.step_order < s.step_order && o.status !== "承認済み"))
    : undefined
  const steps = slip.approval_steps.map(s => ({
    id: s.id, stage: s.stage, step_order: s.step_order, position_name: s.position_name,
    approver_name: s.approver_name, status: s.status, approved_at: s.approved_at,
  }))
  return NextResponse.json({
    ...slip,
    approval_steps: steps,
    is_owner: slip.requester_id === viewer.userId,
    approvable_step_id: approvable?.id ?? null,
  })
}
