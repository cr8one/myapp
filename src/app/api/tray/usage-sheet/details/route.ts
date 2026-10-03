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

// 取得：提出月・トレイごとの明細
export async function GET(req: NextRequest) {
  const denied = await requirePermission("trayView")
  if (denied) return denied

  const { searchParams } = new URL(req.url)
  const submissionMonth = searchParams.get("submission_month") ?? ""
  const rendoTrayCd = searchParams.get("rendo_tray_cd") ?? ""
  if (!/^\d{6}$/.test(submissionMonth) || !rendoTrayCd) {
    return NextResponse.json({ error: "submission_month と rendo_tray_cd は必須です" }, { status: 400 })
  }

  const setting = await prisma.trayUsageSetting.findUnique({ where: { submission_month: submissionMonth } })
  const m1 = addMonths(submissionMonth, 1)
  const records = await prisma.trayUsagePlan.findMany({
    where: { submission_month: submissionMonth, rendo_tray_cd: rendoTrayCd, usage_month: { gte: m1 } },
    orderBy: [{ usage_month: "asc" }, { created_at: "asc" }],
  })

  return NextResponse.json({
    records,
    canCreate: !!setting && !setting.lock_a_flg,
    firstUsageMonth: m1,
  })
}

// 登録
export async function POST(req: NextRequest) {
  const denied = await requirePermission("trayEdit")
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { submission_month, usage_month, rendo_tray_cd, planned_qty, item_name } = body
  if (!/^\d{6}$/.test(submission_month ?? "") || !/^\d{6}$/.test(usage_month ?? "") || !rendo_tray_cd) {
    return NextResponse.json({ error: "提出月・使用年月・トレイは必須です" }, { status: 400 })
  }
  const qty = Number(planned_qty)
  if (!Number.isInteger(qty) || qty < 0) {
    return NextResponse.json({ error: "数量は0以上の整数で入力してください" }, { status: 400 })
  }

  const setting = await prisma.trayUsageSetting.findUnique({ where: { submission_month } })
  if (!setting) return NextResponse.json({ error: "この提出月はまだ準備中です" }, { status: 400 })
  if (setting.lock_a_flg) return NextResponse.json({ error: "新規登録は締め切られています" }, { status: 400 })
  if (usage_month < addMonths(submission_month, 1)) {
    return NextResponse.json({ error: "使用年月は、提出月の翌月以降を指定してください" }, { status: 400 })
  }

  // 承認者の設定がない人は承認不要：登録と同時に承認済みにする
  const approverCount = await prisma.userApproverSetting.count({
    where: { user_id: user.id, service_type: "tray_usage_plan" },
  })

  const record = await prisma.trayUsagePlan.create({
    data: {
      submission_month,
      usage_month,
      rendo_tray_cd,
      usage_person_id: user.id,
      usage_person_name: user.name ?? null,
      planned_qty: qty,
      item_name: item_name || null,
      approved_flg: approverCount === 0,
    },
  })

  await createAuditLog({
    userId: user.id,
    service: "tray",
    action: "CREATE",
    targetModel: "TrayUsagePlan",
    targetId: record.id,
    targetLabel: `${submission_month} ${rendo_tray_cd}`,
    diff: { classification: "登録", changedFields: [{ field: "planned_qty", label: "数量", before: "—", after: String(qty) }] },
  })

  return NextResponse.json(record)
}
