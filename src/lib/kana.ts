// ひらがな → カタカナ（フリガナの保存用）
export function toKatakana(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60))
}

// フリガナの正規化と検証
// - 前後の空白を除き、連続する空白（全角含む）は半角スペース1つにする
// - ひらがなはカタカナに変換する
// - カタカナ・長音（ー）・半角スペース以外が含まれていたら不正（ok: false）
// - 空・未指定は「値なし」（ok: true, value: null）
export function normalizeFurigana(input: unknown): { ok: true; value: string | null } | { ok: false } {
  if (input === null || input === undefined) return { ok: true, value: null }
  if (typeof input !== "string") return { ok: false }
  const s = toKatakana(input.trim().replace(/[\s\u3000]+/g, " "))
  if (s === "") return { ok: true, value: null }
  if (!/^[\u30a1-\u30f6\u30fc ]+$/.test(s)) return { ok: false }
  return { ok: true, value: s }
}
