// BPMS（開発営業管理。service="dev"）の履歴。既存の監査ログ（audit_logs）に記録する。
// 項目名の対応表は、画面（新規登録画面）のラベルに合わせている。

import { createAuditLog } from "@/lib/audit"
import { diffFields } from "@/lib/history-diff"

export const DEV_COMPANY_LABELS: Record<string, string> = {
  name: "会社名",
  nameKana: "会社名（カナ）",
  industry: "業種",
  status: "ステータス",
  postalCode: "郵便番号",
  address: "住所",
  phone: "電話番号",
  url: "WebサイトURL",
  notes: "備考",
}

export const DEV_PROJECT_LABELS: Record<string, string> = {
  title: "案件名",
  status: "ステータス",
  primaryCompanyName: "主担当会社",
  expectedOrderDate: "受注予定日",
  estimatedAmount: "見積金額（円）",
  orderedAmount: "受注金額（円）",
  description: "内容",
  notes: "備考",
}

export const DEV_EXHIBITION_LABELS: Record<string, string> = {
  name: "展示会名",
  location: "開催場所",
  startDate: "開始日",
  endDate: "終了日",
  description: "説明",
  summary: "サマリー",
  notes: "備考",
}

export const DEV_COMPANY_TYPE_MASTER_LABELS: Record<string, string> = {
  name: "種別名",
  description: "説明",
  sortOrder: "表示順",
}

type Base = { userId?: string | null; targetModel: string; targetId: string; targetLabel: string }

export async function logDevCreate(p: Base & { classification?: string }) {
  const { classification, ...rest } = p
  await createAuditLog({ ...rest, service: "dev", action: "CREATE", diff: { classification: classification ?? "新規" } })
}

// 変更した項目がないときは、記録しない
export async function logDevUpdate(
  p: Base & { before: Record<string, unknown>; after: Record<string, unknown>; labels: Record<string, string>; classification?: string },
) {
  const changedFields = diffFields(p.before, p.after, p.labels)
  if (changedFields.length === 0) return
  await createAuditLog({
    userId: p.userId, service: "dev", action: "UPDATE",
    targetModel: p.targetModel, targetId: p.targetId, targetLabel: p.targetLabel,
    diff: { classification: p.classification ?? "編集", changedFields },
  })
}

// 一括インポートは、行ごとの記録ではなく、1回につき1件の記録にまとめる（件数だけ残す）
export async function logDevImportSummary(p: { userId?: string | null; targetModel: string; targetLabel: string; created: number; updated: number }) {
  await createAuditLog({
    userId: p.userId, service: "dev", action: "UPDATE",
    targetModel: p.targetModel, targetId: "IMPORT", targetLabel: p.targetLabel,
    diff: { classification: "インポート", created: p.created, updated: p.updated },
  })
}

// 全件削除は、種別ごとの記録ではなく、1件の記録にまとめる
export async function logDevDeleteAll(p: { userId?: string | null; targetModel: string; targetLabel: string; count: number }) {
  await createAuditLog({
    userId: p.userId, service: "dev", action: "DELETE",
    targetModel: p.targetModel, targetId: "ALL", targetLabel: p.targetLabel,
    diff: { classification: "全件削除", count: p.count },
  })
}

export async function logDevDelete(p: Base) {
  await createAuditLog({ ...p, service: "dev", action: "DELETE", diff: { classification: "削除" } })
}
