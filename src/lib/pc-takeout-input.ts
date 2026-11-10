import { PC_ACCESSORIES, PC_SOFTWARE, PC_DESTINATIONS, PC_PLEDGE_LATEST, todayJst } from "@/lib/pc-takeout"

// PC持ち出し申請の入力チェック（新規作成・編集の両方で使う共通部品）。
// 下書きは緩く保存でき、申請（submit）のときだけ、必須の項目を確かめる。
// - 申請日は、画面の値を使わず、サーバーが今日（日本時間）に決める（日付を偽れないようにするため）
// - 申請のとき、持出期間の開始日は、今日以降に限る（事後の申請は、できない）
// - 申請のとき、厳守事項への同意（最新の版）が必須
// - 端末は、端末の番号だけを受け取る（端末名とメーカー・型番は、APIが台帳から取る）
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
  destination: string | null
  period_start: Date | null
  period_end: Date | null
  device_id: number | null
  accessories: string[]
  software: string[]
  pledge: { version: number; at: Date } | null
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
  const today = todayJst()

  const reason = text(b.reason, 1000)

  const destination = text(b.destination, 20)
  if (destination && !(PC_DESTINATIONS as readonly string[]).includes(destination)) {
    return { error: "持出先が正しくありません" }
  }

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

  const acc = pickList(b.accessories, PC_ACCESSORIES, "付属品")
  if ("error" in acc) return { error: acc.error }
  const soft = pickList(b.software, PC_SOFTWARE, "必要ソフト")
  if ("error" in soft) return { error: soft.error }

  let pledge: PcTakeoutData["pledge"] = null
  if (submit) {
    if (!reason) return { error: "申請理由を入力してください" }
    if (!destination) return { error: "持出先を選んでください" }
    if (!startText || !endText) return { error: "持出期間を入力してください" }
    if (startText < today) return { error: "持出期間の開始日は、今日以降にしてください（事後の申請は、できません）" }
    if (deviceId === null) return { error: "持ち出すPCを選んでください" }
    if (b.pledge_agreed !== true) return { error: "厳守事項に同意するにチェックを入れてください" }
    if (Number(b.pledge_version) !== PC_PLEDGE_LATEST.version) {
      return { error: "厳守事項が更新されました。画面を読み込み直して、内容を確認し、もう一度同意してください" }
    }
    pledge = { version: PC_PLEDGE_LATEST.version, at: new Date() }
  }

  return {
    value: {
      request_date: toDate(today),
      department_name: text(b.department_name, 100) || null,
      reason,
      destination: destination || null,
      period_start: startText ? toDate(startText) : null,
      period_end: endText ? toDate(endText) : null,
      device_id: deviceId,
      accessories: acc.list,
      software: soft.list,
      pledge,
    },
  }
}
