"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Upload, Download, X } from "lucide-react"

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

  const [showImport, setShowImport] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importStatus, setImportStatus] = useState<"idle" | "uploading" | "importing" | "done" | "error">("idle")
  const [importProgress, setImportProgress] = useState({ count: 0, total: 0 })
  const [importError, setImportError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleExport = () => {
    const params = new URLSearchParams()
    if (keyword) params.set("keyword", keyword)
    if (status) params.set("status", status)
    window.location.href = `/api/cad/dxf-requests/export?${params.toString()}`
  }

  const handleImport = async () => {
    if (!importFile) return
    setImportStatus("uploading")
    setImportError("")
    setImportProgress({ count: 0, total: 0 })
    try {
      const presignRes = await fetch("/api/cad/dxf-requests/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: importFile.name }),
      })
      const { url, key } = await presignRes.json()
      await fetch(url, { method: "PUT", body: importFile, headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" } })
      setImportStatus("importing")
      let offset = 0
      let totalCount = 0
      while (true) {
        const res = await fetch("/api/cad/dxf-requests/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, offset }),
        })
        const data = await res.json()
        if (!data.ok) throw new Error(data.error ?? "インポートエラー")
        totalCount += data.count
        offset = data.offset
        setImportProgress({ count: totalCount, total: data.total })
        if (data.done) break
      }
      setImportStatus("done")
      fetchRecords(1)
      setPage(1)
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "エラーが発生しました")
      setImportStatus("error")
    }
  }

  const resetImport = () => {
    setImportStatus("idle")
    setImportFile(null)
    setImportProgress({ count: 0, total: 0 })
    setImportError("")
    setShowImport(false)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">DXF変換依頼書</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50"
          >
            <Upload className="w-4 h-4" /> Excelインポート
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" /> Excelエクスポート
          </button>
          <button
            onClick={() => router.push("/dashboard/cad/dxf-requests/new")}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800"
          >
            <Plus className="w-4 h-4" /> 新規作成
          </button>
        </div>
      </div>

      {/* インポートパネル */}
      {showImport && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Excelインポート</h2>
            <button onClick={resetImport} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-gray-500">
            シート名「DxfRequests」、列順：依頼番号・CAD依頼書No・依頼日・依頼時刻・希望納期日・希望納期時刻・目的・備考・作業担当・ステータス
          </p>
          {importStatus === "idle" && (
            <div>
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${importFile ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                onClick={() => fileInputRef.current?.click()}>
                {importFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-sm text-gray-700 font-medium">{importFile.name}</span>
                    <button onClick={e => { e.stopPropagation(); setImportFile(null) }} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Excelファイルを選択</p>
                    <p className="text-xs text-gray-400 mt-1">.xlsx形式</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden"
                onChange={e => setImportFile(e.target.files?.[0] ?? null)} />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleImport}
                  disabled={!importFile}
                  className="px-4 py-1.5 text-sm bg-green-700 text-white rounded-lg disabled:opacity-40 hover:bg-green-800"
                >インポート開始</button>
              </div>
            </div>
          )}
          {(importStatus === "uploading" || importStatus === "importing") && (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                {importStatus === "uploading" ? "S3にアップロード中..." : `インポート中... ${importProgress.count} / ${importProgress.total} 件`}
              </div>
              {importProgress.total > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-700 h-2 rounded-full transition-all"
                    style={{ width: `${Math.round((importProgress.count / importProgress.total) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          )}
          {importStatus === "done" && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-700">インポートが完了しました（{importProgress.count}件）</p>
              <button onClick={resetImport} className="text-sm text-gray-500 hover:text-gray-700">閉じる</button>
            </div>
          )}
          {importStatus === "error" && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-600">{importError}</p>
              <button onClick={() => setImportStatus("idle")} className="text-sm text-gray-500 hover:text-gray-700">やり直す</button>
            </div>
          )}
        </div>
      )}

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