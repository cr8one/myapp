"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronLeft, ChevronRight, Download, Upload, X, CheckCircle, AlertCircle } from "lucide-react"

type CadRequest = {
  id: string
  uid: string
  request_date: string
  request_time: string
  requester_name: string
  department: string | null
  client: string | null
  title: string | null
  genre: string | null
  hinmoku: string | null
  hinban: string | null
  status: string
  desired_date: string | null
  desired_time: string | null
  requester: { id: string; name: string | null; department: string | null } | null
}

type ImportStatus = "idle" | "uploading" | "importing" | "done" | "error"
const PAGE_SIZE = 50

const STATUS_OPTIONS = ["作成中", "依頼済", "着手", "完了", "保留"] as const

const STATUS_STYLE: Record<string, string> = {
  "作成中": "bg-gray-100 text-gray-600",
  "依頼済": "bg-blue-100 text-blue-700",
  "着手": "bg-yellow-100 text-yellow-700",
  "完了": "bg-green-100 text-green-700",
  "保留": "bg-red-100 text-red-700",
}

export default function CadRequestsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [records, setRecords] = useState<CadRequest[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [showImport, setShowImport] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle")
  const [importProgress, setImportProgress] = useState({ count: 0, total: 0 })
  const [importError, setImportError] = useState("")
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const fetchRecords = async (p = page, kw = keyword, st = statusFilter) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (kw) params.set("keyword", kw)
    if (st) params.set("status", st)
    params.set("page", String(p))
    const res = await fetch(`/api/cad/requests?${params.toString()}`)
    const data = await res.json()
    setRecords(data.records)
    setTotal(data.total)
    setLoading(false)
  }

  useEffect(() => { fetchRecords(1) }, [])

  const handleSearch = () => {
    setPage(1)
    fetchRecords(1, keyword, statusFilter)
  }

  const handleStatusFilter = (st: string) => {
    const next = statusFilter === st ? "" : st
    setStatusFilter(next)
    setPage(1)
    fetchRecords(1, keyword, next)
  }

  const handlePage = (next: number) => {
    setPage(next)
    fetchRecords(next, keyword, statusFilter)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("このCAD依頼を削除しますか？")) return
    await fetch(`/api/cad/requests/${id}`, { method: "DELETE" })
    fetchRecords(page, keyword, statusFilter)
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    if (keyword) params.set("keyword", keyword)
    if (statusFilter) params.set("status", statusFilter)
    window.location.href = `/api/cad/requests/export?${params.toString()}`
  }

  const handleImport = async () => {
    if (!importFile) return
    setImportStatus("uploading")
    setImportError("")
    setImportProgress({ count: 0, total: 0 })
    try {
      const presignRes = await fetch("/api/cad/requests/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: importFile.name }),
      })
      const { url, key } = await presignRes.json()
      await fetch(url, { method: "PUT", body: importFile, headers: { "Content-Type": "text/csv" } })
      setImportStatus("importing")
      let offset = 0
      let totalCount = 0
      while (true) {
        const res = await fetch("/api/cad/requests/import", {
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
      fetchRecords(1, keyword, statusFilter)
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

  const formatDate = (str: string | null) => {
    if (!str) return ""
    return new Date(str).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })
  }

  const Pagination = () => (
    <div className="flex items-center justify-between py-3 px-1">
      <p className="text-sm text-gray-500">
        全 {total} 件中 {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}〜{Math.min(page * PAGE_SIZE, total)} 件表示
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => handlePage(page - 1)} disabled={page <= 1}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm px-3">{page} / {Math.max(1, totalPages)}</span>
        <Button variant="outline" size="sm" onClick={() => handlePage(page + 1)} disabled={page >= totalPages}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">CAD依頼書</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImport(v => !v)} className="flex items-center gap-1">
            <Upload className="w-4 h-4" />CSVインポート
          </Button>
          <Button variant="outline" onClick={handleExport} className="flex items-center gap-1">
            <Download className="w-4 h-4" />CSVエクスポート
          </Button>
          <Button onClick={() => router.push("/dashboard/cad/requests/new")}>新規登録</Button>
        </div>
      </div>

      {/* インポートパネル */}
      {showImport && (
        <div className="bg-white border rounded-lg p-5 mb-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">CSVインポート</h2>
            <button onClick={resetImport} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-gray-500">
            列順：依頼番号・依頼日・依頼時刻・依頼営業名・依頼部署・依頼内容・クライアント・タイトル・ジャンル・品目名・品番・ステータス・型台帳番号・展開天地・展開左右・用紙・仕上個数・希望納期日・希望納期時刻・使用トレイ・デジ仕様・トレイ枚数・ポケット・備考
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
                    <p className="text-sm text-gray-500">CSVファイルを選択</p>
                    <p className="text-xs text-gray-400 mt-1">UTF-8 対応</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                onChange={e => setImportFile(e.target.files?.[0] ?? null)} />
              <div className="flex justify-end mt-3">
                <Button onClick={handleImport} disabled={!importFile} size="sm">インポート開始</Button>
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
                  <div className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.round(importProgress.count / importProgress.total * 100)}%` }} />
                </div>
              )}
            </div>
          )}
          {importStatus === "done" && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">{importProgress.count}件のインポートが完了しました</span>
              <button onClick={resetImport} className="ml-auto text-xs text-green-600 hover:text-green-800">閉じる</button>
            </div>
          )}
          {importStatus === "error" && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{importError}</span>
              <button onClick={() => setImportStatus("idle")} className="ml-auto text-xs text-red-600 hover:text-red-800">再試行</button>
            </div>
          )}
        </div>
      )}

      {/* 検索・フィルタ */}
      <div className="bg-white border rounded-lg p-4 mb-6 shadow-sm space-y-3">
        <div className="flex gap-3">
          <Input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="依頼番号・営業名・クライアント・タイトル・品番"
            className="h-8 text-sm"
            autoComplete="off"
          />
          <Button size="sm" onClick={handleSearch} className="flex items-center gap-1">
            <Search className="w-3 h-3" />検索
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400">ステータス絞り込み：</span>
          {STATUS_OPTIONS.map(st => (
            <button
              key={st}
              onClick={() => handleStatusFilter(st)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                statusFilter === st
                  ? `${STATUS_STYLE[st]} border-transparent font-semibold`
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 一覧 */}
      {loading ? (
        <p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p>
      ) : records.length === 0 ? (
        <p className="text-center text-gray-500 py-8">データがありません</p>
      ) : (
        <>
          <Pagination />
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-16" />
                <col className="w-20" />
                <col className="w-32" />
                <col className="w-40" />
                <col className="w-[22%]" />
                <col className="w-[18%]" />
                <col className="w-20" />
                <col className="w-24" />
                <col className="w-28" />
              </colgroup>
              <thead>
                <tr className="border-b bg-gray-50 text-xs text-gray-500">
                  <th className="text-left font-medium px-3 py-2">No.</th>
                  <th className="text-left font-medium px-3 py-2">依頼日</th>
                  <th className="text-left font-medium px-3 py-2">依頼者/部署</th>
                  <th className="text-left font-medium px-3 py-2">クライアント</th>
                  <th className="text-left font-medium px-3 py-2">タイトル</th>
                  <th className="text-left font-medium px-3 py-2">品番/品目</th>
                  <th className="text-left font-medium px-3 py-2">ステータス</th>
                  <th className="text-left font-medium px-3 py-2">希望納期</th>
                  <th className="text-left font-medium px-3 py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr
                    key={r.id}
                    className="border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors align-top"
                    onClick={() => router.push(`/dashboard/cad/requests/${r.id}`)}
                  >
                    <td className="px-3 py-3 text-xs text-gray-400">{r.uid}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{formatDate(r.request_date)}</td>
                    <td className="px-3 py-3">
                      <div className="text-sm text-gray-700 break-words leading-snug">{r.requester_name}</div>
                      {r.department && <div className="text-xs text-gray-400 mt-0.5">{r.department}</div>}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-sm text-gray-600 break-words leading-snug">{r.client ?? ""}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-sm font-semibold text-gray-800 break-words leading-snug">{r.title ?? ""}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm text-gray-700 break-words leading-snug">{r.hinban ?? ""}</div>
                      {r.hinmoku && <div className="text-xs text-gray-400 mt-0.5 break-words leading-snug">{r.hinmoku}</div>}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_STYLE[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">{formatDate(r.desired_date)}</td>
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="sm"
                          onClick={() => router.push(`/dashboard/cad/requests/${r.id}`)}>詳細</Button>
                        <Button variant="destructive" size="sm"
                          onClick={e => handleDelete(r.id, e)}>削除</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination />
        </>
      )}
    </div>
  )
}
