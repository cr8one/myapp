// 出張区域の「日当の区分」。出張旅費規定（国内）第4条と、海外旅費規定第3条・第8条に対応する。
// サーバー・ブラウザの両方から使うので、"use client" は付けない。

export const ALLOWANCE_CLASSES = [
  { value: "domestic_base", label: "JS生産本部・イシイ印刷埼玉工場" },
  { value: "domestic_other", label: "その他の国内" },
  { value: "overseas_a", label: "海外A地区（北米・欧州）" },
  { value: "overseas_b", label: "海外B地区（A地区以外）" },
] as const

export type AllowanceClass = (typeof ALLOWANCE_CLASSES)[number]["value"]

export const isAllowanceClass = (v: unknown): v is AllowanceClass =>
  ALLOWANCE_CLASSES.some(c => c.value === v)

export const allowanceClassLabel = (v: string | null | undefined): string =>
  ALLOWANCE_CLASSES.find(c => c.value === v)?.label ?? ""
