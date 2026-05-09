"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

const COLUMNS = [
  { no: 1, field: "uid", type: "character varying(10)", notNull: true, pk: true, desc: "ユーザーID" },
  { no: 2, field: "upass", type: "character varying(10)", notNull: true, pk: false, desc: "パスワード" },
  { no: 3, field: "unm", type: "character varying(64)", notNull: true, pk: false, desc: "ユーザー名" },
  { no: 4, field: "ukana", type: "character varying(32)", notNull: true, pk: false, desc: "ユーザー名（カナ）" },
  { no: 5, field: "kencd", type: "numeric(2,0)", notNull: true, pk: false, desc: "権限コード" },
  { no: 6, field: "biko", type: "character varying(64)", notNull: false, pk: false, desc: "備考" },
  { no: 7, field: "ukbn", type: "numeric(1,0)", notNull: false, pk: false, desc: "ユーザー区分" },
  { no: 8, field: "ulevel", type: "smallint", notNull: false, pk: false, desc: "ユーザーレベル" },
  { no: 9, field: "listflg", type: "numeric(1,0)", notNull: true, pk: false, desc: "一覧表示フラグ" },
  { no: 10, field: "folder_dl", type: "character varying(256)", notNull: false, pk: false, desc: "フォルダDLパス" },
  { no: 11, field: "kanriuid", type: "character varying(10)", notNull: false, pk: false, desc: "管理UID" },
  { no: 12, field: "bumon_cd", type: "character varying(6)", notNull: false, pk: false, desc: "部門コード" },
  { no: 13, field: "ukbn_eigyo", type: "smallint", notNull: true, pk: false, default: "0", desc: "区分：営業" },
  { no: 14, field: "ukbn_koumu", type: "smallint", notNull: true, pk: false, default: "0", desc: "区分：工務" },
  { no: 15, field: "ukbn_prep", type: "smallint", notNull: true, pk: false, default: "0", desc: "区分：製版" },
  { no: 16, field: "ukbn_press", type: "smallint", notNull: true, pk: false, default: "0", desc: "区分：印刷" },
  { no: 17, field: "ukbn_kako", type: "smallint", notNull: true, pk: false, default: "0", desc: "区分：加工" },
  { no: 18, field: "ukbn_gaichu", type: "smallint", notNull: true, pk: false, default: "0", desc: "区分：外注" },
  { no: 19, field: "ukbn_yoshi", type: "smallint", notNull: true, pk: false, default: "0", desc: "区分：用紙" },
  { no: 20, field: "ukbn_haiso", type: "smallint", notNull: true, pk: false, default: "0", desc: "区分：配送" },
  { no: 21, field: "ukbn_sappan", type: "smallint", notNull: true, pk: false, default: "0", desc: "区分：刷版" },
  { no: 22, field: "ukbn_dansai", type: "smallint", notNull: true, pk: false, default: "0", desc: "区分：断裁" },
  { no: 23, field: "ukbn_koujyo", type: "smallint", notNull: true, pk: false, default: "0", desc: "区分：工場" },
  { no: 24, field: "ukbn_cv", type: "smallint", notNull: true, pk: false, default: "0", desc: "区分：CV" },
  { no: 25, field: "ukbn_gehan", type: "smallint", notNull: true, pk: false, default: "0", desc: "区分：下版" },
  { no: 26, field: "utel", type: "character varying(20)", notNull: false, pk: false, desc: "電話番号" },
  { no: 27, field: "ufax", type: "character varying(20)", notNull: false, pk: false, desc: "FAX番号" },
  { no: 28, field: "umail", type: "character varying(30)", notNull: false, pk: false, desc: "メールアドレス" },
  { no: 29, field: "del_flg", type: "integer", notNull: true, pk: false, desc: "削除フラグ" },
  { no: 30, field: "dtindt", type: "character varying(8)", notNull: true, pk: false, default: "0", desc: "データ作成日" },
  { no: 31, field: "dtintm", type: "character varying(8)", notNull: true, pk: false, desc: "データ作成時間" },
  { no: 32, field: "dtupdt", type: "character varying(8)", notNull: true, pk: false, desc: "データ更新日" },
  { no: 33, field: "dtuptm", type: "character varying(8)", notNull: true, pk: false, desc: "データ更新時間" },
  { no: 34, field: "cv_upfolder", type: "character varying(256)", notNull: false, pk: false, desc: "CVアップロードフォルダ" },
  { no: 35, field: "smc_uid", type: "character varying(20)", notNull: false, pk: false, desc: "SMC UID" },
  { no: 36, field: "smc_upass", type: "character varying(256)", notNull: false, pk: false, desc: "SMC パスワード" },
  { no: 37, field: "ukbn_kobetuseikyu", type: "smallint", notNull: true, pk: false, default: "0", desc: "区分：個別請求" },
  { no: 38, field: "ukbn_sz", type: "smallint", notNull: true, pk: false, default: "0", desc: "区分：SZ" },
  { no: 39, field: "smc_unm", type: "character varying(50)", notNull: false, pk: false, desc: "SMC ユーザー名" },
  { no: 40, field: "ukbn_tray", type: "smallint", notNull: false, pk: false, default: "0", desc: "区分：トレー" },
  { no: 41, field: "ukbn_genka", type: "smallint", notNull: true, pk: false, default: "0", desc: "区分：原価" },
  { no: 42, field: "menu_kbn", type: "smallint", notNull: true, pk: false, default: "1", desc: "メニュー区分" },
  { no: 43, field: "kanribumon", type: "character varying(50)", notNull: true, pk: false, default: "1", desc: "管理部門" },
  { no: 44, field: "jimusyo", type: "character varying(50)", notNull: true, pk: false, default: "1", desc: "事務所" },
  { no: 45, field: "ukbn_password", type: "smallint", notNull: true, pk: false, default: "0", desc: "区分：パスワード" },
  { no: 46, field: "wgs_login_flg", type: "smallint", notNull: true, pk: false, default: "0", desc: "WGSログインフラグ" },
  { no: 47, field: "wgs_login_dt", type: "character varying(10)", notNull: true, pk: false, default: "", desc: "WGSログイン日" },
  { no: 48, field: "wgs_login_tm", type: "character varying(8)", notNull: true, pk: false, default: "", desc: "WGSログイン時間" },
  { no: 49, field: "wgs_logout_dt", type: "character varying(10)", notNull: true, pk: false, default: "", desc: "WGSログアウト日" },
  { no: 50, field: "wgs_logout_tm", type: "character varying(8)", notNull: true, pk: false, default: "", desc: "WGSログアウト時間" },
  { no: 51, field: "gaichu_flg", type: "smallint", notNull: true, pk: false, default: "0", desc: "外注フラグ" },
  { no: 52, field: "gaichu_cd", type: "character varying(8)", notNull: false, pk: false, desc: "外注コード" },
  { no: 53, field: "mitsumonavi_user_flg", type: "smallint", notNull: true, pk: false, default: "0", desc: "見積ナビユーザーフラグ" },
]

