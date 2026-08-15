"use client"
import React, { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Upload, X, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, ArrowLeft, Search } from "lucide-react"

type ShelfStockRecord = {
  id: string
  shelf_no: string
  shelf_rack: string | null
  shelf_row: string | null
  shelf_col: string | null
  shelf_status: string | null
  item_code: string | null
  item_name: string | null
  lot_no: string | null
  remarks: string | null
  category: string | null
  stocked_at: string | null
  stock_count: number | null
  imported_at: string
}

type ImportStatus = "idle" | "uploading" | "importing" | "done" | "error"

const PAGE_SIZE = 50

export default function ShelfStockClient({ isAdmin }: { isAdmin: boolean }) {
  const [records, setRecords] = useState<ShelfStockRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState("")
  const [rack, setRack] = useState("")
  const [racks, setRacks] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const [showImport, setShowImport] = useState(false)
  const [showLayout, setShowLayout] = useState(false)
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle")
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState({ count: 0, total: 0 })
  const [importError, setImportError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const fetchRecords = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (keyword) params.set("keyword", keyword)
      if (rack) params.set("rack", rack)
      params.set("page", String(p))
      const res = await fetch(`/api/dlms/shelf-stock?${params.toString()}`)
      const data = await res.json()
      setRecords(data.records ?? [])
      setTotal(data.total ?? 0)
      setRacks(data.racks ?? [])
      setPage(p)
    } finally {
      setLoading(false)
    }
  }, [keyword, rack])

  useEffect(() => {
    fetchRecords(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, rack])

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
      const presignRes = await fetch("/api/dlms/shelf-stock/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: importFile.name }),
      })
      if (!presignRes.ok) throw new Error()
      const { url, key } = await presignRes.json()
      await fetch(url, {
        method: "PUT",
        body: importFile,
        headers: { "Content-Type": "application/vnd.ms-excel" },
      })
      setImportStatus("importing")
      let offset = 0
      let total = 0
      while (true) {
        const res = await fetch("/api/dlms/shelf-stock/import", {
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

  const formatDateTime = (v: string | null) => {
    if (!v) return "-"
    const d = new Date(v)
    if (isNaN(d.getTime())) return "-"
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  }

  const Pagination = () => (
    <div className="flex items-center justify-between mb-3 px-1">
      <span className="text-xs text-gray-400">{total}件中 {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}〜{Math.min(page * PAGE_SIZE, total)}件</span>
      <div className="flex items-center gap-1">
        <button onClick={() => fetchRecords(page - 1)} disabled={page <= 1}
          className="p-1.5 rounded border text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-500 px-2">{page} / {totalPages}</span>
        <button onClick={() => fetchRecords(page + 1)} disabled={page >= totalPages}
          className="p-1.5 rounded border text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-[1700px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/dashboard/dlms" className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-1">
            <ArrowLeft className="w-3 h-3" />DLMSダッシュボードへ戻る
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">棚管理</h1>
          <p className="text-sm text-gray-500 mt-1">{total}件</p>
        </div>
        {isAdmin && (
          <Button variant="outline" onClick={() => setShowImport(s => !s)} className="flex items-center gap-1.5">
            <Upload className="w-4 h-4" />棚卸しデータ取込
          </Button>
        )}
      </div>

      {isAdmin && showImport && (
        <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm space-y-3">
          {importStatus === "idle" && (
            <div className="flex items-center gap-3 flex-wrap">
              <input ref={fileInputRef} type="file" accept=".xls,.xlsx"
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
          <p className="text-xs text-gray-400">※取込は全件洗い替えです。前回の取込内容はすべて削除され、新しいデータに置き換わります。</p>
        </div>
      )}

      <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="棚No.・品名コード・品名・ロットNo.で検索"
            autoComplete="off"
            className="w-full h-9 pl-9 pr-3 border rounded text-sm"
          />
        </div>
        {racks.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {racks.map(r => (
              <button
                key={r}
                onClick={() => setRack(rack === r ? "" : r)}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                  rack === r ? "bg-gray-800 text-white border-gray-800" : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"
                }`}
              >
                棚{r}
              </button>
            ))}
          </div>
        )}
      </div>

{racks.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowLayout(true)}
              className="px-2.5 py-1 rounded-full text-xs border bg-white border-gray-200 text-gray-500 hover:border-gray-400 transition-colors"
            >
              棚配置図
            </button>
          </div>
        )}

        {showLayout && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowLayout(false)}>
            <div className="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-bold text-gray-800">棚配置図</h2>
                <button onClick={() => setShowLayout(false)} className="text-gray-400 hover:text-gray-600 text-sm">閉じる</button>
              </div>
              <img src="/shelf-layout.png" alt="棚配置図" className="w-full h-auto" />
            </div>
          </div>
        )}

      <Pagination />

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col style={{ width: "9%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "7%" }} />
          </colgroup>
          <thead>
            <tr className="bg-gray-50 border-b text-xs text-gray-500">
              <th className="px-3 py-2 text-left font-medium">棚No.</th>
              <th className="px-3 py-2 text-left font-medium">状態</th>
              <th className="px-3 py-2 text-left font-medium">品名コード</th>
              <th className="px-3 py-2 text-left font-medium">品名</th>
              <th className="px-3 py-2 text-left font-medium">ロットNo.</th>
              <th className="px-3 py-2 text-left font-medium">備考</th>
              <th className="px-3 py-2 text-left font-medium">区分</th>
              <th className="px-3 py-2 text-left font-medium">入庫日時</th>
              <th className="px-3 py-2 text-right font-medium">在庫数</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-gray-400 text-sm">読み込み中...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-gray-400 text-sm">データがありません</td></tr>
            ) : (
              records.map(r => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-3 py-2 font-bold text-gray-800">{r.shelf_no}</td>
                  <td className="px-3 py-2 text-gray-400 text-xs">{r.shelf_status || "-"}</td>
                  <td className="px-3 py-2 text-gray-700 truncate" title={r.item_code ?? ""}>{r.item_code || "-"}</td>
                  <td className="px-3 py-2 text-gray-800 truncate" title={r.item_name ?? ""}>{r.item_name || "-"}</td>
                  <td className="px-3 py-2 text-gray-500 truncate" title={r.lot_no ?? ""}>{r.lot_no || "-"}</td>
                  <td className="px-3 py-2 text-gray-400 truncate text-xs" title={r.remarks ?? ""}>{r.remarks || "-"}</td>
                  <td className="px-3 py-2 text-gray-400 text-xs">{r.category || "-"}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{formatDateTime(r.stocked_at)}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{r.stock_count ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3">
        <Pagination />
      </div>
    </div>
  )
}
