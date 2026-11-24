// 見積書の保存まわり（サーバー側）：入力の検査、計算、データベースの列への変換
import { calcEstimate } from "./estimate"
import type { EstimateResult, OtherLineInput, PressGroupInput } from "./estimate"
import { emptyGroup, MAX_GROUPS, MAX_OTHERS, MAX_PLATE_MAKING, MAX_PROC, toEngineInput } from "./form-types"
import type { EstimateBody, EstimateHeader } from "./form-types"
import type { PlateMakingInput } from "./plate"
import type { ProcLineInput } from "./proc"
import { loadEstimateStd } from "./std-loader"
import { reviveStd } from "./std-json"

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v)
const s = (v: unknown, max = 200): string => (typeof v === "string" ? v.trim().slice(0, max) : "")
const n = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) && Math.abs(v) < 1e9 ? v : null)
const b = (v: unknown): boolean => v === true
const DATE = /^\d{4}-\d{2}-\d{2}$/

export function parseHeader(raw: unknown): EstimateHeader | string {
  if (!isObj(raw)) return "ヘッダーの形式が正しくありません"
  const issue = s(raw.issue_date, 10)
  if (!DATE.test(issue) || Number.isNaN(Date.parse(issue))) return "作成日を入力してください"
  const due = s(raw.due_date, 10)
  if (due && (!DATE.test(due) || Number.isNaN(Date.parse(due)))) return "納期の形式が正しくありません"
  const main = n(raw.main_qty)
  if (main === null || main < 0 || !Number.isInteger(main)) return "本番数を、0以上の整数で入力してください"
  const sample = n(raw.sample_qty) ?? 0
  if (sample < 0 || !Number.isInteger(sample)) return "見本数を、0以上の整数で入力してください"
  const kind = s(raw.new_old_kind, 1)
  if (kind !== "新" && kind !== "旧" && kind !== "") return "新旧区分が正しくありません"
  const rate = n(raw.sales_rate_override)
  if (rate !== null && (rate < 0 || rate > 1)) return "営業費率は、0〜100%で入力してください"
  if (!s(raw.customer_name)) return "宛名を入力してください"
  return {
    customer_name: s(raw.customer_name),
    contact_name: s(raw.contact_name),
    title: s(raw.title),
    product_code: s(raw.product_code),
    content: s(raw.content, 500),
    issue_date: issue,
    due_date: due,
    main_qty: main,
    sample_qty: sample,
    new_old_kind: kind,
    sales_rate_override: rate,
    memo: s(raw.memo, 4000),
    delivery_to: s(raw.delivery_to),
    packing: s(raw.packing),
    remarks: s(raw.remarks, 2000),
  }
}

function parseGroup(raw: unknown): PressGroupInput {
  const g = isObj(raw) ? raw : {}
  const p = isObj(g.paper) ? g.paper : {}
  const sp = isObj(p.spare) ? p.spare : {}
  const front = n(g.colorsFront)
  const back = n(g.colorsBack)
  return {
    partName: s(g.partName),
    colorsFront: front,
    colorsBack: back,
    paper: {
      name: s(p.name),
      sizeKind: s(p.sizeKind, 10),
      gsm: n(p.gsm),
      packUnit: n(p.packUnit),
      faces: n(p.faces),
      eachFaces: n(p.eachFaces),
      units: n(p.units),
      colors: (front ?? 0) + (back ?? 0),
      spare: { B: b(sp.B), C: b(sp.C), D: b(sp.D), E: b(sp.E), digi: b(sp.digi) },
      manualQty: n(p.manualQty),
      manualPrice: n(p.manualPrice),
      manualAmount: n(p.manualAmount),
    },
    han: s(g.han, 10),
    printKind: s(g.printKind, 20),
    extraColors: n(g.extraColors) ?? 0,
    manualPlatePrice: n(g.manualPlatePrice),
    manualPrintPrice: n(g.manualPrintPrice),
    manualPrintPasses: n(g.manualPrintPasses),
    manualPlateAmount: n(g.manualPlateAmount),
    manualPrintAmount: n(g.manualPrintAmount),
  }
}

