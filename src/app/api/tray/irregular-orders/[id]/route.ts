import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requirePermission } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})
const BUCKET = "japan-sleeve-system-files-936533876784"

// 取得：発注書と明細（トレイ名つき）
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("trayView")
  if (denied) return denied
  const { id } = await params

  const order = await prisma.trayIrregularOrder.findUnique({
    where: { id },
    include: {
      items: { orderBy: [{ usage_month: "asc" }, { created_at: "asc" }] },
      steps: { orderBy: { step_order: "asc" } },
    },
  })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const me = await getSessionUser()

  const codes = Array.from(new Set(order.items.map(i => i.rendo_tray_cd)))
  const trays = await prisma.mTray.findMany({
    where: { rendo_tray_cd: { in: codes } },
    select: { rendo_tray_cd: true, name: true },
  })
  const nameByCode = new Map(trays.map(t => [t.rendo_tray_cd, t.name]))

  // 承認済みのステップだけ、承認者の印影を表示する
  const approvedIds = order.steps.filter(s => s.status === "承認済" && s.approver_user_id).map(s => s.approver_user_id as string)
  const approvers = approvedIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: approvedIds } }, select: { id: true, inkanImageKey: true } })
    : []
  const inkanUrlById: Record<string, string> = {}
  for (const u of approvers) {
    if (u.inkanImageKey) {
      inkanUrlById[u.id] = await getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: u.inkanImageKey }), { expiresIn: 300 })
    }
  }
  const steps = order.steps.map(s => ({
    ...s,
    inkan_image_url: s.status === "承認済" && s.approver_user_id ? inkanUrlById[s.approver_user_id] : undefined,
  }))

  // 申請者の印影：承認依頼後（承認依頼中・承認済）のみ表示する
  let requesterInkanUrl: string | undefined
  if (order.status !== "作成中" && order.requester_id) {
    const requester = await prisma.user.findUnique({ where: { id: order.requester_id }, select: { inkanImageKey: true } })
    if (requester?.inkanImageKey) {
      requesterInkanUrl = await getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: requester.inkanImageKey }), { expiresIn: 300 })
    }
  }

  // ログイン中のユーザーが、次の承認者か（システム管理者は常に承認できる）
  const nextStep = order.status === "承認依頼中" ? order.steps.find(s => s.status !== "承認済") : undefined
  const canApprove = !!me && !!nextStep && (me.role === "ADMIN" || nextStep.approver_user_id === me.id)

  return NextResponse.json({
    ...order,
    steps,
    canApprove,
    requester_inkan_url: requesterInkanUrl,
    items: order.items.map(i => ({ ...i, tray_name: nameByCode.get(i.rendo_tray_cd) ?? i.rendo_tray_cd })),
  })
}

// 更新：タイトル（作成中のみ）
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("trayEdit")
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const before = await prisma.trayIrregularOrder.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (before.status !== "作成中") {
    return NextResponse.json({ error: "作成中の発注書のみ編集できます" }, { status: 400 })
  }

  const { title } = await req.json()
  if (!title || !String(title).trim()) {
    return NextResponse.json({ error: "タイトルは必須です" }, { status: 400 })
  }

  const order = await prisma.trayIrregularOrder.update({ where: { id }, data: { title: String(title).trim() } })

  // 明細のタイトルも、発注書のタイトルに合わせる
  await prisma.trayUsagePlan.updateMany({ where: { irregular_order_id: id }, data: { item_name: order.title } })

  if (before.title !== order.title) {
    await createAuditLog({
      userId: user.id,
      service: "tray",
      action: "UPDATE",
      targetModel: "TrayIrregularOrder",
      targetId: order.id,
      targetLabel: order.order_no,
      diff: { classification: "編集", changedFields: [{ field: "title", label: "タイトル", before: before.title, after: order.title }] },
    })
  }

  return NextResponse.json(order)
}

// 削除：作成中のみ。明細も一緒に削除する
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("trayEdit")
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const before = await prisma.trayIrregularOrder.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (before.status === "承認済") {
    return NextResponse.json({ error: "承認済みの発注書は削除できません" }, { status: 400 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.trayUsagePlan.deleteMany({ where: { irregular_order_id: id } })
    await tx.trayIrregularOrder.delete({ where: { id } })
  })

  await createAuditLog({
    userId: user.id,
    service: "tray",
    action: "DELETE",
    targetModel: "TrayIrregularOrder",
    targetId: id,
    targetLabel: before.order_no,
    diff: { classification: "削除", changedFields: [{ field: "title", label: "タイトル", before: before.title, after: "—" }] },
  })

  return NextResponse.json({ ok: true })
}