export default function MUserDefinitionPage() {
  const router = useRouter()

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>← 戻る</Button>
        <div>
          <h1 className="text-2xl font-bold">m_user DB定義</h1>
          <p className="text-sm text-gray-500 mt-0.5">テーブル名：dbo.m_user　／　{COLUMNS.length}カラム</p>
        </div>
      </div>

      <div className="bg-gray-900 text-gray-300 rounded-lg px-4 py-3 mb-6 font-mono text-xs">
        <span className="text-blue-400">TABLE</span> dbo.m_user　
        <span className="text-yellow-400">PK</span> uid (character varying 10)
      </div>

      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium w-12">No.</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">フィールド名</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">データ型</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">PK</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">NOT NULL</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">デフォルト</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">説明</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {COLUMNS.map(col => (
                <tr key={col.no} className={`hover:bg-gray-50 ${col.pk ? "bg-blue-50" : ""}`}>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{col.no}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs text-gray-800">{col.field}</span>
                    {col.pk && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">PK</span>}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-purple-700">{col.type}</td>
                  <td className="px-4 py-2.5 text-center">{col.pk ? "✓" : ""}</td>
                  <td className="px-4 py-2.5 text-center">
                    {col.notNull
                      ? <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">YES</span>
                      : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{"default" in col ? col.default : "—"}</td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">{col.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
