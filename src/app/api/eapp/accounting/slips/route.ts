import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAccountingViewer, slipVisibilityWhere } from "@/lib/accounting-slip-access"
import { STATUS_REQUESTER_APPROVING, STATUS_ACCOUNTING_APPROVING } from "@/lib/accounting-slip-approval"

const PAGE_SIZE = 50

export async function GET(req: NextRequest) {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sp = new URL(req.url).searchParams
  const page = Math.max(1, parseInt(sp.get("page") ?? "1") || 1)

  // 画面からの絞り込み条件。見える範囲の判定（slipVisibilityWhere）に重ねるだけで、広げることはできない
  const filter: Record<string, any> = {}
  if (sp.get("slip_type")) filter.slip_type = sp.get("slip_type")!
  if (sp.get("status")) filter.status = sp.get("status")!
  if (sp.get("mine") === "1") filter.requester_id = viewer.userId
  // 自分の承認待ち：自分のステップが未承認で、伝票が承認中で、前の順序がすべて承認済み（今、自分の番）
  if (sp.get("waiting") === "1") {
    const rows = await prisma.$queryRaw<{ slip_id: string }[]>`
      SELECT DISTINCT s.slip_id
      FROM t_acct_slip_approval_steps s
      JOIN t_acct_slips a ON a.id = s.slip_id
      WHERE s.approver_id = ${viewer.userId}
        AND s.status = '未承認'
        AND a.status IN (${STATUS_REQUESTER_APPROVING}, ${STATUS_ACCOUNTING_APPROVING})
        AND NOT EXISTS (
          SELECT 1 FROM t_acct_slip_approval_steps p
          WHERE p.slip_id = s.slip_id AND p.step_order < s.step_order AND p.status <> '承認済み'
        )
    `
    filter.id = { in: rows.map(r => r.slip_id) }
  }
  const keyword = sp.get("keyword")
  if (keyword) {
    filter.OR = [
      { title: { contains: keyword } },
      { requester_name: { contains: keyword } },
    ]
  }
  const dateFrom = sp.get("date_from")
  const dateTo = sp.get("date_to")
  if (dateFrom || dateTo) {
    filter.slip_date = {
      ...(dateFrom ? { gte: new Date(`${dateFrom}T00:00:00.000Z`) } : {}),
      ...(dateTo ? { lte: new Date(`${dateTo}T00:00:00.000Z`) } : {}),
    }
  }

  const where = { AND: [slipVisibilityWhere(viewer), filter] }

  const [total, records] = await Promise.all([
    prisma.acctSlip.count({ where }),
    prisma.acctSlip.findMany({
      where,
      orderBy: { slip_no: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
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
        department_name: true,
        submitted_at: true,
        completed_at: true,
        created_at: true,
        approval_steps: {
          orderBy: { step_order: "asc" },
          select: { stage: true, step_order: true, position_name: true, approver_name: true, status: true },
        },
      },
    }),
  ])
  return NextResponse.json({ records, total, page_size: PAGE_SIZE })
}
