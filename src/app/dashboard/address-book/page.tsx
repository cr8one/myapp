"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Download, Upload, ChevronDown, ChevronRight } from "lucide-react"
type AddressBookContact = {
  id: string
  department: string | null
  position: string | null
  name: string | null
  honorific: string | null
  sort_order: number
}
type AddressBookRecord = {
  id: string
  uid: string
  company_name: string | null
  company_name_kana: string | null
  postal_code: string | null
  address1: string | null
  address2: string | null
  department_in_charge: string | null
  remarks: string | null
  created_at: string
  updated_at: string
  contacts: AddressBookContact[]
}
export default function AddressBookPage() {
  const router = useRouter()
  const [records, setRecords] = useState<AddressBookRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState("")
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const fileRef = useRef<HTMLInputElement>(null)
  const fetchRecords = async (p = page) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), keyword })
    const res = await fetch(`/api/address-book?${params}`)
    const data = await res.json()
    setRecords(data.records)
    setTotal(data.total)
    setLoading(false)
  }
  useEffect(() => { fetchRecords(1); setPage(1) }, [keyword])
  const totalPages = Math.ceil(total / 50)
  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const handleExport = () => {
    const params = new URLSearchParams({ keyword })
    window.location.href = `/api/address-book/export?${params}`
  }
  const handleImport = async (file: File) => {
    setImporting(true)
    setImportProgress("アップロード中...")
    const presignRes = await fetch("/api/address-book/presign")
    const { url, key } = await presignRes.json()
    await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": "text/csv" } })
    let offset = 0
    while (true) {
      const res = await fetch("/api/address-book/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, offset }),
      })
      const data = await res.json()
      offset = data.offset
      setImportProgress(`処理中... ${offset} / ${data.total} 件`)
      if (data.done) break
    }
    setImportProgress(null)
    setImporting(false)
    fetchRecords(1)
    setPage(1)
  }
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">住所録</h1>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
            <Download className="w-4 h-4" /> エクスポート
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={importing}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50">
            <Upload className="w-4 h-4" /> {importing ? importProgress : "インポート"}
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = "" }} />
          <button onClick={() => router.push("/dashboard/address-book/new")}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700">
            <Plus className="w-4 h-4" /> 新規登録
          </button>
        </div>
      </div>
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="会社名・氏名・部門名・住所などで検索..."
          value={keyword} onChange={e => setKeyword(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm" autoComplete="off" />
      </div>
      {loading ? (
        <p className="text-gray-400 text-sm">読み込み中...</p>
      ) : records.length === 0 ? (
        <p className="text-gray-400 text-sm">データがありません</p>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
          {records.map((r, idx) => {
            const isExpanded = expandedIds.has(r.id)
            const hasContacts = r.contacts.length > 0
            return (
              <div key={r.id} className={idx > 0 ? "border-t border-gray-100" : ""}>
                {/* 会社行 */}
                <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/dashboard/address-book/${r.id}`)}>
                  {/* 展開ボタン */}
                  <button
                    onClick={e => toggleExpand(r.id, e)}
                    className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 ${!hasContacts ? "invisible" : ""}`}
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {/* No */}
                  <span className="font-mono text-xs text-gray-400 w-14 flex-shrink-0">{r.uid}</span>
                  {/* 会社名 */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{r.company_name || "—"}</p>
                    {r.company_name_kana && <p className="text-xs text-gray-400 truncate">{r.company_name_kana}</p>}
                  </div>
                  {/* 住所 */}
                  <div className="text-xs text-gray-500 flex-shrink-0 hidden sm:block w-48 truncate">
                    {r.postal_code && <span>〒{r.postal_code} </span>}
                    {r.address1}
                    {!r.postal_code && !r.address1 && "—"}
                  </div>
                  {/* 担当部署 */}
                  <div className="text-xs text-gray-500 flex-shrink-0 hidden md:block w-20 truncate">
                    {r.department_in_charge || "—"}
                  </div>
                  {/* 担当者数バッジ */}
                  <div className="flex-shrink-0 w-16 text-right">
                    {hasContacts && (
                      <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                        {r.contacts.length}名
                      </span>
                    )}
                  </div>
                  {/* 更新日 */}
                  <span className="text-xs text-gray-400 flex-shrink-0 w-20 text-right hidden lg:block">
                    {new Date(r.updated_at).toLocaleDateString("ja-JP")}
                  </span>
                </div>
                {/* 担当者行（アコーディオン） */}
                {isExpanded && hasContacts && (
                  <div className="bg-amber-50/40 border-t border-amber-100">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-400 border-b border-amber-100">
                          <th className="pl-12 pr-4 py-1.5 text-left font-medium w-8"></th>
                          <th className="px-4 py-1.5 text-left font-medium">部門名</th>
                          <th className="px-4 py-1.5 text-left font-medium">役職名</th>
                          <th className="px-4 py-1.5 text-left font-medium">氏名</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.contacts.map((c, i) => (
                          <tr key={c.id} className={i > 0 ? "border-t border-amber-100" : ""}>
                            <td className="pl-12 pr-4 py-1.5 text-gray-300">{i + 1}</td>
                            <td className="px-4 py-1.5 text-gray-600">{c.department || "—"}</td>
                            <td className="px-4 py-1.5 text-gray-600">{c.position || "—"}</td>
                            <td className="px-4 py-1.5 text-gray-800">
                              {c.name ? `${c.name}${c.honorific ? ` ${c.honorific}` : ""}` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">{total}件中 {(page - 1) * 50 + 1}〜{Math.min(page * 50, total)}件</p>
          <div className="flex gap-2">
            <button onClick={() => { setPage(p => p - 1); fetchRecords(page - 1) }} disabled={page === 1}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">← 前</button>
            <span className="px-3 py-1.5 text-sm">{page} / {totalPages}</span>
            <button onClick={() => { setPage(p => p + 1); fetchRecords(page + 1) }} disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">次 →</button>
          </div>
        </div>
      )}
    </div>
  )
}
