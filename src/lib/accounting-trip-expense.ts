// 出張旅費精算書の入力チェックと金額の計算（新規作成・編集の両方で使う共通部品）。
// 小計と精算合計は、画面から送られた値を使わず、ここで必ず計算し直す。

import { LIMIT } from "@/lib/accounting-trip-layout"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}$/
const toDate = (s: string) => new Date(`${s}T00:00:00.000Z`)
const validDate = (s: string) => DATE_RE.test(s) && !isNaN(toDate(s).getTime())
const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max)
const blank = (v: unknown) => v === undefined || v === null || String(v).trim() === ""
const parseNum = (v: unknown): number | null => {
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 && n <= 99999999 ? n : null
}
const sum = (xs: { amount: number }[]) => xs.reduce((a, x) => a + x.amount, 0)

export type TripExpenseData = {
  account_name: string
  account_code: string
  tax_category: string
  area_purpose: string | null // これまでの「出張区域・用」（新しい伝票では使わない）
  trip_area: string | null
  trip_purpose: string | null
  trip_dates: { label: string; date: string; time: string }[]
  transport_items: { category?: string; section: string; amount: number }[]
  lodging_items: { name: string; nights: number; amount: number }[]
  allowance_items: { days: number; amount: number }[]
  transport_subtotal: number
  lodging_subtotal: number
  allowance_subtotal: number
  total_amount: number
}

export type ParsedTrip = {
  dateText: string
  slipDate: Date
  departmentCode: string
  departmentName: string
  expense: TripExpenseData
}

// 交通費の分類（入力画面の選択肢と同じ並び）
export const TRANSPORT_CATEGORIES: readonly string[] = ["電車・バス・新幹線", "タクシー", "パーキング"]

export function parseTripExpense(b: any, submit: boolean): { error: string } | { value: ParsedTrip } {
  const dateText = String(b.slip_date ?? "")
  if (!validDate(dateText)) return { error: "日付を入力してください" }

  // 出張期間（最大2行：現地到着・現地出発）
  const rawDates = Array.isArray(b.trip_dates) ? b.trip_dates : []
  if (rawDates.length > 2) return { error: "出張期間の行は2行までです" }
  const tripDates: TripExpenseData["trip_dates"] = []
  for (const r of rawDates) {
    if (blank(r?.date) && blank(r?.time)) continue
    const date = text(r?.date, 10)
    const time = text(r?.time, 5)
    if (date && !validDate(date)) return { error: "出張期間の日付が正しくありません" }
    if (time && !TIME_RE.test(time)) return { error: "出張期間の時間が正しくありません" }
    tripDates.push({ label: text(r?.label, 20), date, time })
  }

  // 交通費（最大8行）
  const rawTransport = Array.isArray(b.transport_items) ? b.transport_items : []
  if (rawTransport.length > 8) return { error: "交通費の行は8行までです" }
  const transport: TripExpenseData["transport_items"] = []
  for (const r of rawTransport) {
    if (blank(r?.section) && blank(r?.amount)) continue
    const amount = blank(r?.amount) ? null : parseNum(r?.amount)
    if (amount === null) return { error: "交通費の金額が正しくありません" }
    const section = text(r?.section, 1000)
    if (section.length > LIMIT.section) return { error: `区間は${LIMIT.section}文字までです` }
    const category = text(r?.category, 20)
    if (category && TRANSPORT_CATEGORIES.includes(category) === false) return { error: "交通費の分類が正しくありません" }
    transport.push({ category, section, amount })
  }

  // 宿泊費（最大3行）
  const rawLodging = Array.isArray(b.lodging_items) ? b.lodging_items : []
  if (rawLodging.length > 3) return { error: "宿泊費の行は3行までです" }
  const lodging: TripExpenseData["lodging_items"] = []
  for (const r of rawLodging) {
    if (blank(r?.name) && blank(r?.nights) && blank(r?.amount)) continue
    const amount = blank(r?.amount) ? null : parseNum(r?.amount)
    const nights = blank(r?.nights) ? 0 : parseNum(r?.nights)
    if (amount === null || nights === null) return { error: "宿泊費の泊数または金額が正しくありません" }
    const name = text(r?.name, 1000)
    if (name.length > LIMIT.lodgingName) return { error: `宿泊先は${LIMIT.lodgingName}文字までです` }
    lodging.push({ name, nights, amount })
  }

  // 日当（最大2行）
  const rawAllowance = Array.isArray(b.allowance_items) ? b.allowance_items : []
  if (rawAllowance.length > 2) return { error: "日当の行は2行までです" }
  const allowance: TripExpenseData["allowance_items"] = []
  for (const r of rawAllowance) {
    if (blank(r?.days) && blank(r?.amount)) continue
    const amount = blank(r?.amount) ? null : parseNum(r?.amount)
    const days = blank(r?.days) ? 0 : parseNum(r?.days)
    if (amount === null || days === null) return { error: "日当の日数または金額が正しくありません" }
    allowance.push({ days, amount })
  }

  const transportSubtotal = sum(transport)
  const lodgingSubtotal = sum(lodging)
  const allowanceSubtotal = sum(allowance)
  const total = transportSubtotal + lodgingSubtotal + allowanceSubtotal
  const tripArea = text(b.trip_area, 1000)
  const tripPurpose = text(b.trip_purpose, 5000)
  if (tripArea.length > LIMIT.tripArea) return { error: `出張区域は${LIMIT.tripArea}文字までです` }
  if (tripPurpose.length > LIMIT.tripPurpose) return { error: `出張目的は${LIMIT.tripPurpose}文字までです` }
  const departmentCode = text(b.department_code, 10)
  if (departmentCode && !/^\d{3}$/.test(departmentCode)) return { error: "部門コードは数字3桁で入力してください" }

  // 申請のときだけ必須チェック（下書きは未入力でもよい）
  if (submit) {
    if (!tripArea) return { error: "出張区域を入力してください" }
    if (!tripPurpose) return { error: "出張目的を入力してください" }
    if (total <= 0) return { error: "精算合計が0円です。金額を入力してください" }
  }

  return {
    value: {
      dateText,
      slipDate: toDate(dateText),
      departmentCode,
      departmentName: text(b.department_name, 100),
      expense: {
        account_name: text(b.account_name, 50) || "旅費交通費",
        account_code: text(b.account_code, 20) || "714",
        tax_category: text(b.tax_category, 50) || "4.課税",
        area_purpose: null,
        trip_area: tripArea || null,
        trip_purpose: tripPurpose || null,
        trip_dates: tripDates,
        transport_items: transport,
        lodging_items: lodging,
        allowance_items: allowance,
        transport_subtotal: transportSubtotal,
        lodging_subtotal: lodgingSubtotal,
        allowance_subtotal: allowanceSubtotal,
        total_amount: total,
      },
    },
  }
}
