"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { SLIP_TYPES, SLIP_STATUSES, slipTypeLabel, statusBadgeClass } from "@/lib/accounting-slip-types"

type Step = { stage: string; step_order: number; position_name: string | null; approver_name: string | null; status: string }
type Slip = {
  id: string
  slip_no: number
  slip_type: string
  title: string
  status: string
  slip_date: string
  amount: number
  requester_name: string
  department_name: string | null
  approval_steps: Step[]
}
type Filters = { keyword: string; slip_type: string; status: string; mine: boolean; date_from: string; date_to: string }
const EMPTY: Filters = { keyword: "", slip_type: "", status: "", mine: false, date_from: "", date_to: "" }

export default function AccountingSlipsPage() {
  const router = useRouter()
  const [records, setRecords] = useState<Slip[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [f, setF] = useState<Filters>(EMPTY)
  const [applied, setApplied] = useState<Filters>(EMPTY)

  const fetchSlips = async (p: number = 1, cond: Filters = f) => {
    setLoading(true)
    setError("")
    const params = new URLSearchParams()
    params.set("page", String(p))
    if (cond.keyword) params.set("keyword", cond.keyword)
    if (cond.slip_type) params.set("slip_type", cond.slip_type)
    if (cond.status) params.set("status", cond.status)
    if (cond.mine) params.set("mine", "1")
    if (cond.date_from) params.set("date_from", cond.date_from)
    if (cond.date_to) params.set("date_to", cond.date_to)
    try {
      const res = await fetch(`/api/eapp/accounting/slips?${params.toString()}`)
      if (!res.ok) throw new Error("一覧を取得できませんでした")
      const data = await res.json()
      setRecords(data.records)
      setTotal(data.total)
      setPageSize(data.page_size)
      setPage(p)
      setApplied(cond)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { fetchSlips(1, EMPTY) }, [])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const fmtDate = (s: string) => s.slice(0, 10).replace(/-/g, "/")
  const waiting = (r: Slip) => {
    if (r.status === "下書き" || r.status === "承認完了") return null
    return r.approval_steps.find(s => s.status !== "承認済み")?.approver_name ?? null
  }
  const selectClass = "w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">経理精算</h1>
          <p className="text-sm text-gray-500 mt-1">{total}件</p>
        </div>
        <Button size="sm" onClick={() => router.push("/dashboard/eapp/accounting/new")} className="flex items-center gap-1">
          <Plus className="w-4 h-4" />新規作成
        </Button>
      </div>

      <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm space-y-3">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="block text-xs text-gray-500 mb-1">キーワード</label>
            <Input value={f.keyword} onChange={e => setF({ ...f, keyword: e.target.value })}
              placeholder="タイトル・起案者で検索"
              onKeyDown={e => { if (e.key === "Enter") fetchSlips(1) }}
              autoComplete="off" />
          </div>
          <div className="w-44">
            <label className="block text-xs text-gray-500 mb-1">種類</label>
            <select value={f.slip_type} onChange={e => setF({ ...f, slip_type: e.target.value })} className={selectClass}>
              <option value="">すべて</option>
              {SLIP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs text-gray-500 mb-1">状態</label>
            <select value={f.status} onChange={e => setF({ ...f, status: e.target.value })} className={selectClass}>
              <option value="">すべて</option>
              {SLIP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs text-gray-500 mb-1">伝票の日付（から）</label>
            <Input type="date" value={f.date_from} onChange={e => setF({ ...f, date_from: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">伝票の日付（まで）</label>
            <Input type="date" value={f.date_to} onChange={e => setF({ ...f, date_to: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 h-10">
            <input type="checkbox" checked={f.mine} onChange={e => setF({ ...f, mine: e.target.checked })} />
            自分の伝票だけ
          </label>
          <Button onClick={() => fetchSlips(1)} className="flex items-center gap-1">
            <Search className="w-4 h-4" />検索
          </Button>
          <Button variant="outline" onClick={() => { setF(EMPTY); fetchSlips(1, EMPTY) }}>クリア</Button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm px-4 py-2 rounded bg-red-50 text-red-600">{error}</p>}

      {loading ? (
        <p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p>
      ) : records.length === 0 ? (
        <p className="text-center text-gray-500 py-8">表示できる伝票がありません。</p>
      ) : (
        <div className="border rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">伝票番号</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">種類</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">タイトル</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">日付</th>
                  <th className="text-right px-3 py-2.5 text-gray-600 font-medium">金額</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">起案者</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">部署</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">状態</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">承認待ち</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map(r => (
                  <tr key={r.id}
                    onClick={() => router.push(`/dashboard/eapp/accounting/${r.id}`)}
                    className="hover:bg-blue-50 cursor-pointer h-12">
                    <td className="px-3 py-2 text-gray-500">{r.slip_no}</td>
                    <td className="px-3 py-2">{slipTypeLabel(r.slip_type)}</td>
                    <td className="px-3 py-2 font-medium max-w-[220px]"><div className="truncate">{r.title}</div></td>
                    <td className="px-3 py-2 text-gray-500">{fmtDate(r.slip_date)}</td>
                    <td className="px-3 py-2 text-right">{r.amount.toLocaleString()}円</td>
                    <td className="px-3 py-2 text-gray-500">{r.requester_name}</td>
                    <td className="px-3 py-2 text-gray-500 max-w-[140px]"><div className="truncate">{r.department_name ?? "—"}</div></td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${statusBadgeClass(r.status)}`}>{r.status}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-500">{waiting(r) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => fetchSlips(page - 1, applied)}>前へ</Button>
          <span className="text-gray-500">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => fetchSlips(page + 1, applied)}>次へ</Button>
        </div>
      )}
    </div>
  )
}
