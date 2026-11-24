"use client"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

type Row = {
  id: string
  estimate_no: string
  customer_name: string
  contact_name: string | null
  title: string | null
  product_code: string | null
  issue_date: string
  main_qty: number
  unit_price: number
  amount: number
  is_confirmed: boolean
  drafter_name: string | null
  category: { id: string; name: string } | null
}
type Category = { id: string; name: string; is_active: boolean }

const yen = (n: number) => n.toLocaleString("ja-JP")

export default function EstimatesPage() {
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")
  const [category, setCategory] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async (skip = 0) => {
    setLoading(true)
    setError("")
    const sp = new URLSearchParams({ q, status, category, take: "100", skip: String(skip) })
    const res = await fetch(`/api/estimates?${sp.toString()}`)
    const body = await res.json().catch(() => null)
    if (!res.ok) {
      setError(body?.error ?? "読み込みに失敗しました")
      setLoading(false)
      return
    }
    setRows(prev => (skip === 0 ? body.rows : [...prev, ...body.rows]))
    setTotal(body.total)
    setLoading(false)
  }, [q, status, category])

  // 入力が止まってから検索する
  useEffect(() => {
    const t = setTimeout(() => { load(0) }, 250)
    return () => clearTimeout(t)
  }, [load])

  useEffect(() => {
    fetch("/api/estimates/categories")
      .then(r => r.json())
      .then((c: Category[]) => {
        if (Array.isArray(c)) {
          setCategories(c)
          const first = c.find(x => x.is_active)
          if (first) setNewCategory(first.id)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <h1 className="text-xl font-bold text-gray-900">見積書</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/dashboard/estimates/standards" className="px-3 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50">見積書マスタ（基準）</Link>
          <Link href="/dashboard/estimates/categories" className="px-3 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50">見積区分</Link>
          <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-2 text-sm bg-white">
            {categories.filter(c => c.is_active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button
            onClick={() => newCategory && router.push(`/dashboard/estimates/new/${newCategory}`)}
            disabled={!newCategory}
            className="flex items-center gap-1 px-3 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-40"
          >
            <Plus className="w-4 h-4" /> 新規作成
          </button>
        </div>
      </div>

      {categories.length === 0 && (
        <p className="mb-4 text-sm text-amber-700">見積書を作るには、先に「見積区分」を登録してください。</p>
      )}

      <div className="flex items-center gap-3 mb-4 flex-wrap text-sm">
        <input
          autoComplete="off"
          placeholder="番号・品名・品番・宛名・担当・メモで検索"
          value={q}
          onChange={e => setQ(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 bg-white w-80"
        />
        <select value={category} onChange={e => setCategory(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 bg-white">
          <option value="">すべての区分</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 bg-white">
          <option value="">すべての状態</option>
          <option value="draft">仮</option>
          <option value="confirmed">確定</option>
        </select>
        <span className="text-gray-400">{total.toLocaleString()}件</span>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left whitespace-nowrap">番号</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">作成日</th>
              <th className="px-3 py-2 text-left">区分</th>
              <th className="px-3 py-2 text-left">宛名</th>
              <th className="px-3 py-2 text-left">品名</th>
              <th className="px-3 py-2 text-left">品番</th>
              <th className="px-3 py-2 text-right">本番数</th>
              <th className="px-3 py-2 text-right">単価</th>
              <th className="px-3 py-2 text-right">金額</th>
              <th className="px-3 py-2 text-left">状態</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} onClick={() => router.push(`/dashboard/estimates/${r.id}`)} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer">
                <td className="px-3 py-2 whitespace-nowrap text-blue-700">{r.estimate_no}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-600">{r.issue_date}</td>
                <td className="px-3 py-2 text-gray-600">{r.category?.name ?? ""}</td>
                <td className="px-3 py-2">{r.customer_name}{r.contact_name ? <span className="text-xs text-gray-400">　{r.contact_name}</span> : null}</td>
                <td className="px-3 py-2 max-w-[360px] truncate">{r.title ?? ""}</td>
                <td className="px-3 py-2 text-gray-600">{r.product_code ?? ""}</td>
                <td className="px-3 py-2 text-right tabular-nums">{yen(r.main_qty)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.unit_price.toLocaleString("ja-JP", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</td>
                <td className="px-3 py-2 text-right tabular-nums">{yen(r.amount)}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${r.is_confirmed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{r.is_confirmed ? "確定" : "仮"}</span>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={10} className="px-3 py-6 text-center text-gray-400">該当する見積書がありません。</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {loading && <p className="mt-3 text-sm text-gray-400">読み込み中...</p>}
      {!loading && rows.length < total && (
        <button onClick={() => load(rows.length)} className="mt-3 px-4 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50">
          さらに表示（{rows.length} / {total}）
        </button>
      )}
    </div>
  )
}