import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPcViewer, pcVisibilityWhere } from "@/lib/pc-takeout-access"
import { getRequesterInfo } from "@/lib/accounting-slip-requester"
import { buildPcApprovalSteps } from "@/lib/pc-takeout-approval"
import { parsePcTakeout } from "@/lib/pc-takeout-input"
import { resolveTakeoutDevice } from "@/lib/pc-takeout-devices"
import { sendPcApprovalRequestMail } from "@/lib/pc-takeout-mail"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})
const BUCKET = "japan-sleeve-system-files-936533876784"
import { STATE_CHANGED, STATE_CHANGED_MESSAGE } from "@/lib/pc-takeout-step"
import {
  PC_STATUS_DRAFT, PC_STATUS_CONFIRMING, PC_STATUS_ISMS, PC_STATUS_RETURNED, PC_ROLE_CONFIRMER,
} from "@/lib/pc-takeout"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getPcViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  // 見てよい申請だけを探す。見られない申請は、存在しない申請と同じく404を返す
  const request = await prisma.pcTakeoutRequest.findFirst({
    where: { AND: [{ id }, pcVisibilityWhere(viewer)] },
    select: {
      id: true,
      request_no: true,
      status: true,
      request_date: true,
      requester_id: true,
      requester_name: true,
      department_name: true,
      reason: true,
      destination: true,
      pledge_version: true,
      pledged_at: true,
      period_start: true,
      period_end: true,
      device_id: true,
      device_name: true,
      model_label: true,
      submitted_at: true,
      completed_at: true,
      created_at: true,
      approval_steps: {
        orderBy: { step_order: "asc" },
        select: { id: true, role: true, step_order: true, position_name: true, approver_id: true, approver_name: true, approver_email: true, status: true, approved_at: true },
      },
      histories: {
        orderBy: { created_at: "asc" },
        select: { id: true, action: true, actor_name: true, comment: true, created_at: true },
      },
    },
  })
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // 今この人が承認できるステップ（自分が承認者で、前の順序がすべて承認済み）。承認者のIDは画面に返さない
  const inApproval = request.status === PC_STATUS_CONFIRMING || request.status === PC_STATUS_ISMS
  const isOwner = request.requester_id === viewer.userId
  const editable = isOwner && (request.status === PC_STATUS_DRAFT || request.status === PC_STATUS_RETURNED)
  const approvable = inApproval
    ? request.approval_steps.find(s =>
        s.approver_id === viewer.userId &&
        s.status !== "承認済み" &&
        !request.approval_steps.some(o => o.step_order < s.step_order && o.status !== "承認済み"))
    : undefined
  // 印影：承認済みのステップの承認者と、申請済み（下書き以外）の申請者の分だけ、署名つきURLを作る
  const stampedEmails = request.approval_steps.filter(s => s.status === "承認済み" && s.approver_email).map(s => s.approver_email as string)
  const requesterUser = request.status !== PC_STATUS_DRAFT
    ? await prisma.user.findUnique({ where: { id: request.requester_id }, select: { email: true, inkanImageKey: true } })
    : null
  const inkanUsers = (stampedEmails.length > 0 || requesterUser)
    ? await prisma.user.findMany({
        where: { email: { in: [...stampedEmails, ...(requesterUser ? [requesterUser.email] : [])] } },
        select: { email: true, inkanImageKey: true },
      })
    : []
  const inkanUrlByEmail: Record<string, string> = {}
  for (const u of inkanUsers) {
    if (u.inkanImageKey) {
      inkanUrlByEmail[u.email] = await getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: u.inkanImageKey }), { expiresIn: 300 })
    }
  }
  const steps = request.approval_steps.map(s => ({
    id: s.id, role: s.role, step_order: s.step_order, position_name: s.position_name,
    approver_name: s.approver_name, status: s.status, approved_at: s.approved_at,
    inkan_image_url: s.status === "承認済み" && s.approver_email ? (inkanUrlByEmail[s.approver_email] ?? null) : null,
  }))
  const { approval_steps: _omit, ...requestBase } = request
  return NextResponse.json({
    ...requestBase,
    requester_inkan_url: requesterUser ? (inkanUrlByEmail[requesterUser.email] ?? null) : null,
    approval_steps: steps,
    is_owner: isOwner,
    can_edit: editable,
    can_delete: isOwner && request.status === PC_STATUS_DRAFT && request.histories.length === 0,
    can_withdraw: isOwner && inApproval,
    approvable_step_id: approvable?.id ?? null,
  })
}

