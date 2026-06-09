"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search } from "lucide-react"

type DxfRequest = {
  id: string
  uid: string
  id_cad: string | null
  request_date: string
  request_time: string
  desired_date: string | null
  desired_time: string | null
  purpose: string | null
  worker: string | null
  status: string | null
}

const STATUS_OPTIONS = ["作成中", "依頼済み", "作業中", "完了"]
const STATUS_COLORS: Record<string, string> = {
  "作成中": "bg-gray-100 text-gray-600",
  "依頼済み": "bg-blue-100 text-blue-700",
  "作業中": "bg-yellow-100 text-yellow-700",
  "完了": "bg-green-100 text-green-700",
}

export default function DxfRequestsPage() {
  const router = useRouter()
  const [records, setRecords] = useState<DxfRequest[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)

  const fetchRecords = async (p = page) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), keyword, status })
    const res = await fetch(`/api/cad/dxf-requests?${params}`)
    const data = await res.json()
    setRecords(data.records)
    setTotal(data.total)
    setLoading(false)
  }

  useEffect(() => { fetchRecords(1); setPage(1) }, [keyword, status])

  const totalPages = Math.ceil(total / 50)

  const formatDate = (str: string | null) => {
    if (!str) return "—"
    return new Date(str).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">DXF変換依頼書</h1>
        <button
          onClick={() => router.push("/dashboard/cad/dxf-requests/new")}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800"
        >
          <Plus className="w-4 h-4" /> 新規作成
        </button>
      </div>

      {/* 検索 */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="No・CAD依頼書No・担当者で検索..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
            autoComplete="off"
          />
        </div>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">全ステータス</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* テーブル */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">No</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">CAD依頼書No</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">依頼日</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">希望納期</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">目的</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">担当者</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">ステータス</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">読み込み中...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">データがありません</td></tr>
            ) : records.map(r => (
              <tr
                key={r.id}
                onClick={() => router.push(`/dashboard/cad/dxf-requests/${r.id}`)}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 font-mono font-medium text-gray-900">{r.uid}</td>
                <td className="px-4 py-3 text-gray-600">{r.id_cad || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(r.request_date)}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(r.desired_date)}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{r.purpose || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{r.worker || "—"}</td>
                <td className="px-4 py-3">
                  {r.status ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {r.status}
                    </span>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">{total}件中 {(page - 1) * 50 + 1}〜{Math.min(page * 50, total)}件</p>
          <div className="flex gap-2">
            <button
              onClick={() => { setPage(p => p - 1); fetchRecords(page - 1) }}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >← 前</button>
            <span className="px-3 py-1.5 text-sm">{page} / {totalPages}</span>
            <button
              onClick={() => { setPage(p => p + 1); fetchRecords(page + 1) }}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >次 →</button>
          </div>
        </div>
      )}
    </div>
  )
}
