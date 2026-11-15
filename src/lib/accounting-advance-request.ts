// 仮払金請求受領書の、請求の入力チェックと金額の整理（新規作成・編集の両方で使う共通部品）。
// 支払と受領の記録は、別のAPIで扱う。ここでは、請求の項目だけを扱う。

import { LIMIT } from "@/lib/accounting-advance-request-layout"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const toDate = (s: string) => new Date(`${s}T00:00:00.000Z`)
const validDate = (s: string) => DATE_RE.test(s) && !isNaN(toDate(s).getTime())
const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max)
const blank = (v: unknown) => v === undefined || v === null || String(v).trim() === ""
const parseNum = (v: unknown): number | null => {
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 && n <= 99999999 ? n : null
}

export type AdvanceRequestData = {
  purpose: string | null
  due_date: Date | null
  advance_amount: number
}

export type ParsedAdvance = {
  dateText: string
  slipDate: Date
  departmentCode: string
  departmentName: string
  advance: AdvanceRequestData
}

export function parseAdvanceRequest(b: any, submit: boolean): { error: string } | { value: ParsedAdvance } {
  const dateText = String(b.slip_date ?? "")
  if (!validDate(dateText)) return { error: "日付を入力してください" }

  const dueText = text(b.due_date, 10)
  if (dueText && !validDate(dueText)) return { error: "精算予定日が正しくありません" }

  const amount = blank(b.advance_amount) ? 0 : parseNum(b.advance_amount)
  if (amount === null) return { error: "仮払金額が正しくありません" }

  const purpose = text(b.purpose, 5000)
  if (purpose.length > LIMIT.purpose) return { error: `使途内容は${LIMIT.purpose}文字までです` }

  const departmentCode = text(b.department_code, 10)
  if (departmentCode && !/^\d{3}$/.test(departmentCode)) return { error: "部門コードは数字3桁で入力してください" }

  // 申請のときだけ必須チェック（下書きは未入力でもよい）
  if (submit) {
    if (!purpose) return { error: "使途内容を入力してください" }
    if (!dueText) return { error: "精算予定日を入力してください" }
    if (amount <= 0) return { error: "仮払金額を入力してください" }
  }

  return {
    value: {
      dateText,
      slipDate: toDate(dateText),
      departmentCode,
      departmentName: text(b.department_name, 100),
      advance: {
        purpose: purpose || null,
        due_date: dueText ? toDate(dueText) : null,
        advance_amount: amount,
      },
    },
  }
}
