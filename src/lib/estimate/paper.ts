import { fmInt, fmRound, fmTruncate, normName } from "./fm"

// ---- 基準（用紙まわり） ----
export interface WasteCell {
  value: number
  fixed: boolean // true：固定の枚数、false：通し数に対する率
}
export interface WasteTier {
  from: number
  to: number | null
  A?: WasteCell // 印刷（1色あたり）
  B?: WasteCell // 製本
  C?: WasteCell // 断裁
  D?: WasteCell // 抜き
  E?: WasteCell // 表面加工
}
export interface PaperStd {
  paperKg: Map<string, number> // 用紙名（正規化）→ kg単価
  waste: WasteTier[] // 開始の小さい順
}

// ---- 見積書の入力（用紙1行） ----
export interface PaperSpare {
  B: boolean // 製本
  C: boolean // 断裁
  D: boolean // 抜き
  E: boolean // 表面加工
  digi: boolean
}
export interface PaperLineInput {
  name: string
  sizeKind: string // 半切／3切／4切／8切／空欄（全）
  gsm: number | null // 斤量
  packUnit: number | null // 包単位
  faces: number | null // 面
  eachFaces: number | null // 各面
  units: number | null // 台数
  colors: number // 損紙計算の色数（その行に対応する2つの色数の合計）
  spare: PaperSpare
  manualQty: number | null
  manualPrice: number | null
  manualAmount?: number | null // 金額の手入力（あれば、自動計算より優先）
}
export interface PaperLineResult {
  passes: number | null // 通し数
  wasteBase: number // 通し数＋印刷の損紙
  wasteB: number
  wasteC: number
  wasteD: number
  wasteE: number
  wasteDigi: number
  sheets: number // 損通計算1（台数を掛けたあとの枚数）
  qty: number // 用紙数量
  price: number | null // 用紙単価
  amount: number // 用紙金額
}

const DIV: Record<string, number> = { 半切: 2, "3切": 3, "4切": 4, "8切": 8 }

// 通し数から、損紙の段を選ぶ（開始 ≤ 通し数 ≤ 終了）
export function findWasteTier(tiers: WasteTier[], passes: number): WasteTier | null {
  for (const t of tiers) if (t.from <= passes && (t.to === null || passes <= t.to)) return t
  return null
}

export function calcPaperLine(inp: PaperLineInput, std: PaperStd, order: number): PaperLineResult {
  // 通し数 ＝ オーダー数 ÷ 面（余りを繰り上げ気味に）。面が空欄なら、なし
  const divisor = inp.eachFaces ?? inp.faces
  const passes = inp.faces !== null && divisor ? fmInt(order / divisor + 0.9) : null

  const tier = passes !== null ? findWasteTier(std.waste, passes) : null
  const colors = inp.colors

  // 印刷の損紙
  let a = 0
  if (tier?.A && passes !== null) {
    a = tier.A.fixed ? tier.A.value * colors : fmRound(tier.A.value * passes * colors, 0)
  }
  const wasteBase = (passes ?? 0) + fmRound(a, 0)

  // 製本・断裁・抜き・表面加工の予備（その行に○があるときだけ）
  const other = (cell: WasteCell | undefined): number | null => {
    if (!cell || passes === null) return null
    return cell.fixed ? cell.value : fmRound(cell.value * passes + 0.4444444444, 1)
  }
  const rawB = other(tier?.B)
  const wasteB = inp.spare.B && rawB !== null ? fmRound(rawB, 0) : 0
  const rawC = other(tier?.C)
  const wasteC = inp.spare.C && rawC !== null ? fmRound(rawC, 0) : 0
  const rawD = other(tier?.D)
  const wasteD = inp.spare.D && rawD !== null ? fmRound(rawD, 0) : 0
  const rawE = other(tier?.E)
  const wasteE = inp.spare.E && rawE !== null ? fmRound(rawE, 0) : 0
  const wasteDigi = inp.spare.digi && rawB !== null ? fmRound(rawB * 2, 0) : 0

  // 用紙サイズが半切・3切・4切・8切なら、枚数を割って、台数を掛ける
  const sum = wasteBase + wasteB + wasteC + wasteD + wasteE + wasteDigi
  const d = DIV[inp.sizeKind]
  const adjusted = d ? fmRound(sum / d + 0.4444444444, 0) : sum
  const sheets = adjusted * (inp.units ?? 0)

  // 用紙数量：手入力があればそれ。包単位があれば、その倍数に丸める
  const qty =
    inp.manualQty !== null
      ? inp.manualQty
      : inp.packUnit
        ? fmRound(sheets / inp.packUnit + 0.496, 0) * inp.packUnit
        : sheets

  // 用紙単価：手入力があればそれ。なければ kg単価 × 斤量 ÷ 1000（小数第3位以下は切り捨て）
  let price: number | null = null
  if (inp.manualPrice !== null) price = inp.manualPrice
  else {
    const kg = std.paperKg.get(normName(inp.name))
    if (kg !== undefined && inp.gsm !== null) price = fmTruncate((kg * inp.gsm) / 1000, 2)
  }

  const amount = inp.manualAmount != null ? inp.manualAmount : fmInt(qty * (price ?? 0))
  return { passes, wasteBase, wasteB, wasteC, wasteD, wasteE, wasteDigi, sheets, qty, price, amount }
}