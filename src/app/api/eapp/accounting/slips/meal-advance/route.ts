import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAccountingViewer, DRAFT_STATUS } from "@/lib/accounting-slip-access"
import { getRequesterInfo } from "@/lib/accounting-slip-requester"
import { buildApprovalSteps, STAGE_REQUESTER, STATUS_REQUESTER_APPROVING, STATUS_ACCOUNTING_APPROVING } from "@/lib/accounting-slip-approval"
import { SLIP_TYPES } from "@/lib/accounting-slip-types"
import { parseMealAdvance } from "@/lib/accounting-meal-advance"
import { sendApprovalRequestMail } from "@/lib/accounting-slip-mail"
import { checkAdvanceLink } from "@/lib/accounting-advance-link"

// 飲食費及び仮払精算書と交際費精算書は、同じ作りで、種類だけが違う。種類の指定がないときは、飲食費及び仮払精算書として扱う
const MEAL_TYPES = ["meal_advance", "entertainment_expense"] as const

export async function POST(req: NextRequest) {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const b = await req.json()
  const submit = b.submit === true
  const sendMail = b.send_mail === true

  const parsed = parseMealAdvance(b, submit)
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const v = parsed.value

  const slipType = MEAL_TYPES.find(t => t === b.slip_type) ?? "meal_advance"
  const MEAL = SLIP_TYPES.find(t => t.value === slipType)!

  // 仮払金請求受領書との紐づけがあるときは、請求を確認して、仮払金・不足金・残金を、請求の金額で計算し直す
  if (v.meal.advance_request_id) {
    const link = await checkAdvanceLink(viewer.userId, v.meal.advance_request_id, null)
    if ("error" in link) return NextResponse.json({ error: link.error }, { status: 400 })
    v.meal.advance_amount = link.amount
    v.meal.shortage_amount = Math.max(v.meal.subtotal - link.amount, 0)
    v.meal.balance_amount = Math.max(link.amount - v.meal.subtotal, 0)
  }

  const info = await getRequesterInfo(viewer.userId)
  if (!info) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // 部門コードも部署名も空のときは、ユーザーマスタの値で補う
  const noDept = !v.departmentCode && !v.departmentName
  const departmentCode = (noDept ? info.departmentCode : v.departmentCode) || null
  const departmentName = (noDept ? info.departmentName : v.departmentName) || null
  const title = `${MEAL.label} ${v.dateText.replace(/-/g, "/")}`

  // 申請のときだけ、承認ステップを作る
  let steps: Awaited<ReturnType<typeof buildApprovalSteps>>["steps"] = []
  if (submit) {
    const built = await buildApprovalSteps(viewer.userId, MEAL.routeServiceType)
    if (built.error) return NextResponse.json({ error: built.error }, { status: 400 })
    steps = built.steps
  }
  const status = !submit
    ? DRAFT_STATUS
    : steps.some(s => s.stage === STAGE_REQUESTER) ? STATUS_REQUESTER_APPROVING : STATUS_ACCOUNTING_APPROVING

  const record = await prisma.acctSlip.create({
    data: {
      slip_type: slipType,
      title,
      status,
      slip_date: v.slipDate,
      amount: v.meal.subtotal,
      requester_id: viewer.userId,
      requester_name: info.name,
      department_code: departmentCode,
      department_name: departmentName,
      submitted_at: submit ? new Date() : null,
      meal_advance: { create: v.meal },
      approval_steps: submit ? { create: steps } : undefined,
      histories: submit ? { create: { action: "申請", actor_id: viewer.userId, actor_name: info.name } } : undefined,
    },
    select: { id: true, slip_no: true, status: true },
  })
  if (submit && sendMail) await sendApprovalRequestMail(record.id)
  return NextResponse.json(record)
}
