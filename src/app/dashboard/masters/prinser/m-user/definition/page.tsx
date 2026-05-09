"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

const COLUMNS = [
  { no: 1,  name: "ユーザID",             field: "uid",                    type: "character varying(10)", notNull: true,  pk: true,  index: "",  note: "" },
  { no: 2,  name: "パスワード",           field: "upass",                  type: "character varying(10)", notNull: true,  pk: false, index: "",  note: "" },
  { no: 3,  name: "ユーザ名",             field: "unm",                    type: "character varying(64)", notNull: true,  pk: false, index: "",  note: "" },
  { no: 4,  name: "ユーザ名カナ",         field: "ukana",                  type: "character varying(32)", notNull: true,  pk: false, index: "",  note: "全角カナ" },
  { no: 5,  name: "権限コード",           field: "kencd",                  type: "numeric(2,0)",          notNull: true,  pk: false, index: "1", note: "参：権限マスタ" },
  { no: 6,  name: "備考",                 field: "biko",                   type: "character varying(64)", notNull: false, pk: false, index: "",  note: "" },
  { no: 7,  name: "担当区分",             field: "ukbn",                   type: "numeric(1,0)",          notNull: false, pk: false, index: "2", note: "1：営業、2：工務、3：プリプレス、4：工場(印刷)、5：工場(加工)、6：工場(印刷加工)、7：配送" },
  { no: 8,  name: "管理レベル",           field: "ulevel",                 type: "smallint",              notNull: false, pk: false, index: "",  note: "0：担当者、1：管理者" },
  { no: 9,  name: "リスト表示",           field: "listflg",                type: "numeric(1,0)",          notNull: true,  pk: false, index: "3", note: "0：表示しない 1：表示する" },
  { no: 10, name: "ダウンロード用参照フォルダ", field: "folder_dl",        type: "character varying(256)", notNull: false, pk: false, index: "",  note: "" },
  { no: 11, name: "承認者ユーザID",       field: "kanriuid",               type: "character varying(10)", notNull: false, pk: false, index: "",  note: "" },
  { no: 12, name: "部門コード",           field: "bumon_cd",               type: "character varying(6)",  notNull: false, pk: false, index: "",  note: "" },
  { no: 13, name: "担当区分 営業",        field: "ukbn_eigyo",             type: "smallint",              notNull: true,  pk: false, index: "",  note: "0:担当外 1:担当" },
  { no: 14, name: "担当区分 工務",        field: "ukbn_koumu",             type: "smallint",              notNull: true,  pk: false, index: "",  note: "0:担当外 1:担当" },
  { no: 15, name: "担当区分 プリプレス",  field: "ukbn_prep",              type: "smallint",              notNull: true,  pk: false, index: "",  note: "0:担当外 1:担当 2:管理者 3:担当＋管理者 4:WebNative" },
  { no: 16, name: "担当区分 印刷",        field: "ukbn_press",             type: "smallint",              notNull: true,  pk: false, index: "",  note: "0:担当外 1:担当" },
  { no: 17, name: "担当区分 加工",        field: "ukbn_kako",              type: "smallint",              notNull: true,  pk: false, index: "",  note: "0:担当外 1:担当" },
  { no: 18, name: "担当区分 外注",        field: "ukbn_gaichu",            type: "smallint",              notNull: true,  pk: false, index: "",  note: "0:担当外 1:担当" },
  { no: 19, name: "担当区分 用紙",        field: "ukbn_yoshi",             type: "smallint",              notNull: true,  pk: false, index: "",  note: "0:担当外 1:担当" },
  { no: 20, name: "担当区分 配送",        field: "ukbn_haiso",             type: "smallint",              notNull: true,  pk: false, index: "",  note: "0:担当外 1:担当" },
  { no: 21, name: "担当区分 刷版",        field: "ukbn_sappan",            type: "smallint",              notNull: true,  pk: false, index: "",  note: "0:担当外 1:担当" },
  { no: 22, name: "担当区分 断裁",        field: "ukbn_dansai",            type: "smallint",              notNull: true,  pk: false, index: "",  note: "0:担当外 1:担当" },
  { no: 23, name: "担当区分 工場",        field: "ukbn_koujyo",            type: "smallint",              notNull: true,  pk: false, index: "",  note: "0:担当外 1:担当" },
  { no: 24, name: "担当区分 製品登録",    field: "ukbn_cv",                type: "smallint",              notNull: true,  pk: false, index: "",  note: "0：-(担当外) 1：登録担当 2：登録担当＆承認者 3：承認者" },
  { no: 25, name: "担当区分 下版",        field: "ukbn_gehan",             type: "smallint",              notNull: true,  pk: false, index: "",  note: "0:担当外 1:担当" },
  { no: 26, name: "担当者TEL",            field: "utel",                   type: "character varying(20)", notNull: false, pk: false, index: "",  note: "" },
  { no: 27, name: "担当者FAX",            field: "ufax",                   type: "character varying(20)", notNull: false, pk: false, index: "",  note: "" },
  { no: 28, name: "担当者E-mail",         field: "umail",                  type: "character varying(30)", notNull: false, pk: false, index: "",  note: "" },
  { no: 29, name: "論理削除フラグ",       field: "del_flg",                type: "integer",               notNull: true,  pk: false, index: "",  note: "" },
  { no: 30, name: "データ作成日",         field: "dtindt",                 type: "character varying(8)",  notNull: true,  pk: false, index: "",  note: "yyyymmdd" },
  { no: 31, name: "データ作成時間",       field: "dtintm",                 type: "character varying(8)",  notNull: true,  pk: false, index: "",  note: "hh:mm:ss" },
  { no: 32, name: "データ更新日",         field: "dtupdt",                 type: "character varying(8)",  notNull: true,  pk: false, index: "",  note: "yyyymmdd" },
  { no: 33, name: "データ更新時間",       field: "dtuptm",                 type: "character varying(8)",  notNull: true,  pk: false, index: "",  note: "hh:mm:ss" },
  { no: 34, name: "製品登録用参照フォルダ", field: "cv_upfolder",          type: "character varying(256)", notNull: false, pk: false, index: "",  note: "" },
  { no: 35, name: "SMCユーザID",          field: "smc_uid",                type: "character varying(20)", notNull: false, pk: false, index: "",  note: "smc連動で使用" },
  { no: 36, name: "SMCパスワード",        field: "smc_upass",              type: "character varying(256)", notNull: false, pk: false, index: "",  note: "smc連動で使用" },
  { no: 37, name: "担当区分 個別請求",    field: "ukbn_kobetuseikyu",      type: "smallint",              notNull: true,  pk: false, index: "",  note: "0:担当外 1:管理者" },
  { no: 38, name: "担当区分 購買",        field: "ukbn_sz",                type: "smallint",              notNull: true,  pk: false, index: "",  note: "0:担当外 1:一般 2:購買" },
  { no: 39, name: "SMCユーザ名",          field: "smc_unm",                type: "character varying(50)", notNull: false, pk: false, index: "",  note: "" },
  { no: 40, name: "担当区分 用紙トレイ",  field: "ukbn_tray",              type: "smallint",              notNull: false, pk: false, index: "",  note: "0:担当外 1:担当" },
  { no: 41, name: "担当区分 原価",        field: "ukbn_genka",             type: "smallint",              notNull: true,  pk: false, index: "",  note: "0:担当外 1:担当" },
  { no: 42, name: "メニュー区分",         field: "menu_kbn",               type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 43, name: "仕様表示 加工",        field: "siyo_disp_kako",         type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 44, name: "仕様表示 サンプルシール", field: "siyo_disp_sample_seal", type: "smallint",            notNull: true,  pk: false, index: "",  note: "" },
  { no: 45, name: "仕様表示 要注意",      field: "siyo_disp_youchui",      type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 46, name: "仕様表示 トレイ",      field: "siyo_disp__tray",        type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 47, name: "仕様表示 変更履歴",    field: "siyo_disp_henkorireki",  type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 48, name: "JT表示 加工",          field: "jt_disp_kako",           type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 49, name: "JT表示 外注",          field: "jt_disp_gaichu",         type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 50, name: "JT表示 変更依頼",      field: "jt_disp_henkoirai",      type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 51, name: "JT表示 原価内訳",      field: "jt_disp_genkauchiwake",  type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 52, name: "JT表示 納品情報",      field: "jt_disp_nohinjyoho",     type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 53, name: "JT表示 変更履歴",      field: "jt_disp_henkorireki",    type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 54, name: "予定表担当 下版",      field: "yoteihyo_tanto_gehan",   type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 55, name: "予定表担当 CTP",       field: "yoteihyo_tanto_ctp",     type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 56, name: "予定表担当 フィルム",  field: "yoteihyo_tanto_film",    type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 57, name: "予定表担当 検版",      field: "yoteihyo_tanto_kenpan",  type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 58, name: "予定表担当 印刷",      field: "yoteihyo_tanto_insatsu", type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 59, name: "予定表担当 表面加工",  field: "yoteihyo_tanto_hyomenkako", type: "smallint",           notNull: true,  pk: false, index: "",  note: "" },
  { no: 60, name: "予定表担当 抜き",      field: "yoteihyo_tanto_nuki",    type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 61, name: "予定表担当 折り",      field: "yoteihyo_tanto_ori",     type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 62, name: "予定表担当 製本",      field: "yoteihyo_tanto_seihon",  type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 63, name: "予定表担当 投げ込み",  field: "yoteihyo_tanto_nagekomi", type: "smallint",             notNull: true,  pk: false, index: "",  note: "" },
  { no: 64, name: "予定表担当 断裁",      field: "yoteihyo_tanto_dansai",  type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 65, name: "予定表担当 仕上げ",    field: "yoteihyo_tanto_siage",   type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 66, name: "予定表担当 貼り",      field: "yoteihyo_tanto_hari",    type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 67, name: "予定表担当 トレイ貼り", field: "yoteihyo_tanto_trayhari", type: "smallint",            notNull: true,  pk: false, index: "",  note: "" },
  { no: 68, name: "品番削除",             field: "hinban_sakujyo",         type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 69, name: "担当区分 入力",        field: "ukbn_nyuryoku",          type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 70, name: "管理部門",             field: "kanribumon",             type: "character varying(50)", notNull: true,  pk: false, index: "",  note: "" },
  { no: 71, name: "事務所",               field: "jimusyo",                type: "character varying(50)", notNull: true,  pk: false, index: "",  note: "" },
  { no: 72, name: "パスワード区分",       field: "ukbn_password",          type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 73, name: "WGSログインフラグ",    field: "wgs_login_flg",          type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 74, name: "WGSログイン日",        field: "wgs_login_dt",           type: "character varying(10)", notNull: true,  pk: false, index: "",  note: "" },
  { no: 75, name: "WGSログイン時間",      field: "wgs_login_tm",           type: "character varying(8)",  notNull: true,  pk: false, index: "",  note: "" },
  { no: 76, name: "WGSログアウト日",      field: "wgs_logout_dt",          type: "character varying(10)", notNull: true,  pk: false, index: "",  note: "" },
  { no: 77, name: "WGSログアウト時間",    field: "wgs_logout_tm",          type: "character varying(8)",  notNull: true,  pk: false, index: "",  note: "" },
  { no: 78, name: "外注フラグ",           field: "gaichu_flg",             type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
  { no: 79, name: "外注コード",           field: "gaichu_cd",              type: "character varying(8)",  notNull: false, pk: false, index: "",  note: "" },
  { no: 80, name: "見積ナビユーザーフラグ", field: "mitsumonavi_user_flg", type: "smallint",              notNull: true,  pk: false, index: "",  note: "" },
]

export default function MUserDefinitionPage() {
  const router = useRouter()

  return (
    <div className="min-w-0 overflow-hidden">
      <div className="p-6">
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

        <div className="border rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="text-sm bg-white" style={{ minWidth: "900px" }}>
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">No.</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">名称</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">フィールド名</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">データ型</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-medium whitespace-nowrap">PK</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-medium whitespace-nowrap">NOT NULL</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-medium whitespace-nowrap">Index</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">備考</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {COLUMNS.map(col => (
                  <tr key={col.no} className={`hover:bg-gray-50 ${col.pk ? "bg-blue-50" : ""}`}>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{col.no}</td>
                    <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap text-xs">{col.name}</td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs text-gray-800">{col.field}</span>
                      {col.pk && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">PK</span>}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-purple-700 whitespace-nowrap">{col.type}</td>
                    <td className="px-4 py-2.5 text-center text-xs">{col.pk ? "✓" : ""}</td>
                    <td className="px-4 py-2.5 text-center">
                      {col.notNull
                        ? <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">YES</span>
                        : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center text-xs text-gray-500">{col.index || "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{col.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
