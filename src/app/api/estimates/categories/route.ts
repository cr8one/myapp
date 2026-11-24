import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, getSessionUser } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"

// 見積区分（客先・部署）の一覧
export async function GET() {
  const denied = await requirePermission("estimateView")
  if (denied) return denied
  const rows = await prisma.estCategory.findMany({
    include: {
      default_standard: { select: { id: true, name: true } },
      _count: { select: { estimates: true } },
    },
    orderBy: [{ is_active: "desc" }, { sort_order: "asc" }, { name: "asc" }],
  })
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const denied = await requirePermission("estimateEdit")
  if (denied) return denied
  const b = await req.json().catch(() => null)
  const name = String(b?.name ?? "").trim()
  const code = String(b?.code ?? "").trim()
  if (!name) return NextResponse.json({ error: "区分名を入力してください" }, { status: 400 })
  if (!/^[0-9A-Za-z]{1,10}$/.test(code)) return NextResponse.json({ error: "番号の接頭辞は、英数字10文字までで入力してください" }, { status: 400 })
  const next = Number(b?.next_serial ?? 1)
  if (!Number.isInteger(next) || next < 1 || next > 99999999) return NextResponse.json({ error: "次の番号を、1以上の整数で入力してください" }, { status: 400 })
  const dup = await prisma.estCategory.findFirst({ where: { OR: [{ name }, { code }] } })
  if (dup) return NextResponse.json({ error: "同じ区分名、または同じ接頭辞が、すでにあります" }, { status: 409 })
  const stdId = b?.default_standard_id ? String(b.default_standard_id) : null
  if (stdId && !(await prisma.estStandard.findUnique({ where: { id: stdId } }))) {
    return NextResponse.json({ error: "既定の基準が見つかりません" }, { status: 400 })
  }
  const created = await prisma.estCategory.create({
    data: {
      name,
      code,
      next_serial: next,
      default_standard_id: stdId,
      customer_name: b?.customer_name ? String(b.customer_name).trim() : null,
      remarks: b?.remarks ? String(b.remarks).trim() : null,
    },
  })
  const user = await getSessionUser()
  await createAuditLog({ userId: user?.id, service: "estimate", action: "CREATE", targetModel: "EstCategory", targetId: created.id, targetLabel: created.name, diff: { name, code, next_serial: next } })
  return NextResponse.json(created)
}