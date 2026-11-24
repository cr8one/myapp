import { fmInt, fmRound, numIn, normName } from "./fm"
import { calcPaperLine } from "./paper"
import type { PaperLineInput, PaperLineResult, PaperStd } from "./paper"
import { calcPlateLine, calcPlateMakingLine } from "./plate"
import type { PlateMakingInput, PlateMakingResult, PlateMakingStd, PlateResult, PlateStd } from "./plate"
import { calcPrintLine } from "./print"
import type { PrintResult, PrintStd } from "./print"
import { calcProcLine } from "./proc"
import type { ProcLineInput, ProcLineResult, ProcStd } from "./proc"

// 見積書の計算に必要な、基準の値（有効な範囲・名前をそろえた形）
export interface EstimateStd {
  paper: PaperStd
  plate: PlateStd
  plateMaking: PlateMakingStd
  print: PrintStd
  proc: ProcStd
  salesRateNew: number | null // 営業費率（新譜）
  salesRateOld: number | null // 営業費率（旧譜）
  digiTrayPrice: number | null // デジパックトレイ代
}

// 版のまとまり（用紙・刷版・印刷が、判・用紙サイズ・台数・色数を共有する）
export interface PressGroupInput {
  partName?: string // 部位の名前（フロントカバー、本文24Pなど）。計算には使わない
  colorsFront?: number | null // 表の色数。paper.colors は、表＋裏の合計（画面で計算して入れる）
  colorsBack?: number | null // 裏の色数
  paper: PaperLineInput
  han: string
  printKind: string // 印刷種別
  extraColors: number // 特色増し
  manualPlatePrice: number | null
  manualPrintPrice: number | null
  manualPrintPasses: number | null
  manualPlateAmount?: number | null // 刷版の金額の手入力
  manualPrintAmount?: number | null // 印刷の金額の手入力
}
export interface OtherLineInput {
  label: string
  manualQty: number | null
  manualPrice: number | null
  manualAmount?: number | null // 金額の手入力
}
export interface EstimateInput {
  mainQty: number | null
  sampleQty: number | null
  newOld: string // 新旧区分（現行の文字のまま）
  manualSalesRate: number | null
  groups: PressGroupInput[] // 最大4
  plateMaking: PlateMakingInput[]
  proc: ProcLineInput[] // 加工（最大8）
  dvFaces: string
  dvPocket: string
  stuffQty: number | null // 入稿形態
  stuffPrice: number | null
  others: OtherLineInput[] // 加工他
  plateMakingInSubtotal: number // 小計に入れる製版の行数（現行は8。9行目以降は入らない）
  // 手入力（あれば、自動計算より優先）
  stuffManualAmount?: number | null
  manualSubtotal?: number | null
  manualSalesCost?: number | null
  manualTotal?: number | null
  manualUnitPrice?: number | null
  manualAmount?: number | null
}
export interface EstimateResult {
  order: number
  papers: PaperLineResult[]
  plates: PlateResult[]
  prints: PrintResult[]
  plateMaking: PlateMakingResult[]
  proc: ProcLineResult[]
  stuffAmount: number
  others: { qty: number | null; price: number | null; amount: number }[]
  paperTotal: number
  plateMakingTotal: number // 製版代合計（全行）
  subtotal: number
  salesRate: number | null
  salesCost: number
  otherTotal: number
  total: number
  unitPrice: number | null
  amount: number
}

