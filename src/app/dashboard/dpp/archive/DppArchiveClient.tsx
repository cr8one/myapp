"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Upload, X, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"

const PROGRESS_OPTIONS = ["保留", "入稿待ち", "入稿済", "製版中", "製版済", "出力中", "出力済", "印刷中", "印刷済", "完了"]
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
type DppScheduleArchive = {
  id: string; sc_id: string; hinban: string | null; hinmei: string | null
  artist_name: string | null; kosei_stage: string | null
  nouki_date: string | null; nouki_time: string | null
  progress: string | null; eigyo_tanto: string | null; seihan_tanto: string | null
  biko: string | null; shuukei_daisuu: number | null
}
const PAGE_SIZE = 50
type ImportStatus = "idle" | "uploading" | "importing" | "done" | "error"
type ImportTarget = "schedules" | "parts"

export default function DppArchiveClient({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [records, setRecords] = useState<DppScheduleArchive[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(parseInt(searchParams.get("page") ?? "1"))
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "")
  const [progressFilter, setProgressFilter] = useState(searchParams.get("progress") ?? "")

  const [showImport, setShowImport] = useState(false)
  const [importTarget, setImportTarget] = useState<ImportTarget>("schedules")
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle")
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState({ count: 0, total: 0 })
  const [importError, setImportError] = useState("")

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const buildQuery = (p: number, kw = keyword, pf = progressFilter) => {
    const params = new URLSearchParams()
    if (kw) params.set("keyword", kw)
    if (pf) params.set("progress", pf)
    params.set("page", String(p))
    return params
  }

  const fetchRecords = async (p = page, kw = keyword, pf = progressFilter, syncUrl = true) => {
    setLoading(true)
    const params = buildQuery(p, kw, pf)
    if (syncUrl) router.replace(`/dashboard/dpp/archive?${params.toString()}`)
    const res = await fetch(`/api/dpp/archive/schedules?${params.toString()}`)
    const data = await res.json()
    setRecords(data.records)
    setTotal(data.total)
    setLoading(false)
  }

  useEffect(() => {
    const p = parseInt(searchParams.get("page") ?? "1")
    const kw = searchParams.get("keyword") ?? ""
    const pf = searchParams.get("progress") ?? ""
    setPage(p); setKeyword(kw); setProgressFilter(pf)
    fetchRecords(p, kw, pf, false)
  }, [searchParams])

  const handleSearch = () => { setPage(1); fetchRecords(1) }
  const handlePage = (next: number) => {
    setPage(next)
    fetchRecords(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const resetImport = () => {
    setImportStatus("idle")
    setImportFile(null)
    setImportProgress({ count: 0, total: 0 })
    setImportError("")
    setShowImport(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleImport = async () => {
    if (!importFile) return
    setImportStatus("uploading")
    setImportError("")
    setImportProgress({ count: 0, total: 0 })
    try {
      const presignRes = await fetch(`/api/dpp/archive/${importTarget}/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: importFile.name }),
      })
      if (!presignRes.ok) throw new Error()
      const { url, key } = await presignRes.json()
      await fetch(url, {
        method: "PUT",
        body: importFile,
        headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
      })
      setImportStatus("importing")
      let offset = 0
      let total = 0
      while (true) {
        const res = await fetch(`/api/dpp/archive/${importTarget}/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, offset }),
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        total = data.total
        offset = data.offset
        setImportProgress({ count: offset, total })
        if (data.done) break
      }
      setImportStatus("done")
      fetchRecords(1)
    } catch {
      setImportStatus("error")
      setImportError("インポート中にエラーが発生しました")
    }
  }

  const Pagination = () => (
    <div className="flex items-center justify-between mb-3 px-1">
      <span className="text-xs text-gray-400">{total}件中 {(page - 1) * PAGE_SIZE + 1}〜{Math.min(page * PAGE_SIZE, total)}件</span>
      <div className="flex items-center gap-1">
        <button onClick={() => handlePage(page - 1)} disabled={page <= 1}
          className="p-1.5 rounded border text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-500 px-2">{page} / {totalPages || 1}</span>
        <button onClick={() => handlePage(page + 1)} disabled={page >= totalPages}
          className="p-1.5 rounded border text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">予定表アーカイブ</h1>
          <p className="text-sm text-gray-500 mt-1">{total}件（閲覧のみ）</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImport(s => !s)} className="flex items-center gap-1.5">
              <Upload className="w-4 h-4" />xlsx取込
            </Button>
          </div>
        )}
      </div>

      {isAdmin && showImport && (
        <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm space-y-3">
          {importStatus === "idle" && (
            <div className="flex items-center gap-3 flex-wrap">
              <select value={importTarget} onChange={e => setImportTarget(e.target.value as ImportTarget)}
                className="h-9 border rounded px-2 text-sm bg-white">
                <option value="schedules">仕様情報（親）</option>
                <option value="parts">パーツ情報（子）</option>
              </select>
              <input ref={fileInputRef} type="file" accept=".xlsx"
                onChange={e => setImportFile(e.target.files?.[0] ?? null)}
                className="text-sm flex-1" />
              <Button size="sm" onClick={handleImport} disabled={!importFile}>取込開始</Button>
              <button onClick={resetImport} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
          )}
          {(importStatus === "uploading" || importStatus === "importing") && (
            <div className="flex items-center gap-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <span className="text-sm animate-pulse">
                {importStatus === "uploading" ? "アップロード中..." : `インポート中... ${importProgress.count}/${importProgress.total}件`}
              </span>
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
          {importTarget === "parts" && (
            <p className="text-xs text-gray-400">※パーツ情報は先に対応する仕様情報（親）を取り込んでから実行してください。</p>
          )}
        </div>
      )}

      <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-48">
            <Input value={keyword} onChange={e => setKeyword(e.target.value)}
              placeholder="sc_id・品番・品名・アーティスト・担当者で検索"
              onKeyDown={e => { if (e.key === "Enter") fetchRecords() }}
              autoComplete="off" />
          </div>
          <select value={progressFilter} onChange={e => setProgressFilter(e.target.value)}
            className="h-10 border rounded px-3 text-sm bg-white">
            <option value="">進捗：すべて</option>
            {PROGRESS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <Button onClick={handleSearch} className="flex items-center gap-1">
            <Search className="w-4 h-4" />検索
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p>
      ) : records.length === 0 ? (
        <p className="text-center text-gray-500 py-8">データがありません。</p>
      ) : (
        <>
          <Pagination />
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">sc_id</th>
                    <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">校正</th>
                    <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">品番</th>
                    <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">品名</th>
                    <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">アーティスト</th>
                    <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">納期</th>
                    <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">進捗</th>
                    <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">集計</th>
                    <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">営業</th>
                    <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">製版</th>
                    <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">備考</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map(r => (
                    <tr
                      key={r.id}
                      className="hover:bg-rose-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/dpp/archive/${encodeURIComponent(r.sc_id)}`)}
                    >
                      <td className="px-3 py-2.5 font-mono text-gray-500 whitespace-nowrap">{r.sc_id}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {r.kosei_stage
                          ? <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">{r.kosei_stage}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-700 whitespace-nowrap">{r.hinban ?? <span className="text-gray-300">—</span>}</td>
                      <td className="px-3 py-2.5 text-gray-700 max-w-[160px]"><div className="truncate">{r.hinmei ?? <span className="text-gray-300">—</span>}</div></td>
                      <td className="px-3 py-2.5 text-gray-600 max-w-[140px]"><div className="truncate">{r.artist_name ?? <span className="text-gray-300">—</span>}</div></td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-600">
                        {r.nouki_date
                          ? <span className="font-medium">{new Date(r.nouki_date).toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit" })}</span>
                          : <span className="text-gray-300">—</span>}
                        {r.nouki_time && <span className="ml-1 text-xs text-gray-500">{r.nouki_time}</span>}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {r.progress
                          ? <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PROGRESS_COLORS[r.progress] ?? "bg-gray-100 text-gray-600"}`}>{r.progress}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{r.shuukei_daisuu ?? <span className="text-gray-300">—</span>}</td>
                      <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{r.eigyo_tanto ?? <span className="text-gray-300">—</span>}</td>
                      <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{r.seihan_tanto ?? <span className="text-gray-300">—</span>}</td>
                      <td className="px-3 py-2.5 text-gray-500 max-w-[160px]"><div className="truncate">{r.biko ?? <span className="text-gray-300">—</span>}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-3">
            <Pagination />
          </div>
        </>
      )}
    </div>
  )
}
