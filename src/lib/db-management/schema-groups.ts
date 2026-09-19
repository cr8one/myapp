// DB管理機能：どのテーブルをどのサービスに属させるかの定義。
// ここに載っているテーブル名だけが、DB管理画面からのSQL操作対象として許可される（allowlist）。

export type DbTableInfo = {
  tableName: string // 実テーブル名（Postgres上の名前。@@mapがない場合はPrisma標準名）
  label: string      // 画面表示用の日本語名
}

export type DbServiceGroup = {
  key: string
  label: string
  tables: DbTableInfo[]
}

export const DB_SERVICE_GROUPS: DbServiceGroup[] = [
  {
    key: "dlms",
    label: "DLMS（抜型管理）",
    tables: [
      { tableName: "dlms_dieline_parents", label: "抜型親" },
      { tableName: "dlms_dieline_conditions", label: "抜型条件" },
      { tableName: "dlms_dieline_children", label: "抜型子" },
      { tableName: "dlms_dieline_requests", label: "抜型使用依頼" },
      { tableName: "dlms_dieline_parts", label: "抜型パーツ" },
      { tableName: "dlms_format_masters", label: "書式マスタ" },
      { tableName: "dlms_part_masters", label: "パーツマスタ" },
      { tableName: "dlms_note_masters", label: "注記マスタ" },
      { tableName: "m_dlms_type_conditions", label: "型種別条件マスタ" },
      { tableName: "t_drawings", label: "図面" },
      { tableName: "t_shelf_stocks", label: "棚卸在庫" },
    ],
  },
  {
    key: "cad",
    label: "CAD",
    tables: [
      { tableName: "t_cad_requests", label: "CAD依頼" },
      { tableName: "t_cad_request_files", label: "CAD依頼添付ファイル" },
      { tableName: "m_cad_clients", label: "CAD得意先マスタ" },
      { tableName: "m_cad_contents", label: "CAD内容マスタ" },
      { tableName: "m_cad_options", label: "CADオプションマスタ" },
      { tableName: "m_cad_mail_recipients", label: "CADメール宛先マスタ" },
      { tableName: "m_cad_mail_templates", label: "CADメールテンプレート" },
      { tableName: "m_cad_papers", label: "CAD用紙マスタ" },
      { tableName: "t_dxf_requests", label: "DXF依頼" },
      { tableName: "t_daishi_db", label: "台紙DB" },
      { tableName: "t_daishi_tags", label: "台紙タグ" },
      { tableName: "t_cad_work_logs", label: "CAD作業記録" },
    ],
  },
  {
    key: "terminal",
    label: "端末管理",
    tables: [
      { tableName: "t_devices", label: "端末" },
      { tableName: "t_device_ips", label: "端末IP" },
      { tableName: "m_device_models", label: "端末機種マスタ" },
      { tableName: "m_vendors", label: "ベンダーマスタ" },
      { tableName: "m_terminal_masters", label: "端末マスタ" },
      { tableName: "m_software", label: "ソフトウェアマスタ" },
      { tableName: "t_device_remarks", label: "端末備考" },
      { tableName: "t_device_software", label: "端末ソフトウェア" },
      { tableName: "t_device_leases", label: "端末リース" },
    ],
  },
  {
    key: "eapp",
    label: "電子申請（EAPP）",
    tables: [
      { tableName: "t_tokui_credit_requests", label: "与信申請" },
      { tableName: "t_tokui_credit_request_approval_steps", label: "与信申請承認ステップ" },
      { tableName: "t_tokui_credit_request_files", label: "与信申請添付ファイル" },
      { tableName: "t_m_approval_routes", label: "承認ルートマスタ" },
      { tableName: "t_user_approver_settings", label: "個人別承認者設定" },
      { tableName: "t_ringi_requests", label: "稟議申請" },
      { tableName: "t_ringi_approval_steps", label: "稟議承認ステップ" },
      { tableName: "t_ringi_request_files", label: "稟議添付ファイル" },
    ],
  },
  {
    key: "dpp",
    label: "DPP（工程管理）",
    tables: [
      { tableName: "t_dpp_schedules", label: "工程スケジュール" },
      { tableName: "t_dpp_schedule_parts", label: "工程スケジュールパーツ" },
      { tableName: "t_dpp_kikan_template_snapshots", label: "既刊テンプレートスナップショット" },
      { tableName: "m_dpp_eigyo", label: "営業担当マスタ" },
      { tableName: "m_dpp_seihan", label: "製版担当マスタ" },
      { tableName: "t_dpp_schedule_archive", label: "工程スケジュール（旧データ）" },
      { tableName: "t_dpp_schedule_archive_parts", label: "工程スケジュールパーツ（旧データ）" },
      { tableName: "t_dpp_storage_ledger_entry", label: "保管台帳" },
    ],
  },
  {
    key: "ssss",
    label: "SSSS（印章支給）",
    tables: [
      { tableName: "seal_serial_configs", label: "印章シリアル採番設定" },
      { tableName: "seal_supply_companies", label: "印章支給先会社マスタ" },
      { tableName: "seal_supply_part_masters", label: "印章支給パーツマスタ" },
      { tableName: "seal_supplies", label: "印章支給" },
    ],
  },
  {
    key: "address-book",
    label: "住所録",
    tables: [
      { tableName: "t_address_book", label: "住所録" },
      { tableName: "t_address_book_contacts", label: "住所録連絡先" },
      { tableName: "t_address_book_change_requests", label: "住所録変更依頼" },
      { tableName: "t_address_book_change_request_items", label: "住所録変更依頼項目" },
      { tableName: "t_output_lists", label: "出力リスト" },
      { tableName: "t_output_list_items", label: "出力リスト項目" },
    ],
  },
  {
    key: "masters-users",
    label: "マスタ管理・ユーザー",
    tables: [
      { tableName: "User", label: "ユーザー" },
      { tableName: "user_permissions", label: "ユーザー権限" },
      { tableName: "user_departments", label: "ユーザー所属部署" },
      { tableName: "user_groups", label: "ユーザー所属グループ" },
      { tableName: "m_positions", label: "役職マスタ" },
      { tableName: "m_departments", label: "部署マスタ" },
      { tableName: "m_groups", label: "グループマスタ" },
      { tableName: "m_bases", label: "拠点マスタ" },
      { tableName: "m_eapp_system_staff", label: "電子申請システム担当者マスタ" },
    ],
  },
  {
    key: "prinser",
    label: "PRINSERマスタ",
    tables: [
      { tableName: "prinser_m_users", label: "PRINSERユーザー" },
      { tableName: "prinser_m_tokui", label: "PRINSER得意先" },
      { tableName: "prinser_m_tokui_nonyu", label: "PRINSER得意先納入先" },
      { tableName: "prinser_m_tray", label: "PRINSERトレイ" },
    ],
  },
  {
    key: "dev",
    label: "開発営業管理",
    tables: [
      { tableName: "dev_companies", label: "開発営業会社" },
      { tableName: "dev_projects", label: "開発営業案件" },
      { tableName: "dev_project_companies", label: "案件×会社" },
      { tableName: "dev_exhibitions", label: "展示会" },
      { tableName: "dev_exhibition_visitors", label: "展示会来場者" },
      { tableName: "dev_exhibition_contacts", label: "展示会名刺" },
      { tableName: "dev_company_contacts", label: "会社連絡先" },
      { tableName: "dev_company_type_masters", label: "会社種別マスタ" },
      { tableName: "dev_company_types", label: "会社×種別" },
      { tableName: "dev_project_assignees", label: "案件担当者" },
      { tableName: "dev_project_files", label: "案件添付ファイル" },
      { tableName: "dev_logs", label: "開発記録" },
    ],
  },
  {
    key: "spec-parts",
    label: "仕様・パーツ",
    tables: [
      { tableName: "Product", label: "製品" },
      { tableName: "Part", label: "パーツ" },
    ],
  },
  {
    key: "system",
    label: "システム",
    tables: [
      { tableName: "announcements", label: "お知らせ" },
      { tableName: "login_logs", label: "ログイン履歴" },
      { tableName: "audit_logs", label: "修正履歴" },
      { tableName: "t_db_management_notes", label: "DB管理備考（内部）" },
    ],
  },
]

// SQLに使う実テーブル名の許可リスト。ここに無い名前はクエリを組み立てない。
export const ALLOWED_TABLE_NAMES = new Set(
  DB_SERVICE_GROUPS.flatMap(group => group.tables.map(t => t.tableName))
)

export function findTableLabel(tableName: string): string | undefined {
  for (const group of DB_SERVICE_GROUPS) {
    const found = group.tables.find(t => t.tableName === tableName)
    if (found) return found.label
  }
  return undefined
}
