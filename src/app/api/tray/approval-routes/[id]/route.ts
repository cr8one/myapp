import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requirePurchasingAccess } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"

const SERVICE_TYPE = "tray_irregular_order"

// 更新
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePurchasingAccess()
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const before = await prisma.mApprovalRoute.findUnique({ where: { id } })
  if (!before || before.service_type !== SERVICE_TYPE) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { step_order, label, approver_user_id } = await req.json()
  if (!approver_user_id) return NextResponse.json({ error: "承認者を選択してください" }, { status: 400 })
  if (!label || !String(label).trim()) return NextResponse.json({ error: "押印欄の名称を入力してください" }, { status: 400 })
  const order = Number(step_order)
  if (!Number.isInteger(order) || order <= 0) return NextResponse.json({ error: "承認の順番は1以上の整数で指定してください" }, { status: 400 })

  const route = await prisma.mApprovalRoute.update({
    where: { id },
    data: { step_order: order, category: String(label).trim(), approver_user_id },
  })

  await createAuditLog({
    userId: user.id,
    service: "tray",
    action: "UPDATE",
    targetModel: "MApprovalRoute",
    targetId: route.id,
    targetLabel: String(label).trim(),
    diff: {
      classification: "承認経路変更",
      changedFields: [
        { field: "step_order", label: "承認の順番", before: String(before.step_order), after: String(route.step_order) },
        { field: "label", label: "押印欄の名称", before: before.category ?? "—", after: route.category ?? "—" },
        { field: "approver_user_id", label: "承認者", before: before.approver_user_id ?? "—", after: route.approver_user_id ?? "—" },
      ],
    },
  })

  return NextResponse.json(route)
}

// 削除
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePurchasingAccess()
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const before = await prisma.mApprovalRoute.findUnique({ where: { id } })
  if (!before || before.service_type !== SERVICE_TYPE) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.mApprovalRoute.delete({ where: { id } })

  await createAuditLog({
    userId: user.id,
    service: "tray",
    action: "DELETE",
    targetModel: "MApprovalRoute",
    targetId: id,
    targetLabel: before.category ?? "",
    diff: { classification: "承認経路削除", changedFields: [{ field: "label", label: "押印欄の名称", before: before.category ?? "—", after: "—" }] },
  })

  return NextResponse.json({ ok: true })
}
