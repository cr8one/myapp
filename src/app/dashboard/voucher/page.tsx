"use client"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search } from "lucide-react"

type Step = { id: string; step_order: number; step_name: string | null; approver_name: string | null; status: string }
type Voucher = {
  id: string
  file_no: number
  doc_type: string
  direction: string
  media_type: string | null
  transaction_date: string
  partner_name: string
  amount: number
  remarks: string | null
  payment_method: string | null
  transfer_method: string | null
  registrant_name: string | null
  approval_steps: Step[]
}
type Option = { id: string; category: string; value: string }
type Filter = Record<string, string>

const emptyFilter: Filter = {
  file_no: "", doc_type: "", date_from: "", date_to: "", partner: "",
  amount_from: "", amount_to: "", payment_method: "", registrant: "",
}
const inputCls = "w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white"
const pad = (n: number) => String(n).padStart(6, "0")
const fmtDate = (s: string) => s.slice(0, 10).replace(/-/g, "/")

function StepCell({ steps, order }: { steps: Step[]; order: number }) {
  const s = steps.find(x => x.step_order === order)
  if (!s) return <span className="text-gray-300">-</span>
  const done = s.status !== "未承認"
  return (
    <span className="flex items-center gap-1">
      <span className="truncate">{s.approver_name ?? ""}</span>
      <span className={`text-xs px-1.5 rounded ${done ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{done ? "済" : "未"}</span>
    </span>
  )
}

export default function VoucherListPage() {
  const router = useRouter()
  const [records, setRecords] = useState<Voucher[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<Filter>(emptyFilter)
  const [options, setOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async (p: number, f: Filter) => {
    setLoading(true)
    setError("")
    const q = new URLSearchParams({ page: String(p) })
    Object.entries(f).forEach(([k, v]) => { if (v) q.set(k, v) })
    const res = await fetch(`/api/voucher?${q.toString()}`)
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      setError(data?.error ?? "読み込みに失敗しました")
      setRecords([])
      setTotal(0)
    } else {
      setRecords(data.records)
      setTotal(data.total)
      setPageSize(data.page_size)
      setPage(p)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load(1, emptyFilter)
    fetch("/api/voucher/masters/options")
      .then(r => r.json())
      .then(d => setOptions(Array.isArray(d) ? d : []))
      .catch(() => setOptions([]))
  }, [load])

  const set = (k: string, v: string) => setFilter(prev => ({ ...prev, [k]: v }))
  const optionsOf = (category: string) => options.filter(o => o.category === category)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">証憑一覧</h1>
        <button onClick={() => router.push("/dashboard/voucher/new")} className="flex items-center gap-1 px-3 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800">
          <Plus className="w-4 h-4" /> 新規登録
        </button>
      </div>

      <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
        <div className="grid grid-cols-6 gap-3">
          <div className="space-y-1"><label className="text-xs text-gray-500">ファイルNo</label>
            <input autoComplete="off" type="number" className={inputCls} value={filter.file_no} onChange={e => set("file_no", e.target.value)} />
          </div>
          <div className="space-y-1"><label className="text-xs text-gray-500">取引日（から）</label>
            <input autoComplete="off" type="date" className={inputCls} value={filter.date_from} onChange={e => set("date_from", e.target.value)} />
          </div>
          <div className="space-y-1"><label className="text-xs text-gray-500">取引日（まで）</label>
            <input autoComplete="off" type="date" className={inputCls} value={filter.date_to} onChange={e => set("date_to", e.target.value)} />
          </div>
          <div className="space-y-1 col-span-3"><label className="text-xs text-gray-500">取引先名</label>
            <input autoComplete="off" className={inputCls} value={filter.partner} onChange={e => set("partner", e.target.value)} />
          </div>
          <div className="space-y-1"><label className="text-xs text-gray-500">金額（から）</label>
            <input autoComplete="off" type="number" className={inputCls} value={filter.amount_from} onChange={e => set("amount_from", e.target.value)} />
          </div>
          <div className="space-y-1"><label className="text-xs text-gray-500">金額（まで）</label>
            <input autoComplete="off" type="number" className={inputCls} value={filter.amount_to} onChange={e => set("amount_to", e.target.value)} />
          </div>
          <div className="space-y-1"><label className="text-xs text-gray-500">書類区分</label>
            <select className={inputCls} value={filter.doc_type} onChange={e => set("doc_type", e.target.value)}>
              <option value="">すべて</option>
              {optionsOf("doc_type").map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
            </select>
          </div>
          <div className="space-y-1"><label className="text-xs text-gray-500">支払方法</label>
            <select className={inputCls} value={filter.payment_method} onChange={e => set("payment_method", e.target.value)}>
              <option value="">すべて</option>
              {optionsOf("payment_method").map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
            </select>
          </div>
          <div className="space-y-1"><label className="text-xs text-gray-500">登録者</label>
            <input autoComplete="off" className={inputCls} value={filter.registrant} onChange={e => set("registrant", e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => load(1, filter)} className="flex items-center gap-1 px-4 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800">
            <Search className="w-4 h-4" /> 検索
          </button>
          <button onClick={() => { setFilter(emptyFilter); load(1, emptyFilter) }} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">条件クリア</button>
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="border border-gray-200 rounded-xl bg-white overflow-x-auto">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col style={{ width: 80 }} /><col style={{ width: 72 }} /><col style={{ width: 56 }} /><col style={{ width: 80 }} />
            <col style={{ width: 96 }} /><col /><col style={{ width: 100 }} /><col style={{ width: 180 }} />
            <col style={{ width: 72 }} /><col style={{ width: 80 }} /><col style={{ width: 96 }} />
            <col style={{ width: 120 }} /><col style={{ width: 120 }} />
          </colgroup>
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="px-2 py-2 text-left">No.</th><th className="px-2 py-2 text-left">書類区分</th>
              <th className="px-2 py-2 text-left">受発</th><th className="px-2 py-2 text-left">媒体</th>
              <th className="px-2 py-2 text-left">取引日</th><th className="px-2 py-2 text-left">取引先名</th>
              <th className="px-2 py-2 text-right">金額</th><th className="px-2 py-2 text-left">備考</th>
              <th className="px-2 py-2 text-left">支払方法</th><th className="px-2 py-2 text-left">振込</th>
              <th className="px-2 py-2 text-left">登録者</th><th className="px-2 py-2 text-left">精査</th>
              <th className="px-2 py-2 text-left">検印</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={13} className="px-3 py-6 text-center text-gray-400">読み込み中...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={13} className="px-3 py-6 text-center text-gray-400">該当する証憑がありません。</td></tr>
            ) : records.map(v => (
              <tr key={v.id} onClick={() => router.push(`/dashboard/voucher/${v.id}`)} className="border-t border-gray-100 hover:bg-slate-50 cursor-pointer">
                <td className="px-2 py-2 font-mono">{pad(v.file_no)}</td>
                <td className="px-2 py-2">{v.doc_type}</td>
                <td className="px-2 py-2">{v.direction}</td>
                <td className="px-2 py-2">{v.media_type ?? ""}</td>
                <td className="px-2 py-2">{fmtDate(v.transaction_date)}</td>
                <td className="px-2 py-2 truncate" title={v.partner_name}>{v.partner_name}</td>
                <td className="px-2 py-2 text-right">{v.amount.toLocaleString("ja-JP")}</td>
                <td className="px-2 py-2 text-xs text-gray-500 line-clamp-2" title={v.remarks ?? ""}>{v.remarks ?? ""}</td>
                <td className="px-2 py-2">{v.payment_method ?? ""}</td>
                <td className="px-2 py-2">{v.transfer_method ?? ""}</td>
                <td className="px-2 py-2 truncate">{v.registrant_name ?? ""}</td>
                <td className="px-2 py-2"><StepCell steps={v.approval_steps} order={1} /></td>
                <td className="px-2 py-2"><StepCell steps={v.approval_steps} order={2} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
        <span>{total.toLocaleString("ja-JP")}件</span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1 || loading} onClick={() => load(page - 1, filter)} className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40">前へ</button>
          <span>{page} / {totalPages}</span>
          <button disabled={page >= totalPages || loading} onClick={() => load(page + 1, filter)} className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40">次へ</button>
        </div>
      </div>
    </div>
  )
}
