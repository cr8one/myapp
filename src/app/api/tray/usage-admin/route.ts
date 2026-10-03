import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requirePurchasingAccess } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"

// 一覧：提出月ごとの設定と、明細の状況
export async function GET() {
  const denied = await requirePurchasingAccess()
  if (denied) return denied

  const settings = await prisma.trayUsageSetting.findMany({ orderBy: { submission_month: "desc" } })
  const result = await Promise.all(
    settings.map(async s => {
      const where = { submission_month: s.submission_month }
      const [total, unapproved, tempLocked, locked] = await Promise.all([
        prisma.trayUsagePlan.count({ where }),
        prisma.trayUsagePlan.count({ where: { ...where, approved_flg: false } }),
        prisma.trayUsagePlan.count({ where: { ...where, temp_lock_flg: true } }),
        prisma.trayUsagePlan.count({ where: { ...where, lock_flg: true } }),
      ])
      return {
        submission_month: s.submission_month,
        deadline: s.deadline,
        lock_a_flg: s.lock_a_flg,
        counts: { total, unapproved, tempLocked, locked },
      }
    })
  )
  return NextResponse.json(result)
}

// 提出月の作成
export async function POST(req: NextRequest) {
  const denied = await requirePurchasingAccess()
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { submission_month, deadline } = await req.json()
  if (!/^\d{6}$/.test(submission_month ?? "")) {
    return NextResponse.json({ error: "提出月は6桁（例：202610）で指定してください" }, { status: 400 })
  }
  const exists = await prisma.trayUsageSetting.findUnique({ where: { submission_month } })
  if (exists) return NextResponse.json({ error: "この提出月はすでに作成されています" }, { status: 400 })

  const record = await prisma.trayUsageSetting.create({
    data: { submission_month, deadline: deadline ? new Date(deadline) : null },
  })

  await createAuditLog({
    userId: user.id,
    service: "tray",
    action: "CREATE",
    targetModel: "TrayUsageSetting",
    targetId: record.id,
    targetLabel: submission_month,
    diff: { classification: "提出月作成", changedFields: [{ field: "submission_month", label: "提出月", before: "—", after: submission_month }] },
  })

  return NextResponse.json(record)
}

// 締め切り日・ロックAの変更
export async function PUT(req: NextRequest) {
  const denied = await requirePurchasingAccess()
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { submission_month, deadline, lock_a_flg } = await req.json()
  const before = await prisma.trayUsageSetting.findUnique({ where: { submission_month } })
  if (!before) return NextResponse.json({ error: "提出月が見つかりません" }, { status: 404 })

  const data: { deadline?: Date | null; lock_a_flg?: boolean } = {}
  if (deadline !== undefined) data.deadline = deadline ? new Date(deadline) : null
  if (lock_a_flg !== undefined) data.lock_a_flg = !!lock_a_flg

  const record = await prisma.trayUsageSetting.update({ where: { submission_month }, data })

  const changedFields: { field: string; label: string; before: string; after: string }[] = []
  if (data.lock_a_flg !== undefined && before.lock_a_flg !== record.lock_a_flg) {
    changedFields.push({ field: "lock_a_flg", label: "ロックA（新規登録の停止）", before: before.lock_a_flg ? "かかっている" : "解除", after: record.lock_a_flg ? "かかっている" : "解除" })
  }
  if (data.deadline !== undefined && (before.deadline?.getTime() ?? null) !== (record.deadline?.getTime() ?? null)) {
    changedFields.push({ field: "deadline", label: "締め切り日", before: before.deadline ? before.deadline.toISOString().slice(0, 10) : "—", after: record.deadline ? record.deadline.toISOString().slice(0, 10) : "—" })
  }
  if (changedFields.length > 0) {
    await createAuditLog({
      userId: user.id,
      service: "tray",
      action: "UPDATE",
      targetModel: "TrayUsageSetting",
      targetId: record.id,
      targetLabel: submission_month,
      diff: { classification: "提出月設定の変更", changedFields },
    })
  }

  return NextResponse.json(record)
}
