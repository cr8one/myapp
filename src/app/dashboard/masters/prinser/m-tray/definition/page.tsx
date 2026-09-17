"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

const COLUMNS = [
  { no: 1,  name: "店舗",           field: "t_shop",         type: "character varying(20)", notNull: true,  pk: false, index: "", note: "" },
  { no: 2,  name: "メーカー",       field: "t_maker",        type: "character varying(20)", notNull: true,  pk: false, index: "", note: "" },
  { no: 3,  name: "タイプ",         field: "t_type",         type: "character varying(5)",  notNull: true,  pk: false, index: "", note: "" },
  { no: 4,  name: "トレイCD",       field: "tray_cd",        type: "character varying(10)", notNull: true,  pk: true,  index: "", note: "" },
  { no: 5,  name: "トレイ名",       field: "tray_nm",        type: "character varying(50)", notNull: true,  pk: false, index: "", note: "" },
  { no: 6,  name: "厚み",           field: "t_atumi",        type: "integer",               notNull: true,  pk: false, index: "", note: "" },
  { no: 7,  name: "ロゴ",           field: "t_logo",         type: "character varying(10)", notNull: true,  pk: false, index: "", note: "" },
  { no: 8,  name: "脚",             field: "t_foot",         type: "character varying(10)", notNull: true,  pk: false, index: "", note: "" },
  { no: 9,  name: "色",             field: "t_col",          type: "character varying(10)", notNull: true,  pk: false, index: "", note: "" },
  { no: 10, name: "備考",           field: "bikou",          type: "character varying(20)", notNull: true,  pk: false, index: "", note: "" },
  { no: 11, name: "トレイ名2",      field: "tray_nm2",       type: "character varying(50)", notNull: true,  pk: false, index: "", note: "" },
  { no: 12, name: "幅",             field: "t_wide",         type: "character varying(5)",  notNull: false, pk: false, index: "", note: "" },
  { no: 13, name: "単価",           field: "tray_tanka",     type: "numeric(10,2)",         notNull: false, pk: false, index: "", note: "" },
  { no: 14, name: "連動トレイCD",   field: "rendo_tray_cd",  type: "character varying(10)", notNull: true,  pk: false, index: "", note: "" },
  { no: 15, name: "ソート",         field: "t_sort",         type: "smallint",              notNull: true,  pk: false, index: "", note: "" },
  { no: 16, name: "削除FLG",        field: "del_flg",        type: "smallint",              notNull: true,  pk: false, index: "", note: "" },
  { no: 17, name: "データ作成日",   field: "dtindt",         type: "character varying(8)",  notNull: true,  pk: false, index: "", note: "yyyymmdd" },
  { no: 18, name: "データ作成時間", field: "dtintm",         type: "character varying(8)",  notNull: true,  pk: false, index: "", note: "hh:mm:ss" },
  { no: 19, name: "データ作成者",   field: "dtinuid",        type: "character varying(10)", notNull: true,  pk: false, index: "", note: "" },
  { no: 20, name: "データ更新日",   field: "dtupdt",         type: "character varying(8)",  notNull: true,  pk: false, index: "", note: "yyyymmdd" },
  { no: 21, name: "データ更新時間", field: "dtuptm",         type: "character varying(8)",  notNull: true,  pk: false, index: "", note: "hh:mm:ss" },
  { no: 22, name: "データ更新者",   field: "dtupuid",        type: "character varying(10)", notNull: true,  pk: false, index: "", note: "" },
  { no: 23, name: "略称",           field: "tray_ryaku_nm",  type: "character varying(20)", notNull: false, pk: false, index: "", note: "" },
  { no: 24, name: "割増",           field: "tray_warimashi", type: "numeric(10,2)",         notNull: false, pk: false, index: "", note: "" },
]

export default function MTrayDefinitionPage() {
  const router = useRouter()

  return (
    <div className="min-w-0 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => router.back()}>← 戻る</Button>
          <div>
            <h1 className="text-2xl font-bold">m_tray DB定義</h1>
            <p className="text-sm text-gray-500 mt-0.5">テーブル名：dbo.m_tray　／　{COLUMNS.length}カラム</p>
          </div>
        </div>

        <div className="bg-gray-900 text-gray-300 rounded-lg px-4 py-3 mb-6 font-mono text-xs">
          <span className="text-blue-400">TABLE</span> dbo.m_tray　
          <span className="text-yellow-400">PK</span> tray_cd (character varying 10)
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
