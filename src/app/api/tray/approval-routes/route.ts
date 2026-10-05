import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requirePurchasingAccess } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"

const SERVICE_TYPE = "tray_irregular_order"

// 一覧：承認の順番で並べる（購買担当・システム管理者のみ）
export async function GET() {
  const denied = await requirePurchasingAccess()
  if (denied) return denied

  const routes = await prisma.mApprovalRoute.findMany({
    where: { service_type: SERVICE_TYPE },
    orderBy: { step_order: "asc" },
    include: { approver: { select: { id: true, name: true, email: true, inkanImageKey: true } } },
  })
  return NextResponse.json(
    routes.map(r => ({
      id: r.id,
      step_order: r.step_order,
      label: r.category,
      approver_user_id: r.approver_user_id,
      approver_name: r.approver?.name ?? null,
      has_inkan: !!r.approver?.inkanImageKey,
    }))
  )
}

// 追加
export async function POST(req: NextRequest) {
  const denied = await requirePurchasingAccess()
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { step_order, label, approver_user_id } = await req.json()
  if (!approver_user_id) return NextResponse.json({ error: "承認者を選択してください" }, { status: 400 })
  if (!label || !String(label).trim()) return NextResponse.json({ error: "押印欄の名称を入力してください" }, { status: 400 })
  const order = Number(step_order)
  if (!Number.isInteger(order) || order <= 0) return NextResponse.json({ error: "承認の順番は1以上の整数で指定してください" }, { status: 400 })

  const route = await prisma.mApprovalRoute.create({
    data: { service_type: SERVICE_TYPE, step_order: order, category: String(label).trim(), approver_user_id },
  })

  await createAuditLog({
    userId: user.id,
    service: "tray",
    action: "CREATE",
    targetModel: "MApprovalRoute",
    targetId: route.id,
    targetLabel: String(label).trim(),
    diff: { classification: "承認経路追加", changedFields: [{ field: "step_order", label: "承認の順番", before: "—", after: String(order) }] },
  })

  return NextResponse.json(route)
}
