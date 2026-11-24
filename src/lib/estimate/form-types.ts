import type { PaperLineInput } from "./paper"
import { freezeInput, stripOverrides } from "./estimate"
import type { EstimateInput, EstimateResult, FreezeMode, OtherLineInput, PressGroupInput } from "./estimate"
import type { PlateMakingInput } from "./plate"
import type { ProcLineInput } from "./proc"

// 見積書のヘッダー（データベースの列）
export interface EstimateHeader {
  customer_name: string // 宛名
  contact_name: string // 客先担当者
  title: string // 品名
  product_code: string // 品番
  content: string // 内容
  issue_date: string // yyyy-mm-dd
  due_date: string
  main_qty: number | null // 本番数
  sample_qty: number | null // 見本数
  new_old_kind: "新" | "旧" | "" // 新譜／旧譜／なし
  sales_rate_override: number | null // 営業費率の手入力（5%なら 0.05）
  memo: string
  delivery_to: string
  packing: string
  remarks: string
}

// 見積書の入力（options 列に、JSONで保存する）
export interface EstimateBody {
  v: 1
  groups: PressGroupInput[] // 版のまとまり（用紙・刷版・印刷）。最大4
  plateMaking: PlateMakingInput[] // 製版。最大10
  proc: ProcLineInput[] // 加工。最大8
  dvFaces: string
  dvPocket: string
  stuffLabel: string // 入稿形態
  stuffQty: number | null
  stuffPrice: number | null
  others: OtherLineInput[] // 加工他。最大5
  // 手入力（あれば、自動計算より優先）
  stuffManualAmount: number | null
  manualSubtotal: number | null
  manualSalesCost: number | null
  manualTotal: number | null
  manualUnitPrice: number | null
  manualAmount: number | null
}

export const MAX_GROUPS = 4
export const MAX_PLATE_MAKING = 10
export const MAX_PROC = 8
export const MAX_OTHERS = 5

export const emptyGroup = (): PressGroupInput => ({
  partName: "",
  colorsFront: null,
  colorsBack: null,
  paper: {
    name: "", sizeKind: "", gsm: null, packUnit: null, faces: null, eachFaces: null, units: 1, colors: 0,
    spare: { B: false, C: false, D: false, E: false, digi: false },
    manualQty: null, manualPrice: null,
  } as PaperLineInput,
  han: "",
  printKind: "",
  extraColors: 0,
  manualPlatePrice: null,
  manualPrintPrice: null,
  manualPrintPasses: null,
})

export const emptyBody = (): EstimateBody => ({
  v: 1,
  groups: [emptyGroup()],
  plateMaking: [],
  proc: [],
  dvFaces: "",
  dvPocket: "無し",
  stuffLabel: "",
  stuffQty: null,
  stuffPrice: null,
  others: [],
  stuffManualAmount: null,
  manualSubtotal: null,
  manualSalesCost: null,
  manualTotal: null,
  manualUnitPrice: null,
  manualAmount: null,
})

export const emptyHeader = (): EstimateHeader => ({
  customer_name: "", contact_name: "", title: "", product_code: "", content: "",
  issue_date: "", due_date: "", main_qty: null, sample_qty: null, new_old_kind: "新",
  sales_rate_override: null, memo: "", delivery_to: "", packing: "", remarks: "",
})

// 計算に渡す形にする。新旧区分は、現行の文字（「○」＝新譜、「　　 ○」＝旧譜）にそろえる
export function toEngineInput(h: EstimateHeader, b: EstimateBody): EstimateInput {
  return {
    mainQty: h.main_qty,
    sampleQty: h.sample_qty,
    newOld: h.new_old_kind === "新" ? "○" : h.new_old_kind === "旧" ? "　　 ○" : "",
    manualSalesRate: h.sales_rate_override,
    groups: b.groups,
    plateMaking: b.plateMaking.map((l, i) => ({ ...l, line: i + 1 })),
    proc: b.proc,
    dvFaces: b.dvFaces,
    dvPocket: b.dvPocket,
    stuffQty: b.stuffQty,
    stuffPrice: b.stuffPrice,
    others: b.others,
    // 新システムでは、製版は、すべての行を小計に入れる
    plateMakingInSubtotal: b.plateMaking.length,
    stuffManualAmount: b.stuffManualAmount,
    manualSubtotal: b.manualSubtotal,
    manualSalesCost: b.manualSalesCost,
    manualTotal: b.manualTotal,
    manualUnitPrice: b.manualUnitPrice,
    manualAmount: b.manualAmount,
  }
}

// 計算結果を手入力として固定する（複製・確定の取り消し・基準が変わったときに使う）
export function freezeFormData(h: EstimateHeader, b: EstimateBody, r: EstimateResult, mode: FreezeMode): { header: EstimateHeader; body: EstimateBody } {
  const f = freezeInput(toEngineInput(h, b), r, mode)
  return {
    header: { ...h, sales_rate_override: f.manualSalesRate },
    body: {
      ...b,
      groups: f.groups,
      plateMaking: f.plateMaking,
      proc: f.proc,
      others: f.others,
      stuffManualAmount: f.stuffManualAmount ?? null,
      manualSalesCost: f.manualSalesCost ?? null,
    },
  }
}

// 手入力をすべて外して、自動計算に戻す
export function clearFormOverrides(h: EstimateHeader, b: EstimateBody): { header: EstimateHeader; body: EstimateBody } {
  const f = stripOverrides(toEngineInput(h, b))
  return {
    header: { ...h, sales_rate_override: null },
    body: {
      ...b,
      groups: f.groups,
      plateMaking: f.plateMaking,
      proc: f.proc,
      others: f.others,
      stuffManualAmount: null,
      manualSubtotal: null,
      manualSalesCost: null,
      manualTotal: null,
      manualUnitPrice: null,
      manualAmount: null,
    },
  }
}