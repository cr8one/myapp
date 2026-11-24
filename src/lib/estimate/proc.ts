import { fmInt, fmRound, normName } from "./fm"
import { findTier } from "./tiers"
import type { PriceTier } from "./tiers"
import type { PaperLineResult } from "./paper"

// 現行の式：加工の単価が750以上なら、一式（数量1）として扱う
export const LUMP_MIN = 750
// 現行の式：同じ名前の項目が2つ並ぶ加工（デジ加工代）は、オーダー数2,000未満と以上で切り替える
export const SPLIT_AT = 2000

// 版の大きさ（表面加工の単価の列を決める）。判と用紙サイズから、現行の式（表加計算）のとおり
export type SurfaceSize = "菊半才" | "四六半才" | "菊全" | "菊3才" | "四六4才"
export function surfaceSize(han: string, sizeKind: string): SurfaceSize | null {
  const h = normName(han)
  const s = normName(sizeKind)
  if (s === "半切") {
    if (h === "4/6判" || h === "L判") return "四六半才"
    if (h === "菊判" || h === "A判" || h === "K判") return "菊半才"
  } else if (s === "") {
    if (h === "菊判" || h === "K判" || h === "A判") return "菊全"
  } else if (s === "3切") {
    if (h === "菊判" || h === "K判" || h === "A判") return "菊3才"
  } else if (s === "4切") {
    if (h === "4/6判" || h === "L判") return "四六4才"
  }
  return null
}

export interface PriceCell {
  value: number | null
  lump: boolean // 一式の印
}

export interface ProcStd {
  matrix: Map<string, PriceTier[]> // 加工・製本（行のロット範囲は、開始で選ぶ）
  outer: Map<string, PriceTier[]> // 外箱加工（オーダー数で選ぶ）
  single: Map<string, PriceCell> // 投込み代・デジ加工代など、単独の値
  split: Map<string, { below: PriceCell; above: PriceCell }> // 数量で切り替える加工
  digipak: Map<string, PriceTier[]> // デジパック抜き貼り代：列は「DV2P」「DV2P・P」など
  surface: Map<string, PriceTier[]> // 表面加工：列は「PP貼り 菊半才」など（通しの数で選ぶ）
  digipakLabel: string // 「DVDigipak抜き貼り代」にあたる名前
}

export interface ProcContext {
  order: number // オーダー数
  paper: PaperLineResult[] // 用紙1〜4行目の計算結果（通し数、損紙）
  units: (number | null)[] // 台数1〜4
  hans: string[] // 判 1〜4行目
  sizeKinds: string[] // 用紙サイズ 1〜4行目
  dvFaces: string // DVデジ 面数（「2面」など）
  dvPocket: string // ポケット有無（「有り」「無し」）
}

export interface ProcLineInput {
  label: string
  basis: string // 数量の選び方：個／通1〜通4
  manualQty: number | null
  manualPrice: number | null
  manualAmount?: number | null // 金額の手入力
}
export interface ProcLineResult {
  baseQty: number | null // 基本の数量（加工数量1）
  surfacePasses: number | null
  price: number | null
  qty: number | null
  amount: number
  source: string
}

const SURFACE_FAMILY: Record<string, string> = {
  "PP貼り": "PP貼り",
  "マットPP貼り": "マットPP貼り",
  "サック貼り用PP貼り": "サック用PP貼り",
  "サック貼り用マットPP貼り": "サック用マットPP貼り",
}

export function calcProcLine(inp: ProcLineInput, std: ProcStd, ctx: ProcContext): ProcLineResult {
  const label = normName(inp.label)
  const basis = normName(inp.basis)
  const family = SURFACE_FAMILY[label]
  const m = /^通([1-4])$/.exec(basis)
  const n = m ? Number(m[1]) : null // 何本目の通しか

  // 表面加工の通し：（通し数＋製本・断裁・抜き・デジの損紙＋4）を10の単位に丸める
  let surfacePasses: number | null = null
  if (family && n !== null) {
    const p = ctx.paper[n - 1]
    if (p && p.passes !== null) {
      surfacePasses = fmRound(p.passes + p.wasteB + p.wasteC + p.wasteD + p.wasteDigi + 4, -1)
    } else if (p) {
      surfacePasses = fmRound(0 + p.wasteB + p.wasteC + p.wasteD + p.wasteDigi + 4, -1)
    }
  }

  // 基本の数量
  let baseQty: number | null
  if (inp.manualQty !== null) baseQty = inp.manualQty
  else if (family && n !== null) baseQty = (surfacePasses ?? 0) * (ctx.units[n - 1] ?? 0)
  else if (basis === "個") baseQty = ctx.order
  else if (n !== null) baseQty = (ctx.paper[n - 1]?.passes ?? 0) * (ctx.units[n - 1] ?? 0)
  else baseQty = null

  // 単価（と、一式かどうか）
  let price: number | null = null
  let lump = false
  let source = "なし"
  const fromTier = (tiers: PriceTier[] | undefined, q: number | null) => {
    const t = findTier(tiers, q)
    price = t?.value ?? null
    lump = t?.lump ?? false
  }
  if (inp.manualPrice !== null) {
    price = inp.manualPrice
    lump = price >= LUMP_MIN // 手入力は、現行の式のとおり、750以上なら一式
    source = "手入力"
  } else if (family) {
    source = "表面加工"
    if (n !== null) {
      const size = surfaceSize(ctx.hans[n - 1] ?? "", ctx.sizeKinds[n - 1] ?? "")
      if (size) fromTier(std.surface.get(`${family} ${size}`), baseQty)
    }
  } else if (std.outer.has(label)) {
    source = "外箱"
    fromTier(std.outer.get(label), ctx.order)
  } else if (label === std.digipakLabel) {
    source = "デジパック"
    const f = /(\d)/.exec(normName(ctx.dvFaces))
    if (f) fromTier(std.digipak.get(normName(ctx.dvPocket) === "有り" ? `DV${f[1]}P・P` : `DV${f[1]}P`), ctx.order)
  } else if (std.split.has(label)) {
    source = "数量で切替"
    const s = std.split.get(label)!
    const c = ctx.order < SPLIT_AT ? s.below : s.above
    price = c.value
    lump = c.lump
  } else if (std.single.has(label)) {
    source = "単独"
    const c = std.single.get(label)!
    price = c.value
    lump = c.lump
  } else if (std.matrix.has(label)) {
    source = "加工・製本"
    fromTier(std.matrix.get(label), baseQty)
  }

  // 数量：一式なら1。なければ、基本の数量（0なら空欄）
  let qty: number | null
  if (price !== null && lump) qty = 1
  else qty = baseQty !== null && baseQty !== 0 ? baseQty : null
  const amount = inp.manualAmount != null ? inp.manualAmount : fmInt((qty ?? 0) * (price ?? 0))
  return { baseQty, surfacePasses, price, qty, amount, source }
}