// 編集：申請者本人が、下書きまたは差戻しの申請を書き直す。「申請する」で保存すると、承認ステップを作り直して承認中にする
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getPcViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  // 他人の申請は、存在しない申請と同じく404
  const current = await prisma.pcTakeoutRequest.findFirst({
    where: { id, requester_id: viewer.userId },
    select: { status: true },
  })
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (current.status !== PC_STATUS_DRAFT && current.status !== PC_STATUS_RETURNED) {
    return NextResponse.json({ error: "下書きまたは差戻しの申請だけ編集できます" }, { status: 400 })
  }

  const b = await req.json()
  const submit = b.submit === true
  const sendMail = b.send_mail === true
  const parsed = parsePcTakeout(b, submit)
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const v = parsed.value

  // 端末は、本人の持ち出し用端末として登録されたものだけ。端末名とメーカー・型番は、台帳から取る（画面の値は信用しない）
  let deviceName: string | null = null
  let modelLabel: string | null = null
  if (v.device_id !== null) {
    const dev = await resolveTakeoutDevice(viewer.userId, v.device_id)
    if ("error" in dev) return NextResponse.json({ error: dev.error }, { status: 400 })
    deviceName = dev.device_name
    modelLabel = dev.model_label
  }

  const info = await getRequesterInfo(viewer.userId)
  if (!info) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const departmentName = v.department_name || info.departmentName || null

  let steps: Awaited<ReturnType<typeof buildPcApprovalSteps>>["steps"] = []
  if (submit) {
    const built = await buildPcApprovalSteps(viewer.userId)
    if (built.error) return NextResponse.json({ error: built.error }, { status: 400 })
    steps = built.steps
  }
  const nextStatus = steps.some(s => s.role === PC_ROLE_CONFIRMER) ? PC_STATUS_CONFIRMING : PC_STATUS_ISMS
  const wasReturned = current.status === PC_STATUS_RETURNED

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.pcTakeoutRequest.updateMany({
        where: { id, requester_id: viewer.userId, status: { in: [PC_STATUS_DRAFT, PC_STATUS_RETURNED] } },
        data: {
          request_date: v.request_date,
          department_name: departmentName,
          reason: v.reason,
          period_start: v.period_start,
          period_end: v.period_end,
          destination: v.destination,
          device_id: v.device_id,
          device_name: deviceName,
          model_label: modelLabel,
          pledge_version: v.pledge?.version ?? null,
          pledged_at: v.pledge?.at ?? null,
          ...(submit ? { status: nextStatus, submitted_at: new Date(), completed_at: null } : {}),
        },
      })
      if (updated.count === 0) throw new Error(STATE_CHANGED)
      if (submit) {
        await tx.pcTakeoutApprovalStep.deleteMany({ where: { request_id: id } })
        await tx.pcTakeoutApprovalStep.createMany({ data: steps.map(s => ({ ...s, request_id: id })) })
        await tx.pcTakeoutHistory.create({
          data: { request_id: id, action: wasReturned ? "再申請" : "申請", actor_id: viewer.userId, actor_name: info.name, comment: v.pledge ? `厳守事項（版${v.pledge.version}）に同意` : null },
        })
      }
    })
    if (submit && sendMail) await sendPcApprovalRequestMail(id)
    return NextResponse.json({ ok: true, status: submit ? nextStatus : current.status })
  } catch (e: any) {
    if (e?.message === STATE_CHANGED) return NextResponse.json({ error: STATE_CHANGED_MESSAGE }, { status: 409 })
    throw e
  }
}

// 削除：申請者本人が、下書きの申請だけ削除できる。一度でも申請した申請（履歴がある申請）は削除できない
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getPcViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const request = await prisma.pcTakeoutRequest.findFirst({
    where: { id, requester_id: viewer.userId },
    select: { status: true },
  })
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (request.status !== PC_STATUS_DRAFT) {
    return NextResponse.json({ error: "下書きの申請だけ削除できます" }, { status: 400 })
  }
  const deleted = await prisma.pcTakeoutRequest.deleteMany({
    where: { id, requester_id: viewer.userId, status: PC_STATUS_DRAFT, histories: { none: {} } },
  })
  if (deleted.count === 0) {
    return NextResponse.json({ error: "一度申請した申請は削除できません" }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
