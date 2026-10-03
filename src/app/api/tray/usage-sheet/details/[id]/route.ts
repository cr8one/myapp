import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requirePermission } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"

function addMonths(ym: string, n: number): string {
  const y = Number(ym.slice(0, 4))
  const m = Number(ym.slice(4, 6)) - 1 + n
  const yy = y + Math.floor(m / 12)
  const mm = ((m % 12) + 12) % 12 + 1
  return `${yy}${String(mm).padStart(2, "0")}`
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("trayEdit")
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const before = await prisma.trayUsagePlan.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (before.lock_flg || before.temp_lock_flg) {
    return NextResponse.json({ error: "ロックされているため編集できません" }, { status: 400 })
  }

  const { usage_month, planned_qty, item_name } = await req.json()
  if (!/^\d{6}$/.test(usage_month ?? "")) {
    return NextResponse.json({ error: "使用年月を正しく入力してください" }, { status: 400 })
  }
  if (usage_month < addMonths(before.submission_month, 1)) {
    return NextResponse.json({ error: "使用年月は、提出月の翌月以降を指定してください" }, { status: 400 })
  }
  const qty = Number(planned_qty)
  if (!Number.isInteger(qty) || qty < 0) {
    return NextResponse.json({ error: "数量は0以上の整数で入力してください" }, { status: 400 })
  }

  const record = await prisma.trayUsagePlan.update({
    where: { id },
    data: { usage_month, planned_qty: qty, item_name: item_name || null },
  })

  const changedFields: { field: string; label: string; before: string; after: string }[] = []
  if (before.usage_month !== record.usage_month) changedFields.push({ field: "usage_month", label: "使用年月", before: before.usage_month, after: record.usage_month })
  if (before.planned_qty !== record.planned_qty) changedFields.push({ field: "planned_qty", label: "数量", before: String(before.planned_qty), after: String(record.planned_qty) })
  if ((before.item_name ?? "") !== (record.item_name ?? "")) changedFields.push({ field: "item_name", label: "タイトル", before: before.item_name ?? "—", after: record.item_name ?? "—" })
  if (changedFields.length > 0) {
    await createAuditLog({
      userId: user.id,
      service: "tray",
      action: "UPDATE",
      targetModel: "TrayUsagePlan",
      targetId: record.id,
      targetLabel: `${record.submission_month} ${record.rendo_tray_cd}`,
      diff: { classification: "編集", changedFields },
    })
  }

  return NextResponse.json(record)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("trayEdit")
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const before = await prisma.trayUsagePlan.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (before.lock_flg || before.temp_lock_flg) {
    return NextResponse.json({ error: "ロックされているため削除できません" }, { status: 400 })
  }

  await prisma.trayUsagePlan.delete({ where: { id } })

  await createAuditLog({
    userId: user.id,
    service: "tray",
    action: "DELETE",
    targetModel: "TrayUsagePlan",
    targetId: id,
    targetLabel: `${before.submission_month} ${before.rendo_tray_cd}`,
    diff: { classification: "削除", changedFields: [{ field: "planned_qty", label: "数量", before: String(before.planned_qty), after: "—" }] },
  })

  return NextResponse.json({ ok: true })
}
