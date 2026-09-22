// CAD依頼書の履歴機能：フィールド名→日本語ラベル、値のフォーマット、差分抽出

export const CAD_REQUEST_FIELD_LABELS: Record<string, string> = {
  request_date: "依頼日",
  request_time: "依頼時刻",
  requester_name: "依頼営業名",
  department: "依頼部署",
  content: "依頼内容",
  client: "クライアント",
  title: "タイトル",
  genre: "ジャンル",
  hinmoku: "品目名",
  hinban: "品番",
  status: "ステータス",
  dieline_no: "型台帳番号",
  develop_y: "展開寸法(縦)",
  develop_x: "展開寸法(横)",
  paper: "用紙",
  finish_count: "仕上個数",
  finish_count_note: "仕上個数備考",
  desired_date: "希望納期日",
  desired_time: "希望納期時刻",
  flg_tray_spec: "トレイ仕様",
  tray: "使用トレイ",
  degi_spec: "デジ仕様",
  tray_count: "トレイ枚数",
  pocket: "ポケット",
  remarks: "詳細記入欄",
}

function formatFieldValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—"
  if (field === "flg_tray_spec") return value ? "あり" : "なし"
  if (field === "request_date" || field === "desired_date") {
    const d = new Date(value as string)
    if (!isNaN(d.getTime())) return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
  }
  return String(value)
}

export type ChangedField = { field: string; label: string; before: string; after: string }

export function diffCadRequestFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): ChangedField[] {
  const changed: ChangedField[] = []
  for (const [field, label] of Object.entries(CAD_REQUEST_FIELD_LABELS)) {
    const b = formatFieldValue(field, before[field])
    const a = formatFieldValue(field, after[field])
    if (b !== a) {
      changed.push({ field, label, before: b, after: a })
    }
  }
  return changed
}
