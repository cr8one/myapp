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

// 持出期間は、原則最長1週間（現行の申請書の注記：勤務状況により要相談）。画面で警告を出すだけで、申請は止めない
export const PC_MAX_PERIOD_DAYS = 7

export const PC_NO_PREFIX = "TPC"
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

// 持出先（申請に必須。プルダウンで選ぶ）
export const PC_DESTINATIONS = ["自宅", "出張先", "客先", "海外", "その他"] as const

// 厳守事項と誓約文。申請のときに、同意のチェックを必須にし、同意した版の番号と日時を残す。
// 文面を変えるときは、古い版を消さずに、新しい版を末尾に足すこと（どの文言に同意したかを、後から追えるようにするため）
export type PcPledge = { version: number; intro: string[]; rules: string[] }
export const PC_PLEDGES: PcPledge[] = [
  {
    version: 1,
    intro: [
      "下記の理由により、会社所有のPCを社外にて使用いたしたく、ここに申請いたします。",
      "なお、持ち出しに際し、下記の厳守事項を遵守することを誓約します。",
    ],
    rules: [
      "持出中は、紛失、盗難、不正使用、破損などが生じないよう管理に万全を期すること。",
      "上記トラブルを発生した場合には、速やかに管理責任者および上司に申告すること。",
      "無断で、設定の変更やソフトウェアをインストールしないこと。",
      "申請者以外がPCを使用する場合は、必ず本人が同席し、使用状況を監視すること。",
      "個人情報を持ち出さないこと。",
      "指定されたネットワーク以外には接続しないこと。",
    ],
  },
]
export const PC_PLEDGE_LATEST: PcPledge = PC_PLEDGES[PC_PLEDGES.length - 1]

// 今日の日付（日本時間）。YYYY-MM-DD。サーバーは世界標準時で動くので、日本時間に直す
export const todayJst = (): string => new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
