// 経理精算の書類の種類と状態の定義（画面・API共通）。画面専用の部品は含めない。
export const SLIP_TYPES = [
  {
    value: "trip_expense",
    label: "出張旅費精算書",
    description: "出張の交通費・宿泊費・日当の精算",
    href: "/dashboard/eapp/accounting/new/trip-expense",
    // 経理側の承認者（電子申請マスタ）のサービス名
    routeServiceType: "accounting_trip_expense",
  },
] as const

export const SLIP_STATUSES = ["下書き", "起案部承認中", "経理承認中", "承認完了"] as const

export function slipTypeLabel(value: string): string {
  return SLIP_TYPES.find(t => t.value === value)?.label ?? value
}

export function statusBadgeClass(status: string): string {
  switch (status) {
    case "下書き": return "bg-gray-100 text-gray-600"
    case "起案部承認中": return "bg-amber-50 text-amber-700"
    case "経理承認中": return "bg-blue-50 text-blue-700"
    case "承認完了": return "bg-green-50 text-green-700"
    default: return "bg-gray-100 text-gray-600"
  }
}
