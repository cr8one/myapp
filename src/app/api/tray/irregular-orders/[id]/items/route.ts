import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requirePermission } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"

function monthOf(d: Date): string {
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  return `${jst.getUTCFullYear()}${String(jst.getUTCMonth() + 1).padStart(2, "0")}`
}

// 明細の追加
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("trayEdit")
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const order = await prisma.trayIrregularOrder.findUnique({ where: { id } })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (order.status !== "作成中") {
    return NextResponse.json({ error: "作成中の発注書のみ明細を追加できます" }, { status: 400 })
  }

  const { usage_month, rendo_tray_cd, planned_qty } = await req.json()
  if (!/^\d{6}$/.test(usage_month ?? "") || !rendo_tray_cd) {
    return NextResponse.json({ error: "使用年月とトレイは必須です" }, { status: 400 })
  }
  const qty = Number(planned_qty)
  if (!Number.isInteger(qty) || qty <= 0) {
    return NextResponse.json({ error: "数量は1以上の整数で入力してください" }, { status: 400 })
  }

  // 使用予定部署・グループ：発注書の申請者のメイン部署とメイングループ
  const owner = order.requester_id
    ? await prisma.user.findUnique({
        where: { id: order.requester_id },
        select: {
          departments: { select: { is_primary: true, department: { select: { name: true } } } },
          groups: { select: { is_primary: true, group: { select: { name: true, department: { select: { name: true } } } } } },
        },
      })
    : null
  const mainDept = owner?.departments.find(d => d.is_primary)
  const mainGroup = owner?.groups.find(g => g.is_primary)

  const item = await prisma.trayUsagePlan.create({
    data: {
      submission_month: monthOf(order.request_date),
      usage_month,
      rendo_tray_cd,
      usage_dept: mainDept ? mainDept.department.name : mainGroup ? mainGroup.group.department.name : null,
      usage_group: mainGroup ? mainGroup.group.name : null,
      usage_person_id: order.requester_id,
      usage_person_name: order.requester_name,
      planned_qty: qty,
      item_name: order.title,
      irregular_order_flg: true,
      irregular_order_id: order.id,
    },
  })

  await createAuditLog({
    userId: user.id,
    service: "tray",
    action: "UPDATE",
    targetModel: "TrayIrregularOrder",
    targetId: order.id,
    targetLabel: order.order_no,
    diff: { classification: "明細追加", changedFields: [{ field: "item", label: "明細", before: "—", after: `${usage_month} ${rendo_tray_cd} ${qty}` }] },
  })

  return NextResponse.json(item)
}
