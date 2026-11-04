import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAccountingViewer, slipVisibilityWhere, DRAFT_STATUS } from "@/lib/accounting-slip-access"
import { getRequesterInfo } from "@/lib/accounting-slip-requester"
import { buildApprovalSteps, STATUS_REQUESTER_APPROVING, STATUS_ACCOUNTING_APPROVING, STATUS_RETURNED, STAGE_REQUESTER } from "@/lib/accounting-slip-approval"
import { SLIP_TYPES } from "@/lib/accounting-slip-types"
import { parseTripExpense } from "@/lib/accounting-trip-expense"
import { sendApprovalRequestMail } from "@/lib/accounting-slip-mail"
import { STATE_CHANGED, STATE_CHANGED_MESSAGE } from "@/lib/accounting-slip-step"
import { DeleteObjectCommand } from "@aws-sdk/client-s3"
import { acctS3, ACCT_BUCKET } from "@/lib/accounting-slip-files"

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
      department_code: true,
      department_name: true,
      submitted_at: true,
      completed_at: true,
      created_at: true,
      approval_steps: {
        orderBy: { step_order: "asc" },
        select: { id: true, stage: true, step_order: true, position_name: true, approver_id: true, approver_name: true, status: true, approved_at: true },
      },
      histories: {
        orderBy: { created_at: "asc" },
        select: { id: true, action: true, actor_name: true, comment: true, created_at: true },
      },
      files: {
        orderBy: { uploaded_at: "asc" },
        select: { id: true, file_name: true, file_type: true, uploaded_at: true },
      },
      trip_expense: {
        select: {
          account_name: true,
          account_code: true,
          tax_category: true,
          area_purpose: true,
          trip_area: true,
          trip_purpose: true,
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
  const isOwner = slip.requester_id === viewer.userId
  const editable = isOwner && (slip.status === DRAFT_STATUS || slip.status === STATUS_RETURNED)
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
    is_owner: isOwner,
    can_edit: editable,
    can_edit_files: editable,
    can_delete: isOwner && slip.status === DRAFT_STATUS && slip.histories.length === 0,
    can_withdraw: isOwner && inApproval,
    can_pdf: slip.status === "承認完了" && slip.slip_type === "trip_expense",
    approvable_step_id: approvable?.id ?? null,
  })
}

// 編集：起案者本人が、下書きまたは差戻しの伝票を書き直す。「申請する」で保存すると、承認ステップを作り直して承認中にする
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  // 他人の伝票は、存在しない伝票と同じく404
  const slip = await prisma.acctSlip.findFirst({
    where: { id, requester_id: viewer.userId },
    select: { status: true, slip_type: true },
  })
  if (!slip) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (slip.status !== DRAFT_STATUS && slip.status !== STATUS_RETURNED) {
    return NextResponse.json({ error: "下書きまたは差戻しの伝票だけ編集できます" }, { status: 400 })
  }
  const type = SLIP_TYPES.find(t => t.value === slip.slip_type)
  if (!type || type.value !== "trip_expense") {
    return NextResponse.json({ error: "この種類の伝票は、まだ編集できません" }, { status: 400 })
  }

  const b = await req.json()
  const submit = b.submit === true
  const sendMail = b.send_mail === true
  const parsed = parseTripExpense(b, submit)
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const v = parsed.value

  const info = await getRequesterInfo(viewer.userId)
  if (!info) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // 部門コードも部署名も空のときは、ユーザーマスタの値で補う
  const noDept = !v.departmentCode && !v.departmentName
  const departmentCode = (noDept ? info.departmentCode : v.departmentCode) || null
  const departmentName = (noDept ? info.departmentName : v.departmentName) || null
  const title = `${type.label} ${v.dateText.replace(/-/g, "/")}`

  let steps: Awaited<ReturnType<typeof buildApprovalSteps>>["steps"] = []
  if (submit) {
    const built = await buildApprovalSteps(viewer.userId, type.routeServiceType)
    if (built.error) return NextResponse.json({ error: built.error }, { status: 400 })
    steps = built.steps
  }
  const nextStatus = steps.some(s => s.stage === STAGE_REQUESTER) ? STATUS_REQUESTER_APPROVING : STATUS_ACCOUNTING_APPROVING
  const wasReturned = slip.status === STATUS_RETURNED

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.acctSlip.updateMany({
        where: { id, requester_id: viewer.userId, status: { in: [DRAFT_STATUS, STATUS_RETURNED] } },
        data: {
          title,
          slip_date: v.slipDate,
          amount: v.expense.total_amount,
          department_code: departmentCode,
          department_name: departmentName,
          ...(submit ? { status: nextStatus, submitted_at: new Date(), completed_at: null } : {}),
        },
      })
      if (updated.count === 0) throw new Error(STATE_CHANGED)
      await tx.acctTripExpense.update({ where: { slip_id: id }, data: v.expense })
      if (submit) {
        await tx.acctSlipApprovalStep.deleteMany({ where: { slip_id: id } })
        await tx.acctSlipApprovalStep.createMany({ data: steps.map(s => ({ ...s, slip_id: id })) })
        await tx.acctSlipHistory.create({
          data: { slip_id: id, action: wasReturned ? "再申請" : "申請", actor_id: viewer.userId, actor_name: info.name },
        })
      }
    })
    if (submit && sendMail) await sendApprovalRequestMail(id)
    return NextResponse.json({ ok: true, status: submit ? nextStatus : slip.status })
  } catch (e: any) {
    if (e?.message === STATE_CHANGED) return NextResponse.json({ error: STATE_CHANGED_MESSAGE }, { status: 409 })
    throw e
  }
}

// 削除：起案者本人が、下書きの伝票だけ削除できる。一度でも申請した伝票（履歴がある伝票）は削除できない
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const slip = await prisma.acctSlip.findFirst({
    where: { id, requester_id: viewer.userId },
    select: { status: true },
  })
  if (!slip) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (slip.status !== DRAFT_STATUS) {
    return NextResponse.json({ error: "下書きの伝票だけ削除できます" }, { status: 400 })
  }
  const files = await prisma.acctSlipFile.findMany({ where: { slip_id: id }, select: { file_key: true } })
  const deleted = await prisma.acctSlip.deleteMany({
    where: { id, requester_id: viewer.userId, status: DRAFT_STATUS, histories: { none: {} } },
  })
  if (deleted.count === 0) {
    return NextResponse.json({ error: "一度申請した伝票は削除できません" }, { status: 400 })
  }
  // S3の添付の実物も消す（できなくても、削除は成功として扱う。ログに残す）
  for (const f of files) {
    await acctS3.send(new DeleteObjectCommand({ Bucket: ACCT_BUCKET, Key: f.file_key })).catch(e => console.error("添付の削除エラー:", e))
  }
  return NextResponse.json({ ok: true })
}
