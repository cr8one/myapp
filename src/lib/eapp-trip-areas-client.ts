// 出張区域の候補（電子申請マスタの「出張区域」）。入力画面の候補に使う。失敗したときは、候補なしで続ける
export async function fetchTripAreaNames(): Promise<string[]> {
  try {
    const res = await fetch("/api/eapp/trip-areas")
    if (!res.ok) return []
    const data = await res.json()
    return (data.areas ?? []).map((a: { name: string }) => a.name)
  } catch {
    return []
  }
}

// 名前に加えて、日当の区分も返す（日当の自動計算に使う）。区分が未設定の区域は、allowance_class が null
export type TripAreaOption = { name: string; allowance_class: string | null }

export async function fetchTripAreas(): Promise<TripAreaOption[]> {
  try {
    const res = await fetch("/api/eapp/trip-areas")
    if (!res.ok) return []
    const data = await res.json()
    return (data.areas ?? []).map((a: { name: string; allowance_class?: string | null }) => ({
      name: a.name,
      allowance_class: a.allowance_class ?? null,
    }))
  } catch {
    return []
  }
}
