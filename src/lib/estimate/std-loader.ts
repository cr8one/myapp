// 基準の値を、見積書の計算に渡す形で読み込む（サーバー側）
import { prisma } from "@/lib/prisma"
import { normName } from "./fm"
import type { EstimateStd } from "./estimate"
import type { WasteTier } from "./paper"
import type { PriceCell } from "./proc"
import { DIGIPAK_LABEL, SURFACE_LABELS, serializeStd } from "./std-json"
import type { EstimateStdJson } from "./std-json"
import type { PriceTier } from "./tiers"

const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v))

// 引き継ぎ設定の表は、親をたどって、実際の値を持つ基準を探す
async function sourceOf(standardId: string, defId: string): Promise<string> {
  let cur = standardId
  const seen = new Set<string>()
  for (;;) {
    seen.add(cur)
    const link = await prisma.estStandardSheet.findUnique({
      where: { standard_id_sheet_def_id: { standard_id: cur, sheet_def_id: defId } },
    })
    if (!link || link.mode !== "inherit") return cur
    const s = await prisma.estStandard.findUnique({ where: { id: cur }, select: { parent_id: true } })
    if (!s?.parent_id || seen.has(s.parent_id)) return cur
    cur = s.parent_id
  }
}

type Val = { name: string; sort: number; value: number | null; lump: boolean }
type TierRow = { from: number; to: number | null; cells: Val[] }

