// 出張旅費精算書の「現地滞在時間」と「日当」の自動計算（サーバー・ブラウザの両方から使えるよう、"use client" は付けない）
// 根拠：出張旅費規定（国内）第4条・第9条、海外旅費規程第8条

type DateTimeRow = { date: string; time: string }

// 現地滞在時間（分）。現地到着と現地出発の、日付と時刻がそろっていて、出発が到着より後のときだけ値を返す
export function stayMinutes(dates: DateTimeRow[]): number | null {
  const [arrive, depart] = dates
  if (!arrive || !depart) return null
  if (!arrive.date || !arrive.time || !depart.date || !depart.time) return null
  const ta = new Date(`${arrive.date}T${arrive.time}:00`).getTime()
  const td = new Date(`${depart.date}T${depart.time}:00`).getTime()
  if (isNaN(ta) || isNaN(td) || td < ta) return null
  return Math.round((td - ta) / 60000)
}

export const stayText = (minutes: number): string => `${Math.floor(minutes / 60)}時間${minutes % 60}分`

export type AllowanceResult =
  | { ok: true; days: number; amount: number; note: string }
  | { ok: false; message: string }

// 現地到着日から現地出発日までの日数（両端を含む）
const dayCount = (a: string, b: string): number =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000) + 1

const yen = (n: number) => n.toLocaleString("ja-JP") + "円"

export function calcAllowance(dates: DateTimeRow[], areaClass: string | null): AllowanceResult {
  const [arrive, depart] = dates
  if (!areaClass) {
    return { ok: false, message: "出張区域が未入力か、その区域の日当の区分が未設定のため、自動入力できません（電子申請マスタの「出張区域」で区分を設定してください）" }
  }
  if (!arrive?.date || !depart?.date) {
    return { ok: false, message: "現地到着と現地出発の日付を入力してください" }
  }
  const days = dayCount(arrive.date, depart.date)
  if (isNaN(days) || days < 1) {
    return { ok: false, message: "現地出発の日付が、現地到着より前になっています" }
  }

  // 海外：日数 × 1日あたりの日当（A地区10,000円、B地区8,000円）
  if (areaClass === "overseas_a") return { ok: true, days, amount: days * 10000, note: `海外A地区：${days}日 × ${yen(10000)}` }
  if (areaClass === "overseas_b") return { ok: true, days, amount: days * 8000, note: `海外B地区：${days}日 × ${yen(8000)}` }

  if (areaClass !== "domestic_base" && areaClass !== "domestic_other") {
    return { ok: false, message: "この区域の日当の区分が正しくありません" }
  }

  // 国内で2日以上：日数 × 3,000円（第9条）
  if (days >= 2) return { ok: true, days, amount: days * 3000, note: `国内：${days}日 × ${yen(3000)}` }

  // 国内の日帰り（第4条の表）
  if (!arrive.time || !depart.time) {
    return { ok: false, message: "日帰りの日当は、現地到着と現地出発の時刻から決めます。時刻を入力してください" }
  }
  const mins = stayMinutes(dates)
  if (mins === null) return { ok: false, message: "現地出発の時刻が、現地到着より前になっています" }

  if (areaClass === "domestic_base") {
    // JS生産本部・イシイ印刷埼玉工場：現地滞在6時間以上、または現地出発が19時以降なら1,500円
    if (mins >= 360 || depart.time >= "19:00") {
      return { ok: true, days: 1, amount: 1500, note: `日帰り（JS生産本部・埼玉工場）：現地滞在${stayText(mins)}、現地出発${depart.time} → ${yen(1500)}` }
    }
    return { ok: true, days: 1, amount: 0, note: `日帰り（JS生産本部・埼玉工場）：現地滞在${stayText(mins)}（6時間未満）、現地出発${depart.time}（19時前）のため、日当なし` }
  }

  // その他の国内：午前中の到着なら3,000円、午後なら1,500円
  if (arrive.time < "12:00") return { ok: true, days: 1, amount: 3000, note: `日帰り（その他の国内）：現地到着${arrive.time}（午前中）→ ${yen(3000)}` }
  return { ok: true, days: 1, amount: 1500, note: `日帰り（その他の国内）：現地到着${arrive.time}（午後）→ ${yen(1500)}` }
}
