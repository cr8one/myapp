import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requirePurchasingAccess } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"

// 仮ロック（ロックB）をかける：未承認の明細が1件でもあればかけられない
export async function POST(req: NextRequest) {
  const denied = await requirePurchasingAccess()
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { submission_month } = await req.json()
  if (!/^\d{6}$/.test(submission_month ?? "")) {
    return NextResponse.json({ error: "提出月を指定してください" }, { status: 400 })
  }

  const unapproved = await prisma.trayUsagePlan.count({ where: { submission_month, approved_flg: false } })
  if (unapproved > 0) {
    return NextResponse.json({ error: `${unapproved}件、未承認のため、ロックがかけられません。` }, { status: 400 })
  }

  const result = await prisma.trayUsagePlan.updateMany({
    where: { submission_month, temp_lock_flg: false },
    data: { temp_lock_flg: true },
  })
  if (result.count === 0) {
    return NextResponse.json({ error: "ロックをかける明細がありません。" }, { status: 400 })
  }

  await createAuditLog({
    userId: user.id,
    service: "tray",
    action: "UPDATE",
    targetModel: "TrayUsagePlan",
    targetId: submission_month,
    targetLabel: submission_month,
    diff: { classification: "仮ロック", changedFields: [{ field: "temp_lock_flg", label: "仮ロック", before: "—", after: `${result.count}件` }] },
  })

  return NextResponse.json({ ok: true, count: result.count })
}

// 仮ロックを外す：本ロックがかかった明細は対象外
export async function DELETE(req: NextRequest) {
  const denied = await requirePurchasingAccess()
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { submission_month } = await req.json()
  if (!/^\d{6}$/.test(submission_month ?? "")) {
    return NextResponse.json({ error: "提出月を指定してください" }, { status: 400 })
  }

  const result = await prisma.trayUsagePlan.updateMany({
    where: { submission_month, temp_lock_flg: true, lock_flg: false },
    data: { temp_lock_flg: false },
  })

  await createAuditLog({
    userId: user.id,
    service: "tray",
    action: "UPDATE",
    targetModel: "TrayUsagePlan",
    targetId: submission_month,
    targetLabel: submission_month,
    diff: { classification: "仮ロック解除", changedFields: [{ field: "temp_lock_flg", label: "仮ロック", before: `${result.count}件`, after: "解除" }] },
  })

  return NextResponse.json({ ok: true, count: result.count })
}
