import { fmInt, fmRound, normName } from "./fm"

// ================= 製版 =================
export interface PlateMakingInput {
  label: string // 製版内容
  color: string // 製版カラー（色校正／青焼き）
  proof: string // 校正回数
  qty: number | null
  units: number | null
  manualPrice: number | null
  manualAmount?: number | null // 金額の手入力
  line: number // 1〜10。9・10行目は、校正の減額の率が違う（現行の式）
}
export interface PlateMakingStd {
  size: Map<string, number> // 「CTP編集費 A6」などの名前（正規化）→ 単価
  spec: Map<string, number> // 「デジパック2面（色校正）」などの名前（正規化）→ 単価
}
export interface PlateMakingResult {
  base: number | null
  price: number | null
  amount: number
}

// 基準から、製版の基本の単価を探す（名前の完全一致。仕様別は、「本文」「DVD解説」「VHS解説」で始まる名前も、同じ仕様として扱う）
export function plateMakingBase(inp: PlateMakingInput, std: PlateMakingStd): number | null {
  const label = normName(inp.label)
  if (!label) return null
  const s = std.size.get(label)
  if (s !== undefined) return s
  const color = normName(inp.color).replace(/^\(|\)$/g, "")
  const specKey = (name: string) => `${name}（${color}）`
  const direct = std.spec.get(specKey(label))
  if (direct !== undefined) return direct
  for (const prefix of ["本文", "DVD解説", "VHS解説"]) {
    if (label.startsWith(prefix)) {
      for (const [k, v] of Array.from(std.spec.entries())) {
        if (k.startsWith(prefix) && k.endsWith(`（${color}）`)) return v
      }
    }
  }
  return null
}

export function calcPlateMakingLine(inp: PlateMakingInput, std: PlateMakingStd): PlateMakingResult {
  const base = plateMakingBase(inp, std)
  let price: number | null = null
  if (inp.manualPrice !== null) price = inp.manualPrice
  else if (base !== null) {
    const proof = normName(inp.proof)
    const group: Record<string, number> = inp.line <= 8 ? { 再校: 0.9, 三校: 0.9, 四校: 0.9 } : { 再校: 0.8, 三校: 0.8, 念校: 0.8 }
    if (proof === "" || proof === "初校") price = base
    else if (proof in group) price = fmRound(base * group[proof], -2)
  }
  const amount = inp.manualAmount != null ? inp.manualAmount : (inp.qty ?? 0) * (inp.units ?? 0) * (price ?? 0)
  return { base, price, amount }
}

// ================= 刷版 =================
export type PlateCat = "half" | "full" | null // 菊半才／菊全判

// 用紙サイズと判から、版の大きさの区分を決める。zero は、単価0として扱う組み合わせ
export function plateCategory(han: string, sizeKind: string): { cat: PlateCat; zero: boolean } {
  const h = normName(han)
  const s = normName(sizeKind)
  if (s === "") {
    // 全判
    if (h === "L判" || h === "4/6判") return { cat: null, zero: true }
    if (h === "菊判" || h === "K判" || h === "A判") return { cat: "full", zero: false }
    return { cat: null, zero: false }
  }
  if (s === "半切") {
    if (h === "4/6判" || h === "L判") return { cat: "full", zero: false }
    if (h === "菊判" || h === "K判" || h === "A判") return { cat: "half", zero: false }
    return { cat: null, zero: false }
  }
  if (s === "3切" || s === "4切" || s === "8切") {
    return ["4/6判", "菊判", "L判", "K判", "A判"].includes(h) ? { cat: "half", zero: false } : { cat: null, zero: false }
  }
  return { cat: null, zero: false }
}

export interface PlateStd {
  half: number | null // 刷版基本料金（菊半才）
  full: number | null // 刷版基本料金（四六半才・菊全）
  uvHalf: number | null
  uvFull: number | null
}
export interface PlateInput {
  printKind: string // 印刷種別
  sizeKind: string
  han: string
  colors: number // 色数の合計（刷版数量）
  units: number | null
  manualPrice: number | null
  manualAmount?: number | null // 金額の手入力
}
export interface PlateResult {
  cat: PlateCat
  zero: boolean
  qty: number
  price: number | null
  amount: number
}

export function calcPlateLine(inp: PlateInput, std: PlateStd): PlateResult {
  const { cat, zero } = plateCategory(inp.han, inp.sizeKind)
  const uv = normName(inp.printKind).startsWith("UV")
  let price: number | null = null
  if (inp.manualPrice !== null) price = inp.manualPrice
  else if (uv) price = cat === "half" ? std.uvHalf : cat === "full" ? std.uvFull : null
  else if (zero) price = 0
  else price = cat === "half" ? std.half : cat === "full" ? std.full : null
  const amount = inp.manualAmount != null ? inp.manualAmount : fmInt(inp.colors * (price ?? 0) * (inp.units ?? 0))
  return { cat, zero, qty: inp.colors, price, amount }
}