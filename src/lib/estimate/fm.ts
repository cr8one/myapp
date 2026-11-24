// FileMakerの計算と同じ丸め方。FileMakerは10進数で正確に計算するため、2進数の小数の誤差を、先に消してから丸める。

// 有効数字15桁にそろえて、2進数の誤差（19.8 が 19.799999999999997 になるなど）を消す
export const snap = (x: number): number => Number(x.toPrecision(15))

// 四捨五入（0から遠い方へ丸める）。digits は小数点以下の桁数
export function fmRound(x: number, digits = 0): number {
  const f = 10 ** digits
  const v = snap(Math.abs(x) * f)
  const r = Math.floor(v + 0.5) / f
  return x < 0 ? -r : r
}

// 切り捨て（0に近い方へ）
export function fmTruncate(x: number, digits = 0): number {
  const f = 10 ** digits
  const v = snap(Math.abs(x) * f)
  const r = Math.floor(v) / f
  return x < 0 ? -r : r
}

export const fmInt = (x: number): number => fmTruncate(x, 0)

// 文字の中の最初の数字を読む（FileMakerと同じ。「2面」→2、「各1面」→1）。数字がなければ null
export function numIn(v: unknown): number | null {
  if (v === null || v === undefined) return null
  if (typeof v === "number") return Number.isFinite(v) ? v : null
  const m = String(v).normalize("NFKC").replace(/,/g, "").match(/-?\d+(\.\d+)?/)
  return m ? Number(m[0]) : null
}

// 名前の照合用（半角・全角、空白の違いをそろえる）
export const normName = (s: unknown): string =>
  s === null || s === undefined ? "" : String(s).normalize("NFKC").replace(/\s+/g, " ").trim()