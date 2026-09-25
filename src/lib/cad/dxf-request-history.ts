// DXF変換依頼書の履歴機能：フィールド名→日本語ラベル、値のフォーマット、差分抽出

export const DXF_REQUEST_FIELD_LABELS: Record<string, string> = {
  id_cad: "CAD依頼書No",
  request_date: "依頼日",
  request_time: "依頼時刻",
  desired_date: "希望納期日",
  desired_time: "希望納期時刻",
  purpose: "目的",
  worker: "作業担当",
  status: "ステータス",
  remarks: "備考",
  daishi_desired_date: "台紙希望納期日",
  daishi_desired_time: "台紙希望納期時刻",
  daishi_remarks: "備考（台紙依頼）",
}

function formatFieldValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—"
  if (field === "request_date" || field === "desired_date") {
    const d = new Date(value as string)
    if (!isNaN(d.getTime())) return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
  }
  return String(value)
}

export type ChangedField = { field: string; label: string; before: string; after: string }

export function diffDxfRequestFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): ChangedField[] {
  const changed: ChangedField[] = []
  for (const [field, label] of Object.entries(DXF_REQUEST_FIELD_LABELS)) {
    const b = formatFieldValue(field, before[field])
    const a = formatFieldValue(field, after[field])
    if (b !== a) {
      changed.push({ field, label, before: b, after: a })
    }
  }
  return changed
}