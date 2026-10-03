import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/permissions"

const KNOWN_TYPES = ["CD", "DVD", "BD"]

function addMonths(ym: string, n: number): string {
  const y = Number(ym.slice(0, 4))
  const m = Number(ym.slice(4, 6)) - 1 + n
  const yy = y + Math.floor(m / 12)
  const mm = ((m % 12) + 12) % 12 + 1
  return `${yy}${String(mm).padStart(2, "0")}`
}

export async function GET(req: NextRequest) {
  const denied = await requirePermission("trayView")
  if (denied) return denied

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") ?? ""
  const dept = searchParams.get("dept") ?? ""
  const personId = searchParams.get("person_id") ?? ""

  // 提出月：指定がなければ、設定のある最新の提出月
  let submissionMonth = searchParams.get("submission_month") ?? ""
  if (!submissionMonth) {
    const latest = await prisma.trayUsageSetting.findFirst({ orderBy: { submission_month: "desc" } })
    submissionMonth = latest?.submission_month ?? ""
  }
  if (!/^\d{6}$/.test(submissionMonth)) {
    return NextResponse.json({ setting: null, months: [], rows: [] })
  }

  const setting = await prisma.trayUsageSetting.findUnique({ where: { submission_month: submissionMonth } })

  // 列：翌月・2ヶ月後・3ヶ月後・それ以降（4ヶ月後以降を合算）
  const m1 = addMonths(submissionMonth, 1)
  const m2 = addMonths(submissionMonth, 2)
  const m3 = addMonths(submissionMonth, 3)
  const months = [m1, m2, m3]

  // 部署の絞り込み：「部署名」なら「部署名」と「部署名 ○○」の両方、「部署名 グループ名」ならそのグループだけ
  const deptWhere = dept
    ? { OR: [{ usage_dept: dept }, { usage_dept: { startsWith: `${dept} ` } }] }
    : {}

  const plans = await prisma.trayUsagePlan.findMany({
    where: {
      submission_month: submissionMonth,
      usage_month: { gte: m1 },
      ...deptWhere,
      ...(personId ? { usage_person_id: personId } : {}),
    },
    select: { rendo_tray_cd: true, usage_month: true, planned_qty: true },
  })

  // トレイごとの月別合計
  const sums = new Map<string, { m1: number; m2: number; m3: number; later: number }>()
  for (const p of plans) {
    const s = sums.get(p.rendo_tray_cd) ?? { m1: 0, m2: 0, m3: 0, later: 0 }
    if (p.usage_month === m1) s.m1 += p.planned_qty
    else if (p.usage_month === m2) s.m2 += p.planned_qty
    else if (p.usage_month === m3) s.m3 += p.planned_qty
    else s.later += p.planned_qty
    sums.set(p.rendo_tray_cd, s)
  }

  const trays = await prisma.mTray.findMany({
    orderBy: { sort_order: "asc" },
    select: { id: true, name: true, type: true, rendo_tray_cd: true },
  })

  const rows = trays
    .filter(t => {
      if (!type) return true
      return type === "その他" ? !KNOWN_TYPES.includes(t.type) : t.type === type
    })
    .map(t => {
      const s = (t.rendo_tray_cd && sums.get(t.rendo_tray_cd)) || { m1: 0, m2: 0, m3: 0, later: 0 }
      return {
        id: t.id,
        name: t.name,
        type: t.type,
        rendo_tray_cd: t.rendo_tray_cd,
        qty: [s.m1, s.m2, s.m3, s.later],
      }
    })

  return NextResponse.json({
    setting: setting
      ? { submission_month: setting.submission_month, deadline: setting.deadline, lock_a_flg: setting.lock_a_flg }
      : null,
    months,
    rows,
  })
}
