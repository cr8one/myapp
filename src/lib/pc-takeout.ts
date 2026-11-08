// PC持ち出し申請（電子申請）の共通の定義。サーバー・ブラウザの両方から使えるよう、"use client" は付けない。

export const PC_STATUS_DRAFT = "下書き"
export const PC_STATUS_CONFIRMING = "確認中"
export const PC_STATUS_ISMS = "ISMS承認中"
export const PC_STATUS_COMPLETED = "承認完了"
export const PC_STATUS_RETURNED = "差戻し"
export const PC_STATUS_REJECTED = "却下"

export const PC_STATUSES = [
  PC_STATUS_DRAFT, PC_STATUS_CONFIRMING, PC_STATUS_ISMS, PC_STATUS_COMPLETED, PC_STATUS_RETURNED, PC_STATUS_REJECTED,
] as const

// 承認ステップの役割
export const PC_ROLE_CONFIRMER = "確認者"
export const PC_ROLE_ISMS = "ISMS責任者"

// ユーザーマスタの承認者設定（確認者）と、電子申請マスタの共通承認ルート（ISMS責任者）の service_type
export const PC_SERVICE_TYPE = "pc_takeout"

// 付属品・必要ソフトの選択肢（現行の申請書の項目。申請には、チェックした名前のリストを保存する）
export const PC_ACCESSORIES = ["バッテリー", "マウス"] as const
export const PC_SOFTWARE = ["Office365", "Remote View", "Teams", "メール設定"] as const

// 持出期間は、原則最長1週間（現行の申請書の注記：勤務状況により要相談）。画面で警告を出すだけで、申請は止めない
export const PC_MAX_PERIOD_DAYS = 7

export const PC_NO_PREFIX = "TOPC-"
export const formatPcRequestNo = (n: number) => `${PC_NO_PREFIX}${n}`

// 状態のバッジの色
export function pcStatusBadgeClass(status: string): string {
  switch (status) {
    case PC_STATUS_DRAFT: return "bg-gray-100 text-gray-600"
    case PC_STATUS_CONFIRMING: return "bg-amber-50 text-amber-700"
    case PC_STATUS_ISMS: return "bg-blue-50 text-blue-700"
    case PC_STATUS_COMPLETED: return "bg-green-50 text-green-700"
    case PC_STATUS_RETURNED: return "bg-orange-50 text-orange-700"
    case PC_STATUS_REJECTED: return "bg-red-50 text-red-700"
    default: return "bg-gray-100 text-gray-600"
  }
}
