"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Download, Upload } from "lucide-react"
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
  const handleExport = () => {
    const params = new URLSearchParams({ keyword })
    window.location.href = `/api/address-book/export?${params}`
  }
  const handleImport = async (file: File) => {
    setImporting(true)
    setImportProgress("アップロード中...")
    // S3 presigned URL取得
    const presignRes = await fetch("/api/address-book/presign")
    const { url, key } = await presignRes.json()
    // S3にPUT
    await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": "text/csv" } })
    // チャンク処理
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
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
          >
            <Download className="w-4 h-4" /> エクスポート
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" /> {importing ? importProgress : "インポート"}
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = "" }} />
          <button
            onClick={() => router.push("/dashboard/address-book/new")}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700"
          >
            <Plus className="w-4 h-4" /> 新規登録
          </button>
        </div>
      </div>
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="会社名・氏名・部門名・住所などで検索..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
          autoComplete="off"
        />
      </div>
      {loading ? (
        <p className="text-gray-400 text-sm">読み込み中...</p>
      ) : records.length === 0 ? (
        <p className="text-gray-400 text-sm">データがありません</p>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="px-4 py-2 text-left font-medium">No</th>
                <th className="px-4 py-2 text-left font-medium">会社名</th>
                <th className="px-4 py-2 text-left font-medium">部門・役職</th>
                <th className="px-4 py-2 text-left font-medium">氏名</th>
                <th className="px-4 py-2 text-left font-medium">住所</th>
                <th className="px-4 py-2 text-left font-medium">更新日</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr
                  key={r.id}
                  onClick={() => router.push(`/dashboard/address-book/${r.id}`)}
                  className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-2 font-mono text-gray-500">{r.uid}</td>
                  <td className="px-4 py-2">
                    <p className="font-medium text-gray-800">{r.company_name || "—"}</p>
                    {r.company_name_kana && <p className="text-xs text-gray-400">{r.company_name_kana}</p>}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {r.contacts.length > 0 ? [r.contacts[0].department, r.contacts[0].position].filter(Boolean).join(" / ") : "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-800">
                    {r.contacts.length > 0 && r.contacts[0].name ? `${r.contacts[0].name}${r.contacts[0].honorific ? ` ${r.contacts[0].honorific}` : ""}` : "—"}
                    {r.contacts.length > 1 && <span className="text-xs text-gray-400 ml-1">+{r.contacts.length - 1}</span>}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {r.postal_code && <span className="text-xs">〒{r.postal_code} </span>}
                    {r.address1}{r.address2}
                    {!r.postal_code && !r.address1 && !r.address2 && "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-400 text-xs">{new Date(r.updated_at).toLocaleDateString("ja-JP")}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
