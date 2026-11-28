import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAccountingViewer, DRAFT_STATUS } from "@/lib/accounting-slip-access"
import { getRequesterInfo } from "@/lib/accounting-slip-requester"
import { buildApprovalSteps, STAGE_REQUESTER, STATUS_REQUESTER_APPROVING, STATUS_ACCOUNTING_APPROVING } from "@/lib/accounting-slip-approval"
import { SLIP_TYPES } from "@/lib/accounting-slip-types"
import { parseReception } from "@/lib/accounting-reception"
import { sendApprovalRequestMail } from "@/lib/accounting-slip-mail"

const REC = SLIP_TYPES.find(t => t.value === "reception_approval")!

export async function POST(req: NextRequest) {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const b = await req.json()
  const submit = b.submit === true
  const sendMail = b.send_mail === true

  const parsed = parseReception(b, submit)
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const v = parsed.value

  const info = await getRequesterInfo(viewer.userId)
  if (!info) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // 部門コードも部署名も空のときは、ユーザーマスタの値で補う
  const noDept = !v.departmentCode && !v.departmentName
  const departmentCode = (noDept ? info.departmentCode : v.departmentCode) || null
  const departmentName = (noDept ? info.departmentName : v.departmentName) || null
  const title = `${REC.label} ${v.dateText.replace(/-/g, "/")}`

  // 申請のときだけ、承認ステップを作る（起案側のあと、この書類専用の設定に登録した社長）
  let steps: Awaited<ReturnType<typeof buildApprovalSteps>>["steps"] = []
  if (submit) {
    // 経理の承認は要らない。予算額に応じて、起案側の承認者（ユーザーマスタの、金額ごとの設定）を分ける
    const built = await buildApprovalSteps(viewer.userId, REC.routeServiceType, { amount: v.reception.budget_amount, skipAccounting: true })
    if (built.error) return NextResponse.json({ error: built.error }, { status: 400 })
    steps = built.steps
  }
  const status = !submit
    ? DRAFT_STATUS
    : steps.some(s => s.stage === STAGE_REQUESTER) ? STATUS_REQUESTER_APPROVING : STATUS_ACCOUNTING_APPROVING

  const record = await prisma.acctSlip.create({
    data: {
      slip_type: REC.value,
      title,
      status,
      slip_date: v.slipDate,
      amount: v.reception.budget_amount,
      requester_id: viewer.userId,
      requester_name: info.name,
      department_code: departmentCode,
      department_name: departmentName,
      submitted_at: submit ? new Date() : null,
      reception_approval: { create: v.reception },
      approval_steps: submit ? { create: steps } : undefined,
      histories: submit ? { create: { action: "申請", actor_id: viewer.userId, actor_name: info.name } } : undefined,
    },
    select: { id: true, slip_no: true, status: true },
  })
  if (submit && sendMail) await sendApprovalRequestMail(record.id)
  return NextResponse.json(record)
}