export function calcEstimate(inp: EstimateInput, std: EstimateStd): EstimateResult {
  const order = (inp.mainQty ?? 0) + (inp.sampleQty ?? 0)

  const papers = inp.groups.map(gp => calcPaperLine(gp.paper, std.paper, order))
  const plates = inp.groups.map(gp =>
    calcPlateLine(
      { printKind: gp.printKind, sizeKind: gp.paper.sizeKind, han: gp.han, colors: gp.paper.colors, units: gp.paper.units, manualPrice: gp.manualPlatePrice, manualAmount: gp.manualPlateAmount ?? null },
      std.plate
    )
  )
  const prints = inp.groups.map((gp, i) =>
    calcPrintLine(
      {
        kind: gp.printKind,
        cat: plates[i].cat,
        zero: plates[i].zero,
        passes: papers[i].passes,
        colors: gp.paper.colors,
        extraColors: gp.extraColors,
        units: gp.paper.units,
        manualPrice: gp.manualPrintPrice,
        manualPasses: gp.manualPrintPasses,
        manualAmount: gp.manualPrintAmount ?? null,
      },
      std.print
    )
  )
  const plateMaking = inp.plateMaking.map(l => calcPlateMakingLine(l, std.plateMaking))

  const ctx = {
    order,
    paper: papers,
    units: inp.groups.map(gp => gp.paper.units),
    hans: inp.groups.map(gp => gp.han),
    sizeKinds: inp.groups.map(gp => gp.paper.sizeKind),
    dvFaces: inp.dvFaces,
    dvPocket: inp.dvPocket,
  }
  const proc = inp.proc.map(l => calcProcLine(l, std.proc, ctx))

  const stuffAmount = inp.stuffManualAmount != null ? inp.stuffManualAmount : fmInt((inp.stuffQty ?? 0) * (inp.stuffPrice ?? 0))

  // 加工他：デジパックトレイ代（1〜4枚貼り）は、数量・単価が空欄なら、数量は「−オーダー数×枚数」、単価は基準の値
  const others = inp.others.map(l => {
    const label = normName(l.label)
    const tray = /^デジパックトレイ代 \([1-4]枚貼り\)$/.test(label)
    const qty = tray && l.manualQty === null ? -1 * (order * (numIn(label) ?? 0)) : l.manualQty
    const price = tray && l.manualPrice === null ? std.digiTrayPrice : l.manualPrice
    return { qty, price, amount: l.manualAmount != null ? l.manualAmount : fmInt((qty ?? 0) * (price ?? 0)) }
  })

  const paperTotal = papers.reduce((s, p) => s + p.amount, 0)
  const plateMakingTotal = plateMaking.reduce((s, p) => s + p.amount, 0)
  const subtotalAuto =
    plateMaking.slice(0, inp.plateMakingInSubtotal).reduce((s, p) => s + p.amount, 0) +
    plates.reduce((s, p) => s + p.amount, 0) +
    prints.reduce((s, p) => s + p.amount, 0) +
    proc.reduce((s, p) => s + p.amount, 0) +
    stuffAmount
  const subtotal = inp.manualSubtotal != null ? inp.manualSubtotal : subtotalAuto

  // 営業費率：手入力があればそれ。なければ新旧区分（「○」＝新譜、「　　 ○」＝旧譜）
  let salesRate: number | null = null
  if (inp.manualSalesRate !== null) salesRate = inp.manualSalesRate
  else if (inp.newOld === "　　 ○") salesRate = std.salesRateOld
  else if (inp.newOld === "○") salesRate = std.salesRateNew
  const salesCost = inp.manualSalesCost != null ? inp.manualSalesCost : fmInt(subtotal * (salesRate ?? 0))

  const otherTotal = others.reduce((s, o) => s + o.amount, 0)
  const total = inp.manualTotal != null ? inp.manualTotal : paperTotal + subtotal + salesCost + otherTotal
  const unitPrice = inp.manualUnitPrice != null ? inp.manualUnitPrice : order !== 0 ? fmRound(total / order + 0.0000001, 1) : null
  const amount = inp.manualAmount != null ? inp.manualAmount : fmInt(order * fmRound(unitPrice ?? 0, 2))
  return { order, papers, plates, prints, plateMaking, proc, stuffAmount, others, paperTotal, plateMakingTotal, subtotal, salesRate, salesCost, otherTotal, total, unitPrice, amount }
}

// 手入力（数量・単価・金額・合計など）をすべて外した入力。「自動計算なら、いくらか」を見るために使う
export function stripOverrides(i: EstimateInput): EstimateInput {
  return {
    ...i,
    manualSalesRate: null,
    groups: i.groups.map(g => ({
      ...g,
      manualPlatePrice: null,
      manualPlateAmount: null,
      manualPrintPrice: null,
      manualPrintPasses: null,
      manualPrintAmount: null,
      paper: { ...g.paper, manualQty: null, manualPrice: null, manualAmount: null },
    })),
    plateMaking: i.plateMaking.map(l => ({ ...l, manualPrice: null, manualAmount: null })),
    proc: i.proc.map(l => ({ ...l, manualQty: null, manualPrice: null, manualAmount: null })),
    others: i.others.map(l => ({ ...l, manualQty: null, manualPrice: null, manualAmount: null })),
    stuffManualAmount: null,
    manualSubtotal: null,
    manualSalesCost: null,
    manualTotal: null,
    manualUnitPrice: null,
    manualAmount: null,
  }
}

export type FreezeMode = "price" | "amount"

// 見積の、今の計算結果を、手入力として固定する。基準が変わっても、あとで開き直しても、この値が残る。
//  price ：各行の単価と営業費率を固定する（数量を変えれば、金額は再計算される）
//  amount：各行の金額と営業費を固定する（元の見積と、完全に同じ金額になる）
export function freezeInput(i: EstimateInput, r: EstimateResult, mode: FreezeMode): EstimateInput {
  if (mode === "price") {
    return {
      ...i,
      manualSalesRate: r.salesRate ?? i.manualSalesRate,
      groups: i.groups.map((g, k) => ({
        ...g,
        manualPlatePrice: r.plates[k]?.price ?? g.manualPlatePrice,
        manualPrintPrice: r.prints[k]?.unitPrice ?? g.manualPrintPrice,
        paper: { ...g.paper, manualPrice: r.papers[k]?.price ?? g.paper.manualPrice },
      })),
      plateMaking: i.plateMaking.map((l, k) => ({ ...l, manualPrice: r.plateMaking[k]?.price ?? l.manualPrice })),
      proc: i.proc.map((l, k) => ({ ...l, manualPrice: r.proc[k]?.price ?? l.manualPrice })),
      others: i.others.map((l, k) => ({ ...l, manualPrice: r.others[k]?.price ?? l.manualPrice })),
    }
  }
  return {
    ...i,
    groups: i.groups.map((g, k) => ({
      ...g,
      manualPlateAmount: r.plates[k]?.amount ?? g.manualPlateAmount,
      manualPrintAmount: r.prints[k]?.amount ?? g.manualPrintAmount,
      paper: { ...g.paper, manualAmount: r.papers[k]?.amount ?? g.paper.manualAmount },
    })),
    plateMaking: i.plateMaking.map((l, k) => ({ ...l, manualAmount: r.plateMaking[k]?.amount ?? l.manualAmount })),
    proc: i.proc.map((l, k) => ({ ...l, manualAmount: r.proc[k]?.amount ?? l.manualAmount })),
    others: i.others.map((l, k) => ({ ...l, manualAmount: r.others[k]?.amount ?? l.manualAmount })),
    stuffManualAmount: r.stuffAmount,
    manualSalesCost: r.salesCost,
  }
}