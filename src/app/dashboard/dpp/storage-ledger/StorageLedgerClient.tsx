"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { Search, UploadCloud, Download, X, Archive } from "lucide-react"
type Entry = {
  id: string
  storage_location: string
  hinban: string
  category: string | null
}
function useCountUp(target: number, durationMs: number = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf: number
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])
  return value
}
function ShelfTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-flex items-center font-mono text-xs tracking-wide pl-4 pr-2.5 py-1 rounded-r-md rounded-l-sm bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 border-l-2 border-l-fuchsia-400">
      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white border border-fuchsia-300" />
      {children}
    </span>
  )
}
export default function StorageLedgerClient({ canImport, initialTotal }: { canImport: boolean; initialTotal: number }) {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [page, setPage] = useState(1)
  const [entries, setEntries] = useState<Entry[]>([])
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null)
  const [importMessage, setImportMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const countValue = useCountUp(total)
  const pageSize = 50
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQuery(query); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [query])
  const fetchEntries = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (debouncedQuery) params.set("q", debouncedQuery)
    const res = await fetch(`/api/dpp/storage-ledger?${params.toString()}`)
    const data = await res.json()
    setEntries(data.records)
    setTotal(data.total)
    setLoading(false)
  }, [page, debouncedQuery])
  useEffect(() => { fetchEntries() }, [fetchEntries])
  const handleExport = () => {
    window.location.href = "/api/dpp/storage-ledger/export"
  }
  const handleImportClick = () => fileInputRef.current?.click()
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportMessage("アップロード中...")
    setImportProgress(null)
    try {
      const presignRes = await fetch("/api/dpp/storage-ledger/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name }),
      })
      const { url, key } = await presignRes.json()
      await fetch(url, { method: "PUT", headers: { "Content-Type": "text/csv" }, body: file })
      setImportMessage("取り込み中...")
      let offset = 0
      let done = false
      let totalCount = 0
      while (!done) {
        const res = await fetch("/api/dpp/storage-ledger/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, offset }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "取り込みに失敗しました")
        offset = data.offset
        done = data.done
        totalCount = data.total
        setImportProgress({ done: Math.min(offset, totalCount), total: totalCount })
      }
      setImportMessage(`${totalCount.toLocaleString()}件を追加しました`)
      await fetchEntries()
    } catch (err: any) {
      setImportMessage(err.message ?? "取り込みに失敗しました")
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
      setTimeout(() => setImportMessage(""), 4000)
    }
  }
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Archive className="w-6 h-6 text-fuchsia-500" />データ保管台帳
          </h1>
          <p className="mt-1 text-gray-500 text-sm">
            ROM・HDD保管記録の検索台帳 —{" "}
            <span className="font-mono font-semibold text-gray-700 tabular-nums">{countValue.toLocaleString()}</span>
            <span className="ml-0.5">件収録</span>
          </p>
        </div>
        {canImport && (
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            <button
              onClick={handleImportClick}
              disabled={importing}
              className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-md border border-fuchsia-200 text-fuchsia-700 bg-fuchsia-50 hover:bg-fuchsia-100 transition-colors disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />取り込み
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />書き出し
            </button>
          </div>
        )}
      </div>
      {importMessage && (
        <div className="mb-5 flex items-center justify-between text-sm px-4 py-2.5 rounded-md bg-fuchsia-50 border border-fuchsia-200 text-gray-700">
          <span>
            {importMessage}
            {importProgress && importProgress.total > 0 && importing && (
              <span className="ml-2 text-gray-400">
                {importProgress.done.toLocaleString()} / {importProgress.total.toLocaleString()}
              </span>
            )}
          </span>
          {!importing && (
            <button onClick={() => setImportMessage("")} className="text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoComplete="off"
          placeholder="保管場所・品番・分類で検索"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div className="grid grid-cols-[minmax(140px,auto)_1fr_minmax(100px,auto)] gap-4 px-5 py-2.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-200">
          <span>保管場所</span>
          <span>品番</span>
          <span className="text-right">分類</span>
        </div>
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">読み込み中...</div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            {debouncedQuery ? "該当するデータがありません" : "データがありません"}
          </div>
        ) : (
          entries.map((e, i) => (
            <div
              key={e.id}
              className={`grid grid-cols-[minmax(140px,auto)_1fr_minmax(100px,auto)] gap-4 items-center px-5 py-2.5 text-sm hover:bg-gray-50 transition-colors ${i < entries.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <ShelfTag>{e.storage_location}</ShelfTag>
              <span className="font-mono text-gray-800">{e.hinban}</span>
              <span className="text-right text-xs">
                {e.category ? (
                  <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {e.category}
                  </span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </span>
            </div>
          ))
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 text-sm text-gray-500">
          <span>{total.toLocaleString()}件中 {((page - 1) * pageSize + 1).toLocaleString()}〜{Math.min(page * pageSize, total).toLocaleString()}件</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 disabled:opacity-40 hover:bg-gray-50"
            >
              前へ
            </button>
            <span className="font-mono text-gray-700">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 disabled:opacity-40 hover:bg-gray-50"
            >
              次へ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
