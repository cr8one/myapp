import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, getSessionUser } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"

const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v))
const round4 = (v: number | null) => (v === null ? null : Math.round(v * 10000) / 10000)
const same = (a: number | null, b: number | null) =>
  a === null || b === null ? a === b : Math.abs(a - b) < 0.00005

type CellOut = { value: number | null; is_lump: boolean }
type Change = {
  standard_id: string
  item_id: string
  tier_id?: string | null
  before: number | null
  before_lump?: boolean
  value: number | null
  is_lump: boolean
}

// 一覧表のデータ。基準を行、項目を列にする。sheet に表のコードを指定する（省略時は先頭の表）
export async function GET(req: NextRequest) {
  const denied = await requirePermission("estimateView")
  if (denied) return denied

  const defs = await prisma.estSheetDef.findMany({ orderBy: [{ sort_order: "asc" }, { name: "asc" }] })
  if (defs.length === 0) return NextResponse.json({ sheets: [], sheet: null, standards: [], items: [] })
  const code = new URL(req.url).searchParams.get("sheet")
  const def = defs.find(d => d.code === code) ?? defs[0]

  const standards = await prisma.estStandard.findMany({
    select: { id: true, name: true, is_archived: true },
    orderBy: [{ is_archived: "asc" }, { sort_order: "asc" }, { name: "asc" }],
  })
  const items = await prisma.estSheetItem.findMany({
    where: { sheet_def_id: def.id },
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
    select: { id: true, name: true, unit: true },
  })
  const sheets = defs.map(d => ({ code: d.code, name: d.name, kind: d.kind }))
  const sheet = { code: def.code, name: def.name, kind: def.kind }

  if (def.kind === "matrix") {
    const tiers = await prisma.estStandardTier.findMany({
      where: { sheet_def_id: def.id },
      orderBy: [{ lot_from: "asc" }],
      include: { cells: true },
    })
    const out: Record<string, { id: string; lot_from: number; lot_to: number | null; cells: Record<string, CellOut> }[]> = {}
    for (const t of tiers) {
      if (!out[t.standard_id]) out[t.standard_id] = []
      out[t.standard_id].push({
        id: t.id,
        lot_from: t.lot_from,
        lot_to: t.lot_to,
        cells: Object.fromEntries(t.cells.map(c => [c.item_id, { value: num(c.value), is_lump: c.is_lump }])),
      })
    }
    return NextResponse.json({ sheets, sheet, standards, items, tiers: out })
  }

  const vals = await prisma.estStandardValue.findMany({ where: { item: { sheet_def_id: def.id } } })
  const out: Record<string, Record<string, CellOut>> = {}
  for (const v of vals) {
    if (!out[v.standard_id]) out[v.standard_id] = {}
    out[v.standard_id][v.item_id] = { value: num(v.value), is_lump: v.is_lump }
  }
  return NextResponse.json({ sheets, sheet, standards, items, values: out })
}

