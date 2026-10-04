import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requirePermission } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"

async function loadTarget(id: string, itemId: string) {
  const order = await prisma.trayIrregularOrder.findUnique({ where: { id } })
  const item = await prisma.trayUsagePlan.findUnique({ where: { id: itemId } })
  if (!order || !item || item.irregular_order_id !== order.id) return null
  return { order, item }
}

// 明細の編集
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const denied = await requirePermission("trayEdit")
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, itemId } = await params

  const target = await loadTarget(id, itemId)
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (target.order.status !== "作成中") {
    return NextResponse.json({ error: "作成中の発注書のみ明細を編集できます" }, { status: 400 })
  }

  const { usage_month, rendo_tray_cd, planned_qty } = await req.json()
  if (!/^\d{6}$/.test(usage_month ?? "") || !rendo_tray_cd) {
    return NextResponse.json({ error: "使用年月とトレイは必須です" }, { status: 400 })
  }
  const qty = Number(planned_qty)
  if (!Number.isInteger(qty) || qty <= 0) {
    return NextResponse.json({ error: "数量は1以上の整数で入力してください" }, { status: 400 })
  }

  const item = await prisma.trayUsagePlan.update({
    where: { id: itemId },
    data: { usage_month, rendo_tray_cd, planned_qty: qty },
  })

  await createAuditLog({
    userId: user.id,
    service: "tray",
    action: "UPDATE",
    targetModel: "TrayIrregularOrder",
    targetId: target.order.id,
    targetLabel: target.order.order_no,
    diff: {
      classification: "明細編集",
      changedFields: [{
        field: "item", label: "明細",
        before: `${target.item.usage_month} ${target.item.rendo_tray_cd} ${target.item.planned_qty}`,
        after: `${item.usage_month} ${item.rendo_tray_cd} ${item.planned_qty}`,
      }],
    },
  })

  return NextResponse.json(item)
}

// 明細の削除
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const denied = await requirePermission("trayEdit")
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, itemId } = await params

  const target = await loadTarget(id, itemId)
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (target.order.status !== "作成中") {
    return NextResponse.json({ error: "作成中の発注書のみ明細を削除できます" }, { status: 400 })
  }

  await prisma.trayUsagePlan.delete({ where: { id: itemId } })

  await createAuditLog({
    userId: user.id,
    service: "tray",
    action: "UPDATE",
    targetModel: "TrayIrregularOrder",
    targetId: target.order.id,
    targetLabel: target.order.order_no,
    diff: {
      classification: "明細削除",
      changedFields: [{
        field: "item", label: "明細",
        before: `${target.item.usage_month} ${target.item.rendo_tray_cd} ${target.item.planned_qty}`,
        after: "—",
      }],
    },
  })

  return NextResponse.json({ ok: true })
}
