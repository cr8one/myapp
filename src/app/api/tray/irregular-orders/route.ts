import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requirePermission } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"

// 一覧
export async function GET() {
  const denied = await requirePermission("trayView")
  if (denied) return denied

  const orders = await prisma.trayIrregularOrder.findMany({
    orderBy: { order_no: "desc" },
    select: { id: true, order_no: true, status: true, request_date: true, title: true, requester_name: true },
  })
  return NextResponse.json(orders)
}

// 新規作成
export async function POST(req: NextRequest) {
  const denied = await requirePermission("trayEdit")
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title } = await req.json()
  if (!title || !String(title).trim()) {
    return NextResponse.json({ error: "タイトルは必須です" }, { status: 400 })
  }

  // 管理No.：数値としての最大値 + 1 を5桁に整える
  const maxResult = await prisma.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(order_no AS INTEGER)) as max FROM t_tray_irregular_orders WHERE order_no ~ '^[0-9]+$'
  `
  const nextNo = String((maxResult[0]?.max ?? 0) + 1).padStart(5, "0")

  const order = await prisma.trayIrregularOrder.create({
    data: {
      order_no: nextNo,
      request_date: new Date(),
      title: String(title).trim(),
      requester_id: user.id,
      requester_name: user.name ?? "",
    },
  })

  await createAuditLog({
    userId: user.id,
    service: "tray",
    action: "CREATE",
    targetModel: "TrayIrregularOrder",
    targetId: order.id,
    targetLabel: order.order_no,
    diff: { classification: "作成", changedFields: [{ field: "title", label: "タイトル", before: "—", after: order.title }] },
  })

  return NextResponse.json(order)
}
