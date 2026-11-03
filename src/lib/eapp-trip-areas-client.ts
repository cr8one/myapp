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
