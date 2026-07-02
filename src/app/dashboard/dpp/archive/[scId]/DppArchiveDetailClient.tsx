"use client"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const PROGRESS_COLORS: Record<string, string> = {
  "保留":    "bg-gray-100 text-gray-500",
  "入稿待ち": "bg-yellow-100 text-yellow-700",
  "入稿済":  "bg-blue-100 text-blue-700",
  "製版中":  "bg-orange-100 text-orange-700",
  "製版済":  "bg-cyan-100 text-cyan-700",
  "出力中":  "bg-purple-100 text-purple-700",
  "出力済":  "bg-indigo-100 text-indigo-700",
  "印刷中":  "bg-pink-100 text-pink-700",
  "印刷済":  "bg-green-100 text-green-700",
  "完了":    "bg-gray-200 text-gray-600",
}

type Part = {
  id: string; dsi_u_id: string; siyou_u_id: string | null
  page: string | null; part_name: string | null
  kosei_type: string | null; kosei_stage: string | null
  paper_name: string | null; paper_weight: string | null
  color_omote: string | null; color_ura: string | null
  maisu: string | null; menzuke_daisuu: number | null
  nyuko_date: string | null; nyuko_time: string | null
  shiage_date: string | null; shiage_time: string | null
  biko: string | null; biko_siyou: string | null
  flg_dgs: string | null
}

type Record_ = {
  id: string; sc_id: string; hinban: string | null; hinmei: string | null
  artist_name: string | null; kosei_stage: string | null
  nouki_date: string | null; nouki_time: string | null
  progress: string | null; eigyo_tanto: string | null; seihan_tanto: string | null
  biko: string | null; shuukei_daisuu: number | null
  fm_created_at: string | null; fm_updated_at: string | null
  imported_at: string
  parts: Part[]
}

function fmtDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })
}

export default function DppArchiveDetailClient({ record: r }: { record: Record_ }) {
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/dpp/archive" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft className="w-4 h-4" />予定表アーカイブ一覧へ戻る
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-800">{r.hinmei ?? r.sc_id}</h1>
          {r.kosei_stage && (
            <span className="text-xs bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full font-medium">{r.kosei_stage}</span>
          )}
          {r.progress && (
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${PROGRESS_COLORS[r.progress] ?? "bg-gray-100 text-gray-600"}`}>{r.progress}</span>
          )}
        </div>
        <p className="text-xs text-gray-400 font-mono mt-1">sc_id: {r.sc_id}</p>
      </div>

      <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">仕様情報</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
          <Field label="品番" value={r.hinban} />
          <Field label="品名" value={r.hinmei} />
          <Field label="アーティスト名" value={r.artist_name} />
          <Field label="納期" value={r.nouki_date ? `${fmtDate(r.nouki_date)} ${r.nouki_time ?? ""}` : null} />
          <Field label="集計台数" value={r.shuukei_daisuu != null ? String(r.shuukei_daisuu) : null} />
          <Field label="営業担当" value={r.eigyo_tanto} />
          <Field label="製版担当" value={r.seihan_tanto} />
          <Field label="備考" value={r.biko} full />
        </div>
        <div className="mt-5 pt-4 border-t flex gap-6 text-xs text-gray-400">
          <span>FileMaker作成: {r.fm_created_at ? fmtDate(r.fm_created_at) : "—"}</span>
          <span>FileMaker更新: {r.fm_updated_at ? fmtDate(r.fm_updated_at) : "—"}</span>
          <span>取込日時: {new Date(r.imported_at).toLocaleString("ja-JP")}</span>
        </div>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">パーツ情報</h2>
          <span className="text-xs text-gray-400">{r.parts.length}件</span>
        </div>
        {r.parts.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">パーツ情報がありません。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">頁</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">パーツ名</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">校正種/段階</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">用紙名</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">連量</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">色表/裏</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">枚数</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">面付台数</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">入稿</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">仕上</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">備考</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {r.parts.map(p => (
                  <tr key={p.id} className="hover:bg-rose-50 transition-colors">
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{p.page ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-700 max-w-[140px]"><div className="truncate">{p.part_name ?? <span className="text-gray-300">—</span>}</div></td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                      {[p.kosei_type, p.kosei_stage].filter(Boolean).join(" / ") || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 max-w-[120px]"><div className="truncate">{p.paper_name ?? <span className="text-gray-300">—</span>}</div></td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{p.paper_weight ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                      {[p.color_omote, p.color_ura].filter(Boolean).join(" / ") || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{p.maisu ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{p.menzuke_daisuu ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap text-xs">
                      {p.nyuko_date ? `${fmtDate(p.nyuko_date)} ${p.nyuko_time ?? ""}` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap text-xs">
                      {p.shiage_date ? `${fmtDate(p.shiage_date)} ${p.shiage_time ?? ""}` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 max-w-[160px]"><div className="truncate">{p.biko ?? <span className="text-gray-300">—</span>}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, full }: { label: string; value: string | null; full?: boolean }) {
  return (
    <div className={full ? "col-span-2 md:col-span-3" : ""}>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-700">{value ?? <span className="text-gray-300">—</span>}</p>
    </div>
  )
}
