import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requirePermission } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"

// ログイン中のユーザーが承認者になっている「申請者」のID一覧
async function myApplicantIds(approverId: string): Promise<string[]> {
  const settings = await prisma.userApproverSetting.findMany({
    where: { service_type: "tray_usage_plan", approver_user_id: approverId },
    select: { user_id: true },
  })
  return Array.from(new Set(settings.map(s => s.user_id)))
}

// 承認待ちの明細の一覧
export async function GET(req: NextRequest) {
  const denied = await requirePermission("trayView")
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const submissionMonth = searchParams.get("submission_month")

  const applicantIds = await myApplicantIds(user.id)
  if (applicantIds.length === 0) return NextResponse.json([])

  const records = await prisma.trayUsagePlan.findMany({
    where: {
      approved_flg: false,
      usage_person_id: { in: applicantIds },
      ...(submissionMonth ? { submission_month: submissionMonth } : {}),
    },
    orderBy: [{ submission_month: "desc" }, { usage_person_name: "asc" }, { usage_month: "asc" }],
  })

  // トレイ名を付ける（連動コードからトレイマスタを引く）
  const codes = Array.from(new Set(records.map(r => r.rendo_tray_cd)))
  const trays = await prisma.mTray.findMany({
    where: { rendo_tray_cd: { in: codes } },
    select: { rendo_tray_cd: true, name: true },
  })
  const nameByCode = new Map(trays.map(t => [t.rendo_tray_cd, t.name]))

  return NextResponse.json(records.map(r => ({ ...r, tray_name: nameByCode.get(r.rendo_tray_cd) ?? r.rendo_tray_cd })))
}

// 承認する
export async function POST(req: NextRequest) {
  const denied = await requirePermission("trayView")
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { ids } = await req.json() as { ids: string[] }
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "承認する明細を選択してください" }, { status: 400 })
  }

  const applicantIds = new Set(await myApplicantIds(user.id))
  const isAdmin = user.role === "ADMIN"

  const targets = await prisma.trayUsagePlan.findMany({ where: { id: { in: ids }, approved_flg: false } })
  const allowed = targets.filter(t => !t.lock_flg && !t.temp_lock_flg && (isAdmin || (t.usage_person_id && applicantIds.has(t.usage_person_id))))
  if (allowed.length === 0) {
    return NextResponse.json({ error: "承認できる明細がありません" }, { status: 400 })
  }

  await prisma.trayUsagePlan.updateMany({
    where: { id: { in: allowed.map(a => a.id) } },
    data: { approved_flg: true },
  })

  await createAuditLog({
    userId: user.id,
    service: "tray",
    action: "UPDATE",
    targetModel: "TrayUsagePlan",
    targetId: allowed.map(a => a.id).join(","),
    targetLabel: "承認",
    diff: { classification: "承認", changedFields: [{ field: "approved_flg", label: "承認", before: "未承認", after: `${allowed.length}件 承認` }] },
  })

  return NextResponse.json({ ok: true, count: allowed.length, skipped: ids.length - allowed.length })
}
