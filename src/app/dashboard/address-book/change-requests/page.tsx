"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
const STATUSES = ["依頼中", "修正中", "済"]
const STATUS_COLORS: Record<string, string> = {
  "依頼中": "bg-amber-100 text-amber-700",
  "修正中": "bg-blue-100 text-blue-700",
  "済": "bg-green-100 text-green-700",
}
type ChangeRequest = {
  id: string; uid: string; status: string; created_at: string
  address_book: { uid: string; company_name: string | null }
  requester: { name: string | null; email: string } | null
  items: { id: string }[]
}
export default function AddressBookChangeRequestsPage() {
  const router = useRouter()
  const [records, setRecords] = useState<ChangeRequest[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const fetchRecords = async (p = page) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), ...(status ? { status } : {}) })
    const res = await fetch(`/api/address-book/change-requests?${params}`)
    const data = await res.json()
    setRecords(data.records)
    setTotal(data.total)
    setLoading(false)
  }
  useEffect(() => { fetchRecords(1); setPage(1) }, [status])
  const totalPages = Math.ceil(total / 50)
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">変更依頼一覧</h1>
      </div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setStatus("")}
          className={`px-3 py-1.5 text-sm rounded-lg border ${status === "" ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 hover:bg-gray-50"}`}>
          すべて
        </button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1.5 text-sm rounded-lg border ${status === s ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 hover:bg-gray-50"}`}>
            {s}
          </button>
        ))}
      </div>
      {loading ? (
        <p className="text-gray-400 text-sm">読み込み中...</p>
      ) : records.length === 0 ? (
        <p className="text-gray-400 text-sm">データがありません</p>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="px-4 py-2 text-left font-medium">依頼No</th>
                <th className="px-4 py-2 text-left font-medium">ステータス</th>
                <th className="px-4 py-2 text-left font-medium">住所録</th>
                <th className="px-4 py-2 text-left font-medium">依頼者</th>
                <th className="px-4 py-2 text-left font-medium">変更項目数</th>
                <th className="px-4 py-2 text-left font-medium">依頼日</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} onClick={() => router.push(`/dashboard/address-book/change-requests/${r.id}`)}
                  className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-2 font-mono text-gray-500">{r.uid}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-2">
                    <p className="font-medium text-gray-800">{r.address_book.company_name || "—"}</p>
                    <p className="text-xs text-gray-400">No.{r.address_book.uid}</p>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{r.requester?.name ?? r.requester?.email ?? "—"}</td>
                  <td className="px-4 py-2 text-gray-600">{r.items.length}件</td>
                  <td className="px-4 py-2 text-gray-400 text-xs">{new Date(r.created_at).toLocaleDateString("ja-JP")}</td>
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
