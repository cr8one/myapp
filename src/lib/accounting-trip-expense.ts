// 出張旅費精算書の入力チェックと金額の計算（新規作成・編集の両方で使う共通部品）。
// 小計と精算合計は、画面から送られた値を使わず、ここで必ず計算し直す。

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
  area_purpose: string | null
  trip_dates: { label: string; date: string; time: string }[]
  transport_items: { section: string; amount: number }[]
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
  title: string
  departmentName: string
  expense: TripExpenseData
}

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
    transport.push({ section: text(r?.section, 100), amount })
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
    lodging.push({ name: text(r?.name, 100), nights, amount })
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
  const areaPurpose = text(b.area_purpose, 1000)

  // 申請のときだけ必須チェック（下書きは未入力でもよい）
  if (submit) {
    if (!areaPurpose) return { error: "出張区域・用を入力してください" }
    if (total <= 0) return { error: "精算合計が0円です。金額を入力してください" }
  }

  return {
    value: {
      dateText,
      slipDate: toDate(dateText),
      title: text(b.title, 100),
      departmentName: text(b.department_name, 100),
      expense: {
        account_name: text(b.account_name, 50) || "旅費交通費",
        account_code: text(b.account_code, 20) || "714",
        tax_category: text(b.tax_category, 50) || "4.課税",
        area_purpose: areaPurpose || null,
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
