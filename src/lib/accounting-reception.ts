// 御得意先接待承認書の入力チェック（新規作成・編集の両方で使う共通部品）。
// 実際額は、承認が完了したあとに、申請者が別のAPIで記録する。ここでは扱わない。

import { LIMIT } from "@/lib/accounting-reception-layout"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const toDate = (s: string) => new Date(`${s}T00:00:00.000Z`)
const validDate = (s: string) => DATE_RE.test(s) && !isNaN(toDate(s).getTime())
const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max)
const blank = (v: unknown) => v === undefined || v === null || String(v).trim() === ""
const parseNum = (v: unknown): number | null => {
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 && n <= 99999999 ? n : null
}

export type ReceptionData = {
  client_name: string | null
  contact_name: string | null
  reception_date: Date | null
  content: string | null
  place: string | null
  reason: string | null
  budget_amount: number
  advance_needed: boolean
}

export type ParsedReception = {
  dateText: string
  slipDate: Date
  departmentCode: string
  departmentName: string
  reception: ReceptionData
}

export function parseReception(b: any, submit: boolean): { error: string } | { value: ParsedReception } {
  const dateText = String(b.slip_date ?? "")
  if (!validDate(dateText)) return { error: "提出日を入力してください" }

  const clientName = text(b.client_name, 1000)
  const contactName = text(b.contact_name, 1000)
  const content = text(b.content, 5000)
  const place = text(b.place, 5000)
  const reason = text(b.reason, 5000)
  if (clientName.length > LIMIT.client) return { error: `得意先名は${LIMIT.client}文字までです` }
  if (contactName.length > LIMIT.contact) return { error: `氏名は${LIMIT.contact}文字までです` }
  if (content.length > LIMIT.content) return { error: `内容は${LIMIT.content}文字までです` }
  if (place.length > LIMIT.place) return { error: `場所は${LIMIT.place}文字までです` }
  if (reason.length > LIMIT.reason) return { error: `理由は${LIMIT.reason}文字までです` }

  const receptionText = text(b.reception_date, 10)
  if (receptionText && !validDate(receptionText)) return { error: "接待日が正しくありません" }

  const budget = blank(b.budget_amount) ? 0 : parseNum(b.budget_amount)
  if (budget === null) return { error: "予算額が正しくありません" }

  const departmentCode = text(b.department_code, 10)
  if (departmentCode && !/^\d{3}$/.test(departmentCode)) return { error: "部門コードは数字3桁で入力してください" }

  // 申請のときだけ必須チェック（下書きは未入力でもよい）。得意先の氏名は、会社が相手の場合など、ないことがあるので、必須にしない
  if (submit) {
    if (!clientName) return { error: "得意先名を入力してください" }
    if (!receptionText) return { error: "接待日を入力してください" }
    if (!content) return { error: "内容を入力してください" }
    if (!place) return { error: "場所を入力してください" }
    if (!reason) return { error: "理由を入力してください" }
    if (budget <= 0) return { error: "予算額を入力してください" }
  }

  return {
    value: {
      dateText,
      slipDate: toDate(dateText),
      departmentCode,
      departmentName: text(b.department_name, 100),
      reception: {
        client_name: clientName || null,
        contact_name: contactName || null,
        reception_date: receptionText ? toDate(receptionText) : null,
        content: content || null,
        place: place || null,
        reason: reason || null,
        budget_amount: budget,
        advance_needed: b.advance_needed === true,
      },
    },
  }
}
