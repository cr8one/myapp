"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { Search, UploadCloud, Download, X } from "lucide-react"
type Entry = {
  id: string
  storage_location: string
  hinban: string
  category: string | null
}
const PAPER = "#EDE7D9"
const INK = "#23282E"
const LINE = "#D9D2C2"
const BRASS = "#A8791E"
const TEAL = "#2F4858"
const MUTED = "#8A8272"
function useCountUp(target: number, durationMs: number = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf: number
    const start = performance.now()
    const from = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(from + (target - from) * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])
  return value
}
function ShelfTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="relative inline-flex items-center font-mono text-[13px] tracking-wide pl-4 pr-3 py-1 rounded-r-md"
      style={{
        color: INK,
        background: "#F7F2E4",
        border: `1px solid ${BRASS}`,
        borderLeftWidth: 3,
      }}
    >
      <span
        className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
        style={{ background: PAPER, border: `1px solid ${BRASS}` }}
      />
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
    <div className="min-h-full" style={{ background: PAPER }}>
      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: BRASS }}>
              Data Storage Ledger
            </p>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-5xl font-bold tabular-nums" style={{ color: INK }}>
                {countValue.toLocaleString()}
              </span>
              <span className="text-sm" style={{ color: MUTED }}>件収録</span>
            </div>
            <p className="text-sm mt-1" style={{ color: MUTED }}>ROM・HDD保管記録の検索台帳</p>
          </div>
          {canImport && (
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              <button
                onClick={handleImportClick}
                disabled={importing}
                className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-md border transition-colors disabled:opacity-50"
                style={{ borderColor: BRASS, color: BRASS, background: "#F7F2E4" }}
              >
                <UploadCloud className="w-4 h-4" />取り込み
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-md border transition-colors"
                style={{ borderColor: TEAL, color: TEAL, background: "#EEF3F4" }}
              >
                <Download className="w-4 h-4" />書き出し
              </button>
            </div>
          )}
        </div>
        {importMessage && (
          <div
            className="mb-6 flex items-center justify-between text-sm px-4 py-2.5 rounded-md"
            style={{ background: "#F7F2E4", border: `1px solid ${BRASS}`, color: INK }}
          >
            <span>
              {importMessage}
              {importProgress && importProgress.total > 0 && importing && (
                <span className="ml-2" style={{ color: MUTED }}>
                  {importProgress.done.toLocaleString()} / {importProgress.total.toLocaleString()}
                </span>
              )}
            </span>
            {!importing && (
              <button onClick={() => setImportMessage("")} style={{ color: MUTED }}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: MUTED }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
            placeholder="保管場所・品番・分類で検索"
            className="w-full pl-11 pr-4 py-3 rounded-md text-sm outline-none focus:ring-2 transition-shadow"
            style={{ background: "#fff", border: `1px solid ${LINE}`, color: INK }}
          />
        </div>
        <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
          <div
            className="grid grid-cols-[minmax(140px,auto)_1fr_minmax(100px,auto)] gap-4 px-5 py-2.5 text-xs font-semibold tracking-wide"
            style={{ background: "#E4DCC7", color: MUTED, borderBottom: `1px solid ${LINE}` }}
          >
            <span>保管場所</span>
            <span>品番</span>
            <span className="text-right">分類</span>
          </div>
          {loading ? (
            <div className="py-16 text-center text-sm" style={{ color: MUTED }}>読み込み中...</div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: MUTED }}>
              {debouncedQuery ? "該当するデータがありません" : "データがありません"}
            </div>
          ) : (
            entries.map((e, i) => (
              <div
                key={e.id}
                className="grid grid-cols-[minmax(140px,auto)_1fr_minmax(100px,auto)] gap-4 items-center px-5 py-2.5 text-sm transition-colors hover:bg-black/[0.02]"
                style={{
                  background: i % 2 === 0 ? "#fff" : "#FBF9F4",
                  borderBottom: i < entries.length - 1 ? `1px solid ${LINE}` : "none",
                }}
              >
                <ShelfTag>{e.storage_location}</ShelfTag>
                <span className="font-mono" style={{ color: INK }}>{e.hinban}</span>
                <span className="text-right text-xs">
                  {e.category ? (
                    <span
                      className="inline-block px-2 py-0.5 rounded-full"
                      style={{ background: "#EEF3F4", color: TEAL, border: `1px solid ${TEAL}33` }}
                    >
                      {e.category}
                    </span>
                  ) : (
                    <span style={{ color: MUTED }}>—</span>
                  )}
                </span>
              </div>
            ))
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5 text-sm" style={{ color: MUTED }}>
            <span>{total.toLocaleString()}件中 {((page - 1) * pageSize + 1).toLocaleString()}〜{Math.min(page * pageSize, total).toLocaleString()}件</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded border disabled:opacity-40"
                style={{ borderColor: LINE, color: INK }}
              >
                前へ
              </button>
              <span className="font-mono">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded border disabled:opacity-40"
                style={{ borderColor: LINE, color: INK }}
              >
                次へ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
