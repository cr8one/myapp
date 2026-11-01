import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAccountingViewer, DRAFT_STATUS } from "@/lib/accounting-slip-access"
import { getRequesterInfo } from "@/lib/accounting-slip-requester"
import { buildApprovalSteps, STAGE_REQUESTER, STATUS_REQUESTER_APPROVING, STATUS_ACCOUNTING_APPROVING } from "@/lib/accounting-slip-approval"
import { SLIP_TYPES } from "@/lib/accounting-slip-types"
import { parseTripExpense } from "@/lib/accounting-trip-expense"
import { sendApprovalRequestMail } from "@/lib/accounting-slip-mail"

const TRIP = SLIP_TYPES.find(t => t.value === "trip_expense")!

export async function POST(req: NextRequest) {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const b = await req.json()
  const submit = b.submit === true
  const sendMail = b.send_mail === true

  const parsed = parseTripExpense(b, submit)
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const v = parsed.value

  const info = await getRequesterInfo(viewer.userId)
  if (!info) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const departmentName = v.departmentName || info.departmentText || null
  const title = v.title || `${TRIP.label} ${v.dateText.replace(/-/g, "/")}`

  // 申請のときだけ、承認ステップを作る
  let steps: Awaited<ReturnType<typeof buildApprovalSteps>>["steps"] = []
  if (submit) {
    const built = await buildApprovalSteps(viewer.userId, TRIP.routeServiceType)
    if (built.error) return NextResponse.json({ error: built.error }, { status: 400 })
    steps = built.steps
  }
  const status = !submit
    ? DRAFT_STATUS
    : steps.some(s => s.stage === STAGE_REQUESTER) ? STATUS_REQUESTER_APPROVING : STATUS_ACCOUNTING_APPROVING

  const record = await prisma.acctSlip.create({
    data: {
      slip_type: TRIP.value,
      title,
      status,
      slip_date: v.slipDate,
      amount: v.expense.total_amount,
      requester_id: viewer.userId,
      requester_name: info.name,
      department_name: departmentName,
      submitted_at: submit ? new Date() : null,
      trip_expense: { create: v.expense },
      approval_steps: submit ? { create: steps } : undefined,
      histories: submit ? { create: { action: "申請", actor_id: viewer.userId, actor_name: info.name } } : undefined,
    },
    select: { id: true, slip_no: true, status: true },
  })
  if (submit && sendMail) await sendApprovalRequestMail(record.id)
  return NextResponse.json(record)
}
