import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePurchasingAccess } from "@/lib/permissions"

function isValidMonth(ym: string): boolean {
  return /^\d{4}(0[1-9]|1[0-2])$/.test(ym)
}

function addMonths(ym: string, n: number): string {
  const y = Number(ym.slice(0, 4))
  const m = Number(ym.slice(4, 6)) - 1 + n
  const yy = y + Math.floor(m / 12)
  const mm = ((m % 12) + 12) % 12 + 1
  return `${yy}${String(mm).padStart(2, "0")}`
}

// 日本時間の今月（YYYYMM）
function currentMonthJst(): string {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

export async function GET(req: NextRequest) {
  const denied = await requirePurchasingAccess()
  if (denied) return denied

  const { searchParams } = new URL(req.url)
  const month = searchParams.get("month") || currentMonthJst()
  if (!isValidMonth(month)) {
    return NextResponse.json({ error: "month は YYYYMM 形式で指定してください" }, { status: 400 })
  }

  // 表示月の前月：棚卸し情報の年月、および使用予定の提出月
  const prev = addMonths(month, -1)
  const months = [month, addMonths(month, 1), addMonths(month, 2)]

  const [trays, inventories, plans, arrivals, stocks] = await Promise.all([
    prisma.mTray.findMany({
      orderBy: { sort_order: "asc" },
      select: { id: true, name: true, type: true, maker: true, rendo_tray_cd: true, optimal_stock: true },
    }),
    prisma.trayInventory.findMany({
      where: { inventory_month: prev },
      select: { rendo_tray_cd: true, remaining_qty: true },
    }),
    prisma.trayUsagePlan.findMany({
      where: { submission_month: prev, usage_month: { in: months } },
      select: { rendo_tray_cd: true, usage_month: true, planned_qty: true },
    }),
    prisma.trayArrivalPlan.findMany({
      where: { arrival_month: { in: months } },
      select: { tray_id: true, arrival_month: true, qty: true },
    }),
    prisma.trayInhouseStock.findMany({
      select: { tray_id: true, qty: true },
    }),
  ])

  // 前月残数（連動コードごと。同じコードの行が複数あれば合計）
  const invMap = new Map<string, number>()
  for (const i of inventories) {
    invMap.set(i.rendo_tray_cd, (invMap.get(i.rendo_tray_cd) ?? 0) + i.remaining_qty)
  }

  // 使用予定（連動コード・使用月ごとの合計）
  const usageMap = new Map<string, number>()
  for (const p of plans) {
    const key = `${p.rendo_tray_cd}|${p.usage_month}`
    usageMap.set(key, (usageMap.get(key) ?? 0) + p.planned_qty)
  }

  // 入庫予定（トレイ・月ごと）
  const arrivalMap = new Map<string, number>()
  for (const a of arrivals) {
    arrivalMap.set(`${a.tray_id}|${a.arrival_month}`, a.qty)
  }

  // 社内在庫（トレイごと）
  const stockMap = new Map<string, number>()
  for (const s of stocks) {
    stockMap.set(s.tray_id, s.qty)
  }

  const rows = trays.map((t) => {
    const code = t.rendo_tray_cd
    return {
      id: t.id,
      name: t.name,
      type: t.type,
      maker: t.maker,
      rendo_tray_cd: code,
      optimal_stock: t.optimal_stock,
      prev_qty: code && invMap.has(code) ? (invMap.get(code) as number) : null,
      inhouse_qty: stockMap.has(t.id) ? (stockMap.get(t.id) as number) : null,
      arrival: months.map((m) => (arrivalMap.has(`${t.id}|${m}`) ? (arrivalMap.get(`${t.id}|${m}`) as number) : null)),
      usage: months.map((m) => (code ? usageMap.get(`${code}|${m}`) ?? 0 : 0)),
    }
  })

  return NextResponse.json({ month, prev_month: prev, months, rows })
}

export async function PUT(req: NextRequest) {
  const denied = await requirePurchasingAccess()
  if (denied) return denied

  let body: { kind?: string; tray_id?: string; month?: string; qty?: number | string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "リクエストの形式が正しくありません" }, { status: 400 })
  }

  const { kind, tray_id, month, qty } = body
  if (kind !== "arrival" && kind !== "inhouse") {
    return NextResponse.json({ error: "kind が正しくありません" }, { status: 400 })
  }
  if (!tray_id || typeof tray_id !== "string") {
    return NextResponse.json({ error: "tray_id が必要です" }, { status: 400 })
  }

  const tray = await prisma.mTray.findUnique({ where: { id: tray_id }, select: { id: true } })
  if (!tray) return NextResponse.json({ error: "トレイが見つかりません" }, { status: 404 })

  // 数量が空なら未入力に戻す（行を削除）
  const isEmpty = qty === null || qty === undefined || qty === ""
  let n = 0
  if (!isEmpty) {
    n = Number(qty)
    if (!Number.isInteger(n) || n < 0) {
      return NextResponse.json({ error: "数量は0以上の整数で入力してください" }, { status: 400 })
    }
  }

  if (kind === "arrival") {
    if (!month || !isValidMonth(month)) {
      return NextResponse.json({ error: "month は YYYYMM 形式で指定してください" }, { status: 400 })
    }
    if (isEmpty) {
      await prisma.trayArrivalPlan.deleteMany({ where: { tray_id, arrival_month: month } })
    } else {
      await prisma.trayArrivalPlan.upsert({
        where: { tray_id_arrival_month: { tray_id, arrival_month: month } },
        create: { tray_id, arrival_month: month, qty: n },
        update: { qty: n },
      })
    }
  } else {
    if (isEmpty) {
      await prisma.trayInhouseStock.deleteMany({ where: { tray_id } })
    } else {
      await prisma.trayInhouseStock.upsert({
        where: { tray_id },
        create: { tray_id, qty: n },
        update: { qty: n },
      })
    }
  }

  return NextResponse.json({ ok: true })
}