export type MailCategory =
  | "cad_request"
  | "dxf_request_daishi"
  | "dxf_request_type"
  | "dxf_complete_daishi"
  | "dxf_complete_type"

export const MAIL_CATEGORIES: { key: MailCategory; label: string }[] = [
  { key: "cad_request", label: "CAD依頼用" },
  { key: "dxf_request_daishi", label: "DXF変換依頼用（台紙データ作成）" },
  { key: "dxf_request_type", label: "DXF変換依頼用（抜き型データとして）" },
  { key: "dxf_complete_daishi", label: "DXF変換完了用（台紙データ作成）" },
  { key: "dxf_complete_type", label: "DXF変換完了用（抜き型データとして）" },
]

export function dxfRequestMailCategory(purpose: string | null): MailCategory {
  return purpose === "抜き型データとして使用" ? "dxf_request_type" : "dxf_request_daishi"
}

export function dxfCompleteMailCategory(purpose: string | null): MailCategory {
  return purpose === "抜き型データとして使用" ? "dxf_complete_type" : "dxf_complete_daishi"
}