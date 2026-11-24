import { fmInt, fmRound, normName } from "./fm"
import { findTier } from "./tiers"
import type { PriceTier } from "./tiers"
import type { PlateCat } from "./plate"

export type PaperKind = "thin" | "thick" | "uvThin" | "uvThick"
export interface PrintStd {
  // 印刷代の表：列は「種別:区分」（例 thin:half）。行は、通し数のロット範囲
  cols: Partial<Record<`${PaperKind}:${"half" | "full"}`, PriceTier[]>>
}
export interface PrintInput {
  kind: string // 印刷種別：空欄（薄紙）／厚紙印刷／UV薄紙印刷／UV厚紙印刷
  cat: PlateCat
  zero: boolean // 刷版の判定で、単価0とする組み合わせ
  passes: number | null // 通し数（用紙の計算結果）
  colors: number // 色数の合計
  extraColors: number // 特色増し
  units: number | null
  manualPrice: number | null
  manualPasses: number | null
  manualAmount?: number | null // 金額の手入力
}
export interface PrintResult {
  colors: number
  unitPrice: number | null // 印刷代
  passesUsed: number | null
  amount: number
}

export function paperKindOf(kind: string): PaperKind {
  const k = normName(kind)
  if (k === "厚紙印刷") return "thick"
  if (k === "UV薄紙印刷") return "uvThin"
  if (k === "UV厚紙印刷") return "uvThick"
  return "thin"
}

export function calcPrintLine(inp: PrintInput, std: PrintStd): PrintResult {
  const colors = inp.colors + inp.extraColors
  let unitPrice: number | null
  let lump = false
  if (inp.manualPrice !== null) {
    unitPrice = fmRound(inp.manualPrice, 2)
    lump = unitPrice > 1000 // 手入力は、現行の式のとおり、1,000を超えたら一式
  } else {
    const pk = paperKindOf(inp.kind)
    if (pk === "thin" && inp.zero) unitPrice = 0
    else if (inp.cat === null) unitPrice = null
    else {
      const t = findTier(std.cols[`${pk}:${inp.cat}`], inp.passes)
      unitPrice = t?.value ?? null
      lump = t?.lump ?? false
    }
  }
  // 一式のときは、通し数を1とする
  const passesUsed = lump ? 1 : (inp.manualPasses ?? inp.passes)
  const amount = inp.manualAmount != null ? inp.manualAmount : fmInt(colors * (inp.units ?? 0) * (passesUsed ?? 0) * (unitPrice ?? 0))
  return { colors, unitPrice, passesUsed, amount }
}