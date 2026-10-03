import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requirePurchasingAccess } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"

function addMonths(ym: string, n: number): string {
  const y = Number(ym.slice(0, 4))
  const m = Number(ym.slice(4, 6)) - 1 + n
  const yy = y + Math.floor(m / 12)
  const mm = ((m % 12) + 12) % 12 + 1
  return `${yy}${String(mm).padStart(2, "0")}`
}

// 締め作業：本ロック → 新しい提出月の作成 → 翌々月以降の明細の複製
export async function POST(req: NextRequest) {
  const denied = await requirePurchasingAccess()
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { submission_month } = await req.json()
  if (!/^\d{6}$/.test(submission_month ?? "")) {
    return NextResponse.json({ error: "提出月を指定してください" }, { status: 400 })
  }

  const setting = await prisma.trayUsageSetting.findUnique({ where: { submission_month } })
  if (!setting) return NextResponse.json({ error: "提出月が見つかりません" }, { status: 404 })

  // 締め切り日の確認（未設定、または今日以降なら実行できない）
  if (!setting.deadline) {
    return NextResponse.json({ error: "締め切り日が設定されていません" }, { status: 400 })
  }
  const todayJst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
  if (setting.deadline.toISOString().slice(0, 10) >= todayJst) {
    return NextResponse.json({ error: "締め切り日を過ぎてから実行してください" }, { status: 400 })
  }

  const newMonth = addMonths(submission_month, 1)
  const exists = await prisma.trayUsageSetting.findUnique({ where: { submission_month: newMonth } })
  if (exists) {
    return NextResponse.json({ error: `${newMonth} はすでに作成されているため、締め作業はできません` }, { status: 400 })
  }

  const targets = await prisma.trayUsagePlan.findMany({
    where: { submission_month, lock_flg: false },
  })
  if (targets.length === 0) {
    return NextResponse.json({ error: "対象の明細がありません" }, { status: 400 })
  }

  // 複製の対象：使用年月が、新しい提出月の翌月以降のもの
  const firstUsageOfNew = addMonths(newMonth, 1)
  const toCopy = await prisma.trayUsagePlan.findMany({
    where: { submission_month, usage_month: { gte: firstUsageOfNew } },
  })

  await prisma.$transaction([
    prisma.trayUsagePlan.updateMany({
      where: { submission_month, lock_flg: false },
      data: { lock_flg: true },
    }),
    prisma.trayUsageSetting.create({ data: { submission_month: newMonth } }),
    prisma.trayUsagePlan.createMany({
      data: toCopy.map(p => ({
        submission_month: newMonth,
        usage_month: p.usage_month,
        rendo_tray_cd: p.rendo_tray_cd,
        usage_dept: p.usage_dept,
        usage_person_id: p.usage_person_id,
        usage_person_name: p.usage_person_name,
        planned_qty: p.planned_qty,
        item_name: p.item_name,
        approved_flg: p.approved_flg,
        irregular_order_flg: p.irregular_order_flg,
      })),
    }),
  ])

  await createAuditLog({
    userId: user.id,
    service: "tray",
    action: "UPDATE",
    targetModel: "TrayUsagePlan",
    targetId: submission_month,
    targetLabel: submission_month,
    diff: {
      classification: "締め作業",
      changedFields: [
        { field: "lock_flg", label: "本ロック", before: "—", after: `${targets.length}件` },
        { field: "submission_month", label: "新しい提出月", before: "—", after: newMonth },
        { field: "copy", label: "複製", before: "—", after: `${toCopy.length}件` },
      ],
    },
  })

  return NextResponse.json({ ok: true, locked: targets.length, copied: toCopy.length, newMonth })
}
