// 出張区域の「日当の区分」。出張旅費規定（国内）第4条に対応する（国内限定。海外出張は対象外）。
// サーバー・ブラウザの両方から使うので、"use client" は付けない。

export const ALLOWANCE_CLASSES = [
  { value: "domestic_base", label: "JS生産本部・イシイ印刷埼玉工場" },
  { value: "domestic_other", label: "その他の出張" },
] as const

export type AllowanceClass = (typeof ALLOWANCE_CLASSES)[number]["value"]

export const isAllowanceClass = (v: unknown): v is AllowanceClass =>
  ALLOWANCE_CLASSES.some(c => c.value === v)

export const allowanceClassLabel = (v: string | null | undefined): string =>
  ALLOWANCE_CLASSES.find(c => c.value === v)?.label ?? ""
