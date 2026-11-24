// ロット別の単価表の、行の探し方（取り込み済みの基準と同じ形：開始〜終了、終了が null なら上限なし）
export interface PriceTier {
  from: number
  to: number | null
  value: number | null
  lump?: boolean // 一式（または固定値）の印。基準で、セルごとに持つ
}

export function findTier(tiers: PriceTier[] | undefined, q: number | null): PriceTier | null {
  if (!tiers || q === null) return null
  for (const t of tiers) if (t.from <= q && (t.to === null || q <= t.to)) return t
  return null
}

export function findTierValue(tiers: PriceTier[] | undefined, q: number | null): number | null {
  return findTier(tiers, q)?.value ?? null
}