"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { List } from "lucide-react"
type OutputList = {
  id: string; uid: string; name: string; remarks: string | null
  created_at: string; updated_at: string
  _count: { items: number }
}
export default function OutputListsPage() {
  const router = useRouter()
  const [records, setRecords] = useState<OutputList[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const fetchRecords = async (p = page) => {
    setLoading(true)
    const res = await fetch(`/api/output-lists?page=${p}`)
    const data = await res.json()
    setRecords(data.records)
    setTotal(data.total)
    setLoading(false)
  }
  useEffect(() => { fetchRecords(1) }, [])
  const totalPages = Math.ceil(total / 50)
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">出力リスト</h1>
      </div>
      {loading ? (
        <p className="text-gray-400 text-sm">読み込み中...</p>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <List className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">出力リストがありません</p>
          <p className="text-xs mt-1">住所録一覧でチェックして「出力リストに追加」から作成できます</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="px-4 py-2 text-left font-medium">No</th>
                <th className="px-4 py-2 text-left font-medium">リスト名</th>
                <th className="px-4 py-2 text-left font-medium">件数</th>
                <th className="px-4 py-2 text-left font-medium">作成日</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} onClick={() => router.push(`/dashboard/address-book/output-lists/${r.id}`)}
                  className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-2 font-mono text-gray-500">{r.uid}</td>
                  <td className="px-4 py-2">
                    <p className="font-medium text-gray-800">{r.name}</p>
                    {r.remarks && <p className="text-xs text-gray-400">{r.remarks}</p>}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{r._count.items}件</td>
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
