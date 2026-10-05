import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requirePermission } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"

const SERVICE_TYPE = "tray_irregular_order"

// 承認依頼：承認ステップを作成し、状態を「承認依頼中」にする（ステップがなければそのまま「承認済」）
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("trayEdit")
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const order = await prisma.trayIrregularOrder.findUnique({ where: { id }, include: { items: { select: { id: true } } } })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (order.status !== "作成中") return NextResponse.json({ error: "作成中の発注書のみ承認依頼できます" }, { status: 400 })
  if (order.items.length === 0) return NextResponse.json({ error: "明細がありません" }, { status: 400 })

  // 申請者側：申請者に設定された承認者（特定のユーザー指定のもの）
  const applicantSteps = order.requester_id
    ? await prisma.userApproverSetting.findMany({
        where: { user_id: order.requester_id, service_type: SERVICE_TYPE, approver_user_id: { not: null } },
        orderBy: { step_order: "asc" },
        include: { approver: { select: { id: true, name: true, email: true } } },
      })
    : []
  // 購買側：承認経路マスタ
  const purchasingRoutes = await prisma.mApprovalRoute.findMany({
    where: { service_type: SERVICE_TYPE, approver_user_id: { not: null } },
    orderBy: { step_order: "asc" },
    include: { approver: { select: { id: true, name: true, email: true } } },
  })

  // 承認ステップは承認依頼の時点の内容を保存する（スナップショット）
  const steps = [
    ...applicantSteps.map(s => ({
      stage: "申請者側", label: "承認者",
      approver_user_id: s.approver?.id ?? null, approver_name: s.approver?.name ?? null, approver_email: s.approver?.email ?? null,
    })),
    ...purchasingRoutes.map(r => ({
      stage: "購買側", label: r.category ?? "",
      approver_user_id: r.approver?.id ?? null, approver_name: r.approver?.name ?? null, approver_email: r.approver?.email ?? null,
    })),
  ].map((s, idx) => ({ ...s, order_id: id, step_order: idx + 1 }))

  const nextStatus = steps.length === 0 ? "承認済" : "承認依頼中"

  await prisma.$transaction(async (tx) => {
    if (steps.length > 0) await tx.trayIrregularOrderStep.createMany({ data: steps })
    await tx.trayIrregularOrder.update({ where: { id }, data: { status: nextStatus } })
    if (nextStatus === "承認済") await tx.trayUsagePlan.updateMany({ where: { irregular_order_id: id }, data: { approved_flg: true } })
  })

  await createAuditLog({
    userId: user.id,
    service: "tray",
    action: "UPDATE",
    targetModel: "TrayIrregularOrder",
    targetId: id,
    targetLabel: order.order_no,
    diff: { classification: "承認依頼", changedFields: [{ field: "status", label: "ステータス", before: "作成中", after: nextStatus }] },
  })

  return NextResponse.json({ ok: true, status: nextStatus, steps: steps.length })
}
