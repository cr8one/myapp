import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requirePermission } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"

// 承認：順番どおりに、次のステップの承認者が承認する
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("trayView")
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const order = await prisma.trayIrregularOrder.findUnique({
    where: { id },
    include: { steps: { orderBy: { step_order: "asc" } } },
  })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (order.status !== "承認依頼中") return NextResponse.json({ error: "承認依頼中の発注書ではありません" }, { status: 400 })

  const next = order.steps.find(s => s.status !== "承認済")
  if (!next) return NextResponse.json({ error: "承認待ちのステップがありません" }, { status: 400 })

  const isAdmin = user.role === "ADMIN"
  if (!isAdmin && next.approver_user_id !== user.id) {
    return NextResponse.json({ error: "あなたの承認順ではありません" }, { status: 403 })
  }

  const isLast = order.steps.filter(s => s.status !== "承認済").length === 1

  await prisma.$transaction(async (tx) => {
    await tx.trayIrregularOrderStep.update({ where: { id: next.id }, data: { status: "承認済", approved_at: new Date() } })
    if (isLast) {
      await tx.trayIrregularOrder.update({ where: { id }, data: { status: "承認済" } })
      await tx.trayUsagePlan.updateMany({ where: { irregular_order_id: id }, data: { approved_flg: true } })
    }
  })

  await createAuditLog({
    userId: user.id,
    service: "tray",
    action: "UPDATE",
    targetModel: "TrayIrregularOrder",
    targetId: id,
    targetLabel: order.order_no,
    diff: {
      classification: "承認",
      changedFields: [{ field: "step", label: `承認（${next.label || next.stage}）`, before: "未承認", after: isLast ? "承認済（全員承認）" : "承認済" }],
    },
  })

  return NextResponse.json({ ok: true, completed: isLast })
}
