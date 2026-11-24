import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, getSessionUser } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("estimateEdit")
  if (denied) return denied
  const { id } = await params
  const before = await prisma.estCategory.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: "区分が見つかりません" }, { status: 404 })
  const b = await req.json().catch(() => null)
  const name = String(b?.name ?? "").trim()
  const code = String(b?.code ?? "").trim()
  if (!name) return NextResponse.json({ error: "区分名を入力してください" }, { status: 400 })
  if (!/^[0-9A-Za-z]{1,10}$/.test(code)) return NextResponse.json({ error: "番号の接頭辞は、英数字10文字までで入力してください" }, { status: 400 })
  const next = Number(b?.next_serial ?? before.next_serial)
  if (!Number.isInteger(next) || next < 1 || next > 99999999) return NextResponse.json({ error: "次の番号を、1以上の整数で入力してください" }, { status: 400 })
  const dup = await prisma.estCategory.findFirst({ where: { OR: [{ name }, { code }], NOT: { id } } })
  if (dup) return NextResponse.json({ error: "同じ区分名、または同じ接頭辞が、すでにあります" }, { status: 409 })
  // すでに見積書がある接頭辞は、変えられない（番号が変わってしまうため）
  if (code !== before.code && (await prisma.estimate.count({ where: { category_id: id } })) > 0) {
    return NextResponse.json({ error: "見積書がある区分の接頭辞は、変えられません" }, { status: 409 })
  }
  const stdId = b?.default_standard_id ? String(b.default_standard_id) : null
  if (stdId && !(await prisma.estStandard.findUnique({ where: { id: stdId } }))) {
    return NextResponse.json({ error: "既定の基準が見つかりません" }, { status: 400 })
  }
  const after = await prisma.estCategory.update({
    where: { id },
    data: {
      name,
      code,
      next_serial: next,
      default_standard_id: stdId,
      customer_name: b?.customer_name ? String(b.customer_name).trim() : null,
      remarks: b?.remarks ? String(b.remarks).trim() : null,
      is_active: typeof b?.is_active === "boolean" ? b.is_active : before.is_active,
    },
  })
  const user = await getSessionUser()
  const pick = (c: typeof before) => ({ name: c.name, code: c.code, next_serial: c.next_serial, default_standard_id: c.default_standard_id, customer_name: c.customer_name, is_active: c.is_active })
  await createAuditLog({ userId: user?.id, service: "estimate", action: "UPDATE", targetModel: "EstCategory", targetId: id, targetLabel: after.name, diff: { before: pick(before), after: pick(after) } })
  return NextResponse.json(after)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("estimateEdit")
  if (denied) return denied
  const { id } = await params
  const before = await prisma.estCategory.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: "区分が見つかりません" }, { status: 404 })
  if ((await prisma.estimate.count({ where: { category_id: id } })) > 0) {
    return NextResponse.json({ error: "見積書がある区分は、削除できません（無効にしてください）" }, { status: 409 })
  }
  await prisma.estCategory.delete({ where: { id } })
  const user = await getSessionUser()
  await createAuditLog({ userId: user?.id, service: "estimate", action: "DELETE", targetModel: "EstCategory", targetId: id, targetLabel: before.name, diff: { name: before.name, code: before.code } })
  return NextResponse.json({ ok: true })
}