export async function loadEstimateStd(standardId: string): Promise<EstimateStdJson> {
  const defs = await prisma.estSheetDef.findMany()
  const byCode = new Map(defs.map(d => [d.code, d]))

  const valuesOf = async (code: string): Promise<Val[]> => {
    const def = byCode.get(code)
    if (!def) return []
    const src = await sourceOf(standardId, def.id)
    const vals = await prisma.estStandardValue.findMany({
      where: { standard_id: src, item: { sheet_def_id: def.id } },
      include: { item: { select: { name: true, sort_order: true } } },
    })
    return vals
      .map(v => ({ name: v.item.name, sort: v.item.sort_order, value: num(v.value), lump: v.is_lump }))
      .sort((a, b) => a.sort - b.sort)
  }
  const tiersOf = async (code: string): Promise<TierRow[]> => {
    const def = byCode.get(code)
    if (!def) return []
    const src = await sourceOf(standardId, def.id)
    const tiers = await prisma.estStandardTier.findMany({
      where: { standard_id: src, sheet_def_id: def.id },
      orderBy: { lot_from: "asc" },
      include: { cells: { include: { item: { select: { name: true, sort_order: true } } } } },
    })
    return tiers.map(t => ({
      from: t.lot_from,
      to: t.lot_to,
      cells: t.cells.map(c => ({ name: c.item.name, sort: c.item.sort_order, value: num(c.value), lump: c.is_lump })),
    }))
  }
  // 単価表を、項目（列）ごとの、ロット範囲の並びにする
  const byColumn = (tiers: TierRow[]): Map<string, PriceTier[]> => {
    const m = new Map<string, PriceTier[]>()
    for (const t of tiers) {
      for (const c of t.cells) {
        const key = normName(c.name)
        const arr = m.get(key) ?? []
        arr.push({ from: t.from, to: t.to, value: c.value, lump: c.lump })
        m.set(key, arr)
      }
    }
    return m
  }
  const orderedNames = (tiers: TierRow[]): string[] => {
    const seen = new Map<string, number>()
    for (const t of tiers) for (const c of t.cells) if (!seen.has(c.name)) seen.set(c.name, c.sort)
    return Array.from(seen.entries()).sort((a, b) => a[1] - b[1]).map(([n]) => n)
  }

  // 基本の値
  const basic = new Map((await valuesOf("basic")).map(v => [normName(v.name), v.value]))
  const b = (name: string) => basic.get(normName(name)) ?? null
  const zeroNull = (v: number | null) => (v === 0 ? null : v)

  // 用紙
  const paperVals = (await valuesOf("paper")).filter(v => v.value !== null)
  const paperKg: [string, number][] = []
  for (const v of paperVals) if (!paperKg.some(([k]) => k === normName(v.name))) paperKg.push([normName(v.name), v.value as number])

  // 損紙（印刷1C、製本、断裁、抜き、表面加工）
  const wasteTiers = await tiersOf("waste")
  const waste: WasteTier[] = wasteTiers.map(t => {
    const cell = (name: string) => {
      const c = t.cells.find(x => normName(x.name) === normName(name))
      return c && c.value !== null ? { value: c.value, fixed: c.lump } : undefined
    }
    return { from: t.from, to: t.to, A: cell("印刷1C"), B: cell("製本"), C: cell("断裁"), D: cell("抜き"), E: cell("表面加工") }
  })

  // 印刷代
  const printCols = byColumn(await tiersOf("printing"))
  const pc = (name: string) => printCols.get(normName(name))
  const print: EstimateStd["print"] = {
    cols: {
      "thin:half": pc("薄紙 菊半才・A3・四六4才"),
      "thin:full": pc("薄紙 四六半才・菊全"),
      "thick:half": pc("厚紙 菊半才・A3・四六4才"),
      "thick:full": pc("厚紙 四六半才・菊全"),
      "uvThin:half": pc("UV薄紙 菊半才以下"),
      "uvThin:full": pc("UV薄紙 四六半才・菊全"),
      "uvThick:half": pc("UV厚紙 菊半才以下"),
      "uvThick:full": pc("UV厚紙 四六半才・菊全"),
    },
  }

  // 製版
  const sizeVals = (await valuesOf("plate_size")).filter(v => v.value !== null)
  const specVals = await valuesOf("plate_spec")
  const plateMakingSize: [string, number][] = sizeVals.map(v => [normName(v.name), v.value as number])
  const plateMakingSpec: [string, number][] = specVals.filter(v => v.value !== null).map(v => [v.name, v.value as number])

  // 加工
  const singleVals = await valuesOf("processing_single")
  const single = new Map<string, PriceCell>(singleVals.map(v => [normName(v.name), { value: v.value, lump: v.lump }]))
  const splitTiers = await tiersOf("processing_split")
  const split = new Map<string, { below: PriceCell; above: PriceCell }>()
  for (const name of orderedNames(splitTiers)) {
    const pick = (first: boolean): PriceCell => {
      const t = first ? splitTiers[0] : splitTiers[splitTiers.length - 1]
      const c = t?.cells.find(x => x.name === name)
      return { value: c?.value ?? null, lump: c?.lump ?? false }
    }
    split.set(normName(name), { below: pick(true), above: pick(false) })
  }
  const procTiers = await tiersOf("processing")
  const outerTiers = await tiersOf("outer_box")

  const std: EstimateStd = {
    paper: { paperKg: new Map(paperKg), waste },
    plate: {
      half: zeroNull(b("刷版基本料金（菊半才・A3・四六4才）")),
      full: zeroNull(b("刷版基本料金（四六半才・菊全）")),
      uvHalf: zeroNull(b("UV刷版基本料金（菊半才・A3・四六4才）")),
      uvFull: zeroNull(b("UV刷版基本料金（四六半才・菊全）")),
    },
    plateMaking: { size: new Map(plateMakingSize), spec: new Map(plateMakingSpec) },
    print,
    proc: {
      matrix: byColumn(procTiers),
      outer: byColumn(outerTiers),
      single,
      split,
      digipak: byColumn(await tiersOf("digipak")),
      surface: byColumn(await tiersOf("surface")),
      digipakLabel: normName(DIGIPAK_LABEL),
    },
    salesRateNew: b("営業費（新譜）"),
    salesRateOld: b("営業費（旧譜）"),
    digiTrayPrice: b("デジパックトレイ代"),
  }

  // 画面の選択肢
  const procLabels: { label: string; source: string }[] = []
  for (const n of orderedNames(procTiers)) procLabels.push({ label: n, source: "加工・製本" })
  for (const n of orderedNames(outerTiers)) procLabels.push({ label: n, source: "外箱" })
  for (const v of singleVals) procLabels.push({ label: v.name, source: "単独" })
  for (const n of orderedNames(splitTiers)) procLabels.push({ label: n, source: "数量で切替" })
  for (const n of SURFACE_LABELS) procLabels.push({ label: n, source: "表面加工" })
  procLabels.push({ label: DIGIPAK_LABEL, source: "デジパック" })
  const plateLabels = [
    ...sizeVals.map(v => v.name),
    ...specVals.map(v => v.name.replace(/（[^）]*）$/, "")).filter((n, i, a) => a.indexOf(n) === i),
  ]

  return serializeStd(std, { paperNames: paperVals.map(v => v.name), procLabels, plateLabels })
}