// まとめて保存。ほかの人が先に変えたセルがあれば、1件も保存せずに知らせる
export async function POST(req: Request) {
  const denied = await requirePermission("estimateEdit")
  if (denied) return denied

  const b = (await req.json().catch(() => null)) as { sheet_code?: unknown; changes?: unknown } | null
  const code = String(b?.sheet_code ?? "")
  const raw = b?.changes
  const changes = (Array.isArray(raw) ? raw : []) as Change[]
  if (!code || changes.length === 0) return NextResponse.json({ error: "変更がありません" }, { status: 400 })
  if (changes.length > 5000) return NextResponse.json({ error: "一度に保存できるのは5,000件までです" }, { status: 400 })

  const def = await prisma.estSheetDef.findUnique({ where: { code } })
  if (!def) return NextResponse.json({ error: "表が見つかりません" }, { status: 404 })
  const isMatrix = def.kind === "matrix"

  const items = await prisma.estSheetItem.findMany({
    where: { sheet_def_id: def.id },
    select: { id: true, name: true },
  })
  const itemName = new Map(items.map(i => [i.id, i.name]))

  for (const c of changes) {
    if (!c || typeof c.standard_id !== "string" || typeof c.item_id !== "string") {
      return NextResponse.json({ error: "変更の形式が正しくありません" }, { status: 400 })
    }
    if (!itemName.has(c.item_id)) return NextResponse.json({ error: "この表にない項目があります。再読み込みしてください" }, { status: 400 })
    if (isMatrix && typeof c.tier_id !== "string") return NextResponse.json({ error: "ロット範囲が指定されていません" }, { status: 400 })
    if (!isMatrix && c.tier_id) return NextResponse.json({ error: "この表には、ロット範囲がありません" }, { status: 400 })
    if (c.value !== null && (typeof c.value !== "number" || !Number.isFinite(c.value) || Math.abs(c.value) >= 1e9)) {
      return NextResponse.json({ error: "数値が正しくありません" }, { status: 400 })
    }
  }

  const stdIds = Array.from(new Set(changes.map(c => c.standard_id)))
  const standards = await prisma.estStandard.findMany({ where: { id: { in: stdIds } }, select: { id: true, name: true } })
  if (standards.length !== stdIds.length) return NextResponse.json({ error: "基準が見つかりません。再読み込みしてください" }, { status: 400 })
  const stdName = new Map(standards.map(s => [s.id, s.name]))

  const tierIds = Array.from(new Set(changes.map(c => c.tier_id).filter((x): x is string => typeof x === "string")))
  const tiers = isMatrix
    ? await prisma.estStandardTier.findMany({
        where: { id: { in: tierIds }, sheet_def_id: def.id },
        select: { id: true, standard_id: true, lot_from: true },
      })
    : []
  const tierMap = new Map(tiers.map(t => [t.id, t]))
  if (isMatrix) {
    for (const c of changes) {
      const t = tierMap.get(c.tier_id!)
      if (!t || t.standard_id !== c.standard_id) {
        return NextResponse.json({ error: "ロット範囲が見つかりません。再読み込みしてください" }, { status: 400 })
      }
    }
  }

  // 今の値を読んで、読み込み時から変わっていないか確かめる
  const itemIds = Array.from(new Set(changes.map(c => c.item_id)))
  const keyOf = (c: Change) => (isMatrix ? `${c.tier_id}|${c.item_id}` : `${c.standard_id}|${c.item_id}`)
  const cur = new Map<string, { value: number | null; is_lump: boolean }>()
  if (isMatrix) {
    const cells = await prisma.estStandardCell.findMany({ where: { tier_id: { in: tierIds }, item_id: { in: itemIds } } })
    for (const x of cells) cur.set(`${x.tier_id}|${x.item_id}`, { value: num(x.value), is_lump: x.is_lump })
  } else {
    const vals = await prisma.estStandardValue.findMany({ where: { standard_id: { in: stdIds }, item_id: { in: itemIds } } })
    for (const x of vals) cur.set(`${x.standard_id}|${x.item_id}`, { value: num(x.value), is_lump: x.is_lump })
  }
  const conflicts: string[] = []
  for (const c of changes) {
    const now = cur.get(keyOf(c)) ?? { value: null, is_lump: false }
    if (!same(now.value, round4(c.before ?? null)) || now.is_lump !== (c.before_lump ?? false)) {
      const lot = isMatrix ? `／${tierMap.get(c.tier_id!)!.lot_from}〜` : ""
      conflicts.push(`${stdName.get(c.standard_id)}／${itemName.get(c.item_id)}${lot}`)
    }
  }
  if (conflicts.length > 0) {
    return NextResponse.json(
      { error: "ほかの人が先に変更した値があるため、保存しませんでした。再読み込みしてください", conflicts: conflicts.slice(0, 10) },
      { status: 409 }
    )
  }

  await prisma.$transaction(
    async tx => {
      for (const c of changes) {
        const value = round4(c.value)
        const is_lump = value !== null && !!c.is_lump
        if (isMatrix) {
          if (value === null) {
            await tx.estStandardCell.deleteMany({ where: { tier_id: c.tier_id!, item_id: c.item_id } })
          } else {
            await tx.estStandardCell.upsert({
              where: { tier_id_item_id: { tier_id: c.tier_id!, item_id: c.item_id } },
              create: { tier_id: c.tier_id!, item_id: c.item_id, value, is_lump },
              update: { value, is_lump },
            })
          }
        } else if (value === null) {
          await tx.estStandardValue.deleteMany({ where: { standard_id: c.standard_id, item_id: c.item_id } })
        } else {
          await tx.estStandardValue.upsert({
            where: { standard_id_item_id: { standard_id: c.standard_id, item_id: c.item_id } },
            create: { standard_id: c.standard_id, item_id: c.item_id, value, is_lump },
            update: { value, is_lump },
          })
        }
      }
    },
    { maxWait: 10000, timeout: 60000 }
  )

  // 修正履歴：基準ごとに、変更前後の値を記録する（多いときは50件まで）
  const user = await getSessionUser()
  const byStd = new Map<string, Change[]>()
  for (const c of changes) byStd.set(c.standard_id, [...(byStd.get(c.standard_id) ?? []), c])
  for (const [sid, list] of Array.from(byStd.entries())) {
    const before: Record<string, number | string | null> = {}
    const after: Record<string, number | string | null> = {}
    list.slice(0, 50).forEach(c => {
      const lot = isMatrix ? `／${tierMap.get(c.tier_id!)!.lot_from}〜` : ""
      const label = `${def.name}／${itemName.get(c.item_id)}${lot}`
      before[label] = round4(c.before ?? null)
      after[label] = round4(c.value)
    })
    if (list.length > 50) after["（省略）"] = `ほか${list.length - 50}件`
    await createAuditLog({
      userId: user?.id,
      service: "estimate",
      action: "UPDATE",
      targetModel: "EstStandard",
      targetId: sid,
      targetLabel: stdName.get(sid),
      diff: { before, after },
    })
  }

  return NextResponse.json({ ok: true, saved: changes.length })
}