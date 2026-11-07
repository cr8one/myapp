// 履歴（監査ログ）に残す「変更した項目の、前後の値」を作る汎用の部品。
// 項目名の対応表（DBの項目名 → 画面での名前）をモデルごとに渡して使う。
// サーバー・ブラウザの両方から使えるよう、"use client" は付けない。

export type ChangedField = { field: string; label: string; before: string; after: string }

const EMPTY = "（空）"

const pad = (n: number) => String(n).padStart(2, "0")

// 値を、履歴に出す文字列にする。空は「（空）」、日付は YYYY/MM/DD、それ以外は文字列にする
export function formatHistoryValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return EMPTY
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return EMPTY
    return `${v.getFullYear()}/${pad(v.getMonth() + 1)}/${pad(v.getDate())}`
  }
  if (typeof v === "boolean") return v ? "はい" : "いいえ"
  return String(v)
}

// 変更前と変更後を比べて、値が変わった項目だけを返す。対応表にない項目は比べない
export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  labels: Record<string, string>,
): ChangedField[] {
  const result: ChangedField[] = []
  for (const field of Object.keys(labels)) {
    const b = formatHistoryValue(before[field])
    const a = formatHistoryValue(after[field])
    if (b !== a) result.push({ field, label: labels[field], before: b, after: a })
  }
  return result
}
