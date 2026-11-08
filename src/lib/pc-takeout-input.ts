import { PC_ACCESSORIES, PC_SOFTWARE } from "@/lib/pc-takeout"

// PC持ち出し申請の入力チェック（新規作成・編集の両方で使う共通部品）。
// 下書きは緩く保存でき、申請（submit）のときだけ、必須の項目を確かめる。
// 持出期間が7日を超えても、エラーにはしない（原則であり、勤務状況により要相談のため。画面で警告を出す）。

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const toDate = (s: string) => new Date(`${s}T00:00:00.000Z`)
const validDate = (s: string) => DATE_RE.test(s) && !isNaN(toDate(s).getTime())
const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max)
const blank = (v: unknown) => v === undefined || v === null || String(v).trim() === ""

export type PcTakeoutData = {
  request_date: Date
  department_name: string | null
  reason: string
  period_start: Date | null
  period_end: Date | null
  device_id: number | null
  device_name: string | null
  model_label: string | null
  accessories: string[]
  software: string[]
}

function pickList(raw: unknown, allowed: readonly string[], label: string): { error: string } | { list: string[] } {
  if (raw === undefined || raw === null) return { list: [] }
  if (!Array.isArray(raw)) return { error: `${label}の形式が正しくありません` }
  const list: string[] = []
  for (const v of raw) {
    const s = String(v)
    if (!allowed.includes(s)) return { error: `${label}に、選択肢にない項目が含まれています` }
    if (!list.includes(s)) list.push(s)
  }
  return { list }
}

export function parsePcTakeout(b: any, submit: boolean): { error: string } | { value: PcTakeoutData } {
  const dateText = String(b.request_date ?? "")
  if (!validDate(dateText)) return { error: "申請日を入力してください" }

  const reason = text(b.reason, 1000)

  const startText = blank(b.period_start) ? "" : String(b.period_start)
  const endText = blank(b.period_end) ? "" : String(b.period_end)
  if (startText && !validDate(startText)) return { error: "持出期間の開始日が正しくありません" }
  if (endText && !validDate(endText)) return { error: "持出期間の終了日が正しくありません" }
  if (startText && endText && endText < startText) return { error: "持出期間の終了日が、開始日より前になっています" }

  let deviceId: number | null = null
  if (!blank(b.device_id)) {
    const n = Number(b.device_id)
    if (!Number.isInteger(n)) return { error: "端末の指定が正しくありません" }
    deviceId = n
  }
  const deviceName = text(b.device_name, 100)
  const modelLabel = text(b.model_label, 200)

  const acc = pickList(b.accessories, PC_ACCESSORIES, "付属品")
  if ("error" in acc) return { error: acc.error }
  const soft = pickList(b.software, PC_SOFTWARE, "必要ソフト")
  if ("error" in soft) return { error: soft.error }

  if (submit) {
    if (!reason) return { error: "申請理由を入力してください" }
    if (!startText || !endText) return { error: "持出期間を入力してください" }
    if (!deviceName) return { error: "PC管理番号を入力してください" }
  }

  return {
    value: {
      request_date: toDate(dateText),
      department_name: text(b.department_name, 100) || null,
      reason,
      period_start: startText ? toDate(startText) : null,
      period_end: endText ? toDate(endText) : null,
      device_id: deviceId,
      device_name: deviceName || null,
      model_label: modelLabel || null,
      accessories: acc.list,
      software: soft.list,
    },
  }
}