export function parseBody(raw: unknown): EstimateBody | string {
  if (!isObj(raw)) return "入力の形式が正しくありません"
  const arr = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : [])
  const groups = arr(raw.groups, MAX_GROUPS).map(parseGroup)
  const plateMaking: PlateMakingInput[] = arr(raw.plateMaking, MAX_PLATE_MAKING).map((x, i) => {
    const o = isObj(x) ? x : {}
    return { label: s(o.label), color: s(o.color, 10), proof: s(o.proof, 10), qty: n(o.qty), units: n(o.units), manualPrice: n(o.manualPrice), manualAmount: n(o.manualAmount), line: i + 1 }
  })
  const proc: ProcLineInput[] = arr(raw.proc, MAX_PROC).map(x => {
    const o = isObj(x) ? x : {}
    return { label: s(o.label), basis: s(o.basis, 4), manualQty: n(o.manualQty), manualPrice: n(o.manualPrice), manualAmount: n(o.manualAmount) }
  })
  const others: OtherLineInput[] = arr(raw.others, MAX_OTHERS).map(x => {
    const o = isObj(x) ? x : {}
    return { label: s(o.label), manualQty: n(o.manualQty), manualPrice: n(o.manualPrice), manualAmount: n(o.manualAmount) }
  })
  return {
    v: 1,
    groups: groups.length > 0 ? groups : [emptyGroup()],
    plateMaking,
    proc,
    dvFaces: s(raw.dvFaces, 10),
    dvPocket: s(raw.dvPocket, 10),
    stuffLabel: s(raw.stuffLabel),
    stuffQty: n(raw.stuffQty),
    stuffPrice: n(raw.stuffPrice),
    others,
    stuffManualAmount: n(raw.stuffManualAmount),
    manualSubtotal: n(raw.manualSubtotal),
    manualSalesCost: n(raw.manualSalesCost),
    manualTotal: n(raw.manualTotal),
    manualUnitPrice: n(raw.manualUnitPrice),
    manualAmount: n(raw.manualAmount),
  }
}

export async function computeResult(standardId: string, header: EstimateHeader, body: EstimateBody): Promise<EstimateResult> {
  const std = reviveStd(await loadEstimateStd(standardId))
  return calcEstimate(toEngineInput(header, body), std)
}

// データベースの列に入れる値
export function headerColumns(h: EstimateHeader) {
  return {
    customer_name: h.customer_name,
    contact_name: h.contact_name || null,
    title: h.title || null,
    product_code: h.product_code || null,
    content: h.content || null,
    issue_date: new Date(`${h.issue_date}T00:00:00.000Z`),
    due_date: h.due_date ? new Date(`${h.due_date}T00:00:00.000Z`) : null,
    main_qty: h.main_qty ?? 0,
    sample_qty: h.sample_qty ?? 0,
    new_old_kind: h.new_old_kind,
    sales_rate_override: h.sales_rate_override,
    memo: h.memo || null,
    delivery_to: h.delivery_to || null,
    packing: h.packing || null,
    remarks: h.remarks || null,
  }
}

export function totalColumns(r: EstimateResult) {
  return { subtotal: r.subtotal, sales_cost: r.salesCost, total: r.total, unit_price: r.unitPrice ?? 0, amount: r.amount }
}

// Json列に入れる値
export const toJson = (x: unknown) => JSON.parse(JSON.stringify(x))

export function columnsToHeader(e: {
  customer_name: string
  contact_name: string | null
  title: string | null
  product_code: string | null
  content: string | null
  issue_date: Date
  due_date: Date | null
  main_qty: number
  sample_qty: number
  new_old_kind: string
  sales_rate_override: unknown
  memo: string | null
  delivery_to: string | null
  packing: string | null
  remarks: string | null
}): EstimateHeader {
  const d = (x: Date | null) => (x ? x.toISOString().slice(0, 10) : "")
  const kind = e.new_old_kind === "新" || e.new_old_kind === "旧" ? e.new_old_kind : ""
  return {
    customer_name: e.customer_name,
    contact_name: e.contact_name ?? "",
    title: e.title ?? "",
    product_code: e.product_code ?? "",
    content: e.content ?? "",
    issue_date: d(e.issue_date),
    due_date: d(e.due_date),
    main_qty: e.main_qty,
    sample_qty: e.sample_qty,
    new_old_kind: kind,
    sales_rate_override: e.sales_rate_override === null || e.sales_rate_override === undefined ? null : Number(e.sales_rate_override),
    memo: e.memo ?? "",
    delivery_to: e.delivery_to ?? "",
    packing: e.packing ?? "",
    remarks: e.remarks ?? "",
  }
}