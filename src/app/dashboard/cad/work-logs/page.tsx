"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronLeft, ChevronRight, Trash2, Upload, Download, X } from "lucide-react"

type CadWorkLog = {
  id: string
  creator: string
  work_date: string
  start_time: string
  end_time: string | null
  request_no: string | null
  department_group: string | null
  person_in_charge: string | null
  customer: string | null
  title: string | null
  content: string | null
  parts_name: string | null
  quantity: number | null
  paper_name: string | null
  remarks: string | null
  flg_same_day: number
}

const PAGE_SIZE = 50

export default function CadWorkLogsPage() {
  const router = useRouter()
  const [records, setRecords] = useState<CadWorkLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [, forceTick] = useState(0)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const [showImport, setShowImport] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importStatus, setImportStatus] = useState<"idle" | "uploading" | "importing" | "done" | "error">("idle")
  const [importProgress, setImportProgress] = useState({ count: 0, total: 0 })
  const [importError, setImportError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchRecords = async (p = page, kw = keyword) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (kw) params.set("keyword", kw)
    params.set("page", String(p))
    const res = await fetch(`/api/cad/work-logs?${params.toString()}`)
    const data = await res.json()
    setRecords(data.records)
    setTotal(data.total)
    setLoading(false)
  }

  useEffect(() => { fetchRecords(1) }, [])

  useEffect(() => {
    const timer = setInterval(() => forceTick(t => t + 1), 60000)
    return () => clearInterval(timer)
  }, [])

  const handleSearch = () => {
    setPage(1)
    fetchRecords(1, keyword)
  }

  const handlePage = (next: number) => {
    setPage(next)
    fetchRecords(next, keyword)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const formatMonthDay = (str: string) => {
    const d = new Date(str)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  const formatTime = (str: string) => {
    const d = new Date(str)
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  }

  const formatDuration = (start: string, end: string | null) => {
    const startMs = new Date(start).getTime()
    const endMs = end ? new Date(end).getTime() : Date.now()
    const diffMin = Math.max(0, Math.round((endMs - startMs) / 60000))
    const h = Math.floor(diffMin / 60)
    const m = diffMin % 60
    const label = `${h}:${String(m).padStart(2, "0")}`
    return end ? label : `-${label}`
  }

  const toggleSameDay = async (r: CadWorkLog) => {
    const next = r.flg_same_day ? 0 : 1
    setRecords(prev => prev.map(x => x.id === r.id ? { ...x, flg_same_day: next } : x))
    await fetch(`/api/cad/work-logs/${r.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flg_same_day: next }),
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("この作業履歴を削除しますか？")) return
    await fetch(`/api/cad/work-logs/${id}`, { method: "DELETE" })
    fetchRecords(page, keyword)
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    if (keyword) params.set("keyword", keyword)
    window.location.href = `/api/cad/work-logs/export?${params.toString()}`
  }

  const handleImport = async () => {
    if (!importFile) return
    setImportStatus("uploading")
    setImportError("")
    setImportProgress({ count: 0, total: 0 })
    try {
      const presignRes = await fetch("/api/cad/work-logs/presign", {
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
        const res = await fetch("/api/cad/work-logs/import", {
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
      fetchRecords(1, keyword)
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
        <h1 className="text-2xl font-bold">CAD作業履歴</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImport(v => !v)} className="flex items-center gap-1">
            <Upload className="w-4 h-4" />Excelインポート
          </Button>
          <Button variant="outline" onClick={handleExport} className="flex items-center gap-1">
            <Download className="w-4 h-4" />Excelエクスポート
          </Button>
          <Button onClick={() => router.push("/dashboard/cad/work-logs/new")}>新規作成</Button>
        </div>
      </div>

      {showImport && (
        <div className="bg-white border rounded-lg p-5 mb-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Excelインポート</h2>
            <button onClick={resetImport} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-gray-500">
            シート名「CadWorkLogs」、列順：日付・開始時刻・終了時刻・依頼書No・所属G・担当者・顧客・タイトル・内容・パーツ名・用紙名・数量・備考・当日対応・作成者（依頼書Noのような一意キーがないため、インポートは常に新規追加になります。上書きはされません）
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
                  <div
                    className="bg-gray-800 h-2 rounded-full transition-all"
                    style={{ width: `${Math.round((importProgress.count / importProgress.total) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          )}
          {importStatus === "done" && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-700">インポートが完了しました（{importProgress.count}件追加）</p>
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

      <div className="bg-white border rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex gap-3">
          <Input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="依頼書No・担当者・顧客・タイトル"
            className="h-8 text-sm"
            autoComplete="off"
          />
          <Button size="sm" onClick={handleSearch} className="flex items-center gap-1">
            <Search className="w-3 h-3" />検索
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p>
      ) : records.length === 0 ? (
        <p className="text-center text-gray-500 py-8">データがありません</p>
      ) : (
        <>
          <Pagination />
          <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
            <table className="w-full min-w-[1600px] table-fixed">
              <colgroup>
                <col className="w-20" />
                <col className="w-24" />
                <col className="w-16" />
                <col className="w-28" />
                <col className="w-16" />
                <col className="w-24" />
                <col className="w-28" />
                <col className="w-24" />
                <col className="w-32" />
                <col className="w-40" />
                <col className="w-32" />
                <col className="w-32" />
                <col className="w-16" />
                <col className="w-28" />
                <col className="w-40" />
                <col className="w-14" />
                <col className="w-16" />
              </colgroup>
              <thead>
                <tr className="border-b bg-gray-50 text-xs text-gray-500">
                  <th className="text-left font-medium px-3 py-3">依頼書No</th>
                  <th className="text-left font-medium px-3 py-3">作成者</th>
                  <th className="text-left font-medium px-3 py-3">日付</th>
                  <th className="text-left font-medium px-3 py-3">時刻</th>
                  <th className="text-left font-medium px-3 py-3">作業時間</th>
                  <th className="text-left font-medium px-3 py-3">所属G</th>
                  <th className="text-left font-medium px-3 py-3">担当者</th>
                  <th className="text-left font-medium px-3 py-3">顧客</th>
                  <th className="text-left font-medium px-3 py-3">タイトル</th>
                  <th className="text-left font-medium px-3 py-3">内容</th>
                  <th className="text-left font-medium px-3 py-3">パーツ名</th>
                  <th className="text-left font-medium px-3 py-3">用紙名</th>
                  <th className="text-left font-medium px-3 py-3">数量</th>
                  <th className="text-left font-medium px-3 py-3">備考</th>
                  <th className="text-left font-medium px-3 py-3"></th>
                  <th className="text-center font-medium px-3 py-3">当日</th>
                  <th className="text-left font-medium px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} className="border-b last:border-b-0 hover:bg-gray-50 align-top">
                    <td className="px-3 py-3 text-xs text-gray-500">{r.request_no ?? ""}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{r.creator}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{formatMonthDay(r.work_date)}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {formatTime(r.start_time)} 〜 {r.end_time ? formatTime(r.end_time) : ""}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {formatDuration(r.start_time, r.end_time)}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600 break-words leading-snug">{r.department_group ?? ""}</td>
                    <td className="px-3 py-3 text-sm text-gray-700 break-words leading-snug">{r.person_in_charge ?? ""}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 break-words leading-snug">{r.customer ?? ""}</td>
                    <td className="px-3 py-3 text-sm text-gray-700 break-words leading-snug">{r.title ?? ""}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 break-words leading-snug">{r.content ?? ""}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 break-words leading-snug">{r.parts_name ?? ""}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 break-words leading-snug">{r.paper_name ?? ""}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{r.quantity ?? ""}</td>
                    <td className="px-3 py-3 text-sm text-gray-500 break-words leading-snug">{r.remarks ?? ""}</td>
                    <td></td>
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={!!r.flg_same_day}
                        onChange={() => toggleSameDay(r)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Button variant="outline" size="sm" onClick={() => handleDelete(r.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
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