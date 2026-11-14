// 飲食費及び仮払精算書の入力チェックと金額の計算（新規作成・編集の両方で使う共通部品）。
// 小計・不足金・残金は、画面から送られた値を使わず、ここで必ず計算し直す。
// 明細は行の一覧。飲食費は最大2行（A・B）、その他は最大3行（C・D・E）。
// 勘定科目と区分は、経理が経理承認の段階で入れる。申請者の入力では、必ず空にする。

import { LIMIT, MEAL_KINDS } from "@/lib/accounting-meal-advance-layout"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const toDate = (s: string) => new Date(`${s}T00:00:00.000Z`)
const validDate = (s: string) => DATE_RE.test(s) && !isNaN(toDate(s).getTime())
const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max)
const blank = (v: unknown) => v === undefined || v === null || String(v).trim() === ""
// 未入力か、0円・0名のときは、入力なしとみなす
const emptyNum = (v: unknown) => blank(v) || Number(v) === 0
const parseNum = (v: unknown): number | null => {
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 && n <= 99999999 ? n : null
}

export const MAX_MEAL_ROWS = 2 // 飲食費A・B
export const MAX_OTHER_ROWS = 3 // その他精算C・D・E
const LETTERS = ["A", "B", "C", "D", "E"]

type Accounting = { account_name: string; account_code: string; tax_category: string }

// 飲食費の1行分
export type MealItem = Accounting & {
  type: "meal"
  payee: string
  address: string
  meal_date: string
  tel: string
  kind: string
  headcount: number
  participants: string
  amount: number
}

// その他精算（カーリース代、高速道路利用代など）の1行分
export type OtherItem = Accounting & {
  type: "other"
  item: string
  amount: number
}

export type MealAdvanceItem = MealItem | OtherItem

export type MealAdvanceData = {
  purpose: string | null
  remarks: string | null
  items: MealAdvanceItem[]
  subtotal: number
  advance_amount: number
  shortage_amount: number
  balance_amount: number
}

export type ParsedMeal = {
  dateText: string
  slipDate: Date
  departmentCode: string
  departmentName: string
  meal: MealAdvanceData
}

const NO_ACCOUNTING: Accounting = { account_name: "", account_code: "", tax_category: "" }

export function parseMealAdvance(b: any, submit: boolean): { error: string } | { value: ParsedMeal } {
  const dateText = String(b.slip_date ?? "")
  if (!validDate(dateText)) return { error: "精算日を入力してください" }

  const rawItems = Array.isArray(b.items) ? b.items : []
  if (rawItems.length > 20) return { error: "明細の行が多すぎます" }

  const meals: MealItem[] = []
  const others: OtherItem[] = []

  for (const r of rawItems) {
    if (r?.type === "other") {
      // その他精算（C・D・E）
      if (blank(r?.item) && emptyNum(r?.amount)) continue
      if (others.length >= MAX_OTHER_ROWS) return { error: `その他精算の行は${MAX_OTHER_ROWS}行までです` }
      const name = `その他精算${LETTERS[MAX_MEAL_ROWS + others.length]}`
      const amount = blank(r?.amount) ? 0 : parseNum(r?.amount)
      if (amount === null) return { error: `${name}の金額が正しくありません` }
      const item = text(r?.item, 1000)
      if (item.length > LIMIT.otherItem) return { error: `${name}の内容は${LIMIT.otherItem}文字までです` }
      if (submit && !item) return { error: `${name}の内容を入力してください` }
      if (submit && amount <= 0) return { error: `${name}の金額を入力してください` }
      others.push({ type: "other", item, amount, ...NO_ACCOUNTING })
      continue
    }

    // 飲食費（A・B）。種類の指定がない行も、飲食費として扱う
    const empty = blank(r?.payee) && blank(r?.address) && blank(r?.meal_date) && blank(r?.tel) &&
      blank(r?.kind) && emptyNum(r?.headcount) && blank(r?.participants) && emptyNum(r?.amount)
    if (empty) continue
    if (meals.length >= MAX_MEAL_ROWS) return { error: `飲食費の行は${MAX_MEAL_ROWS}行までです` }
    const name = `飲食費${LETTERS[meals.length]}`
    const payee = text(r?.payee, 1000)
    const address = text(r?.address, 1000)
    const tel = text(r?.tel, 1000)
    const participants = text(r?.participants, 1000)
    const mealDate = text(r?.meal_date, 10)
    const kind = text(r?.kind, 20)
    if (payee.length > LIMIT.payee) return { error: `${name}の支払先名は${LIMIT.payee}文字までです` }
    if (address.length > LIMIT.address) return { error: `${name}の住所は${LIMIT.address}文字までです` }
    if (tel.length > LIMIT.tel) return { error: `${name}のTELは${LIMIT.tel}文字までです` }
    if (participants.length > LIMIT.participants) return { error: `${name}の参加者名は${LIMIT.participants}文字までです` }
    if (mealDate && !validDate(mealDate)) return { error: `${name}の飲食日が正しくありません` }
    if (kind && !MEAL_KINDS.includes(kind)) return { error: `${name}の種別が正しくありません` }
    const headcount = blank(r?.headcount) ? 0 : parseNum(r?.headcount)
    if (headcount === null || headcount > 999) return { error: `${name}の参加人数が正しくありません` }
    const amount = blank(r?.amount) ? 0 : parseNum(r?.amount)
    if (amount === null) return { error: `${name}の金額が正しくありません` }
    // 申請のときだけ必須チェック（下書きは未入力でもよい）
    if (submit) {
      if (!payee) return { error: `${name}の支払先名を入力してください` }
      if (!mealDate) return { error: `${name}の飲食日を入力してください` }
      if (headcount < 1) return { error: `${name}の参加人数を入力してください` }
      if (amount <= 0) return { error: `${name}の金額を入力してください` }
    }
    meals.push({ type: "meal", payee, address, meal_date: mealDate, tel, kind, headcount, participants, amount, ...NO_ACCOUNTING })
  }

  // 飲食費を先に、その他を後に並べる（紙の様式のA・B・C・D・Eの並びと同じ）
  const items: MealAdvanceItem[] = [...meals, ...others]

  const advance = blank(b.advance_amount) ? 0 : parseNum(b.advance_amount)
  if (advance === null) return { error: "仮払金が正しくありません" }

  const subtotal = items.reduce((s, x) => s + x.amount, 0)
  const shortage = Math.max(subtotal - advance, 0)
  const balance = Math.max(advance - subtotal, 0)

  const purpose = text(b.purpose, 5000)
  const remarks = text(b.remarks, 5000)
  if (purpose.length > LIMIT.purpose) return { error: `使途内容は${LIMIT.purpose}文字までです` }
  if (remarks.length > LIMIT.remarks) return { error: `備考は${LIMIT.remarks}文字までです` }
  const departmentCode = text(b.department_code, 10)
  if (departmentCode && !/^\d{3}$/.test(departmentCode)) return { error: "部門コードは数字3桁で入力してください" }

  // 申請のときだけ必須チェック（下書きは未入力でもよい）
  if (submit) {
    if (!purpose) return { error: "使途内容を入力してください" }
    if (subtotal <= 0) return { error: "小計が0円です。金額を入力してください" }
  }

  return {
    value: {
      dateText,
      slipDate: toDate(dateText),
      departmentCode,
      departmentName: text(b.department_name, 100),
      meal: {
        purpose: purpose || null,
        remarks: remarks || null,
        items,
        subtotal,
        advance_amount: advance,
        shortage_amount: shortage,
        balance_amount: balance,
      },
    },
  }
}
