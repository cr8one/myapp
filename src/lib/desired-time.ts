export const DESIRED_TIME_KBN_OPTIONS = [
  { value: 0, label: "未指定" },
  { value: 1, label: "時刻指定" },
  { value: 2, label: "AM" },
  { value: 3, label: "PM" },
  { value: 4, label: "中" },
]

// ソート用の代表値（"HH:MM"形式の文字列）。kbn=0（未指定）はnull（ソート時は最後尾扱い）。
export function desiredTimeSortKey(kbn: number, time: string | null): string | null {
  switch (kbn) {
    case 1: return time || null
    case 2: return "12:01"
    case 3: return "18:01"
    case 4: return "23:59"
    default: return null
  }
}

// エクスポートCSV（AM/PM/中/HH:MM表記）の再取り込み用パーサー
export function parseDesiredTimeLabel(s: string | null | undefined): { kbn: number; time: string | null } {
  const v = (s ?? "").trim()
  if (v === "AM") return { kbn: 2, time: null }
  if (v === "PM") return { kbn: 3, time: null }
  if (v === "中") return { kbn: 4, time: null }
  if (/^\d{1,2}:\d{2}$/.test(v)) return { kbn: 1, time: v }
  return { kbn: 0, time: null }
}

// 一覧・PDF等の表示用ラベル
export function desiredTimeLabel(kbn: number, time: string | null): string {
  switch (kbn) {
    case 1: return time || ""
    case 2: return "AM"
    case 3: return "PM"
    case 4: return "中"
    default: return ""
  }
}
