"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { PC_STATUSES, PC_ROLE_CONFIRMER, formatPcRequestNo, pcStatusBadgeClass } from "@/lib/pc-takeout"

type Step = { id: string; role: string; step_order: number; approver_name: string | null; status: string }
type Req = {
  id: string
  request_no: number
  status: string
  request_date: string
  requester_name: string
  department_name: string | null
  device_name: string | null
  approval_steps: Step[]
}
type Filters = { keyword: string; status: string; mine: boolean; waiting: boolean; date_from: string; date_to: string }
const EMPTY: Filters = { keyword: "", status: "", mine: false, waiting: false, date_from: "", date_to: "" }

export default function PcTakeoutListPage() {
  const router = useRouter()
  const [records, setRecords] = useState<Req[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [f, setF] = useState<Filters>(EMPTY)
  const [applied, setApplied] = useState<Filters>(EMPTY)

  const fetchList = async (p: number, filters: Filters = f) => {
    setLoading(true)
    setError("")
    const params = new URLSearchParams({ page: String(p) })
    if (filters.keyword) params.set("keyword", filters.keyword)
    if (filters.status) params.set("status", filters.status)
    if (filters.mine) params.set("mine", "1")
    if (filters.waiting) params.set("waiting", "1")
    if (filters.date_from) params.set("date_from", filters.date_from)
    if (filters.date_to) params.set("date_to", filters.date_to)
    try {
      const res = await fetch(`/api/eapp/pc-takeout?${params.toString()}`)
      if (!res.ok) { setError("一覧の読み込みに失敗しました"); setLoading(false); return }
      const data = await res.json()
      setRecords(data.records)
      setTotal(data.total)
      setPageSize(data.page_size)
      setPage(p)
      setApplied(filters)
    } catch {
      setError("一覧の読み込みに失敗しました")
    }
    setLoading(false)
  }
  useEffect(() => { fetchList(1, EMPTY) }, [])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const fmtDate = (s: string) => s.slice(0, 10).replace(/-/g, "/")
  const confirmer = (r: Req) => r.approval_steps.find(s => s.role === PC_ROLE_CONFIRMER)?.approver_name ?? "—"
  // 進捗：承認ステップの状況を、文字で出す（押印の画像は、詳細画面で出す）
  const progress = (r: Req) => {
    if (r.approval_steps.length === 0) return "—"
    return r.approval_steps.map(s => `${s.role}${s.status === "承認済み" ? "○" : "－"}`).join(" ")
  }
  const selectClass = "w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">PC持ち出し申請</h1>
          <p className="text-sm text-gray-500 mt-1">{total}件</p>
        </div>
        <Button size="sm" onClick={() => router.push("/dashboard/eapp/pc-takeout/new")} className="flex items-center gap-1">
          <Plus className="w-4 h-4" />新規作成
        </Button>
      </div>

      <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm space-y-3">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="block text-xs text-gray-500 mb-1">キーワード</label>
            <Input value={f.keyword} onChange={e => setF({ ...f, keyword: e.target.value })}
              placeholder="申請者・部署・端末名で検索"
              onKeyDown={e => { if (e.key === "Enter") fetchList(1) }}
              autoComplete="off" />
          </div>
          <div className="w-44">
            <label className="block text-xs text-gray-500 mb-1">状態</label>
            <select value={f.status} onChange={e => setF({ ...f, status: e.target.value })} className={selectClass}>
              <option value="">すべて</option>
              {PC_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs text-gray-500 mb-1">申請日（から）</label>
            <Input type="date" value={f.date_from} onChange={e => setF({ ...f, date_from: e.target.value })} />
          </div>
          <div className="w-40">
            <label className="block text-xs text-gray-500 mb-1">申請日（まで）</label>
            <Input type="date" value={f.date_to} onChange={e => setF({ ...f, date_to: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={f.mine} onChange={e => setF({ ...f, mine: e.target.checked })} />自分の申請だけ
          </label>
          <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={f.waiting} onChange={e => setF({ ...f, waiting: e.target.checked })} />自分の承認待ちだけ
          </label>
          <Button size="sm" onClick={() => fetchList(1)} className="flex items-center gap-1"><Search className="w-4 h-4" />検索</Button>
          <Button size="sm" variant="outline" onClick={() => { setF(EMPTY); fetchList(1, EMPTY) }}>条件をクリア</Button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm px-4 py-2 rounded bg-red-50 text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : records.length === 0 ? (
        <p className="text-sm text-gray-400">申請がありません</p>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">申請No</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">申請日</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">所属部署</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">申請者</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">確認者</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">端末名</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">状態</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">進捗</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map(r => (
                  <tr key={r.id}
                    onClick={() => router.push(`/dashboard/eapp/pc-takeout/${r.id}`)}
                    className="hover:bg-blue-50 cursor-pointer h-12">
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{formatPcRequestNo(r.request_no)}</td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{fmtDate(r.request_date)}</td>
                    <td className="px-3 py-2 text-gray-500 max-w-[160px]"><div className="truncate">{r.department_name || "—"}</div></td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{r.requester_name}</td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{confirmer(r)}</td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{r.device_name || "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${pcStatusBadgeClass(r.status)}`}>{r.status}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{progress(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => fetchList(page - 1, applied)}>前へ</Button>
          <span className="text-gray-500">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => fetchList(page + 1, applied)}>次へ</Button>
        </div>
      )}
    </div>
  )
}
