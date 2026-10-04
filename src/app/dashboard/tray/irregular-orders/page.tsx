"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

type Order = { id: string; order_no: string; status: string; request_date: string; title: string; requester_name: string }

const STATUS_STYLE: Record<string, string> = {
  "作成中": "bg-gray-100 text-gray-600",
  "承認依頼中": "bg-yellow-100 text-yellow-700",
  "承認済": "bg-green-100 text-green-700",
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })
}

export default function IrregularOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [title, setTitle] = useState("")
  const [creating, setCreating] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch("/api/tray/irregular-orders")
    if (res.ok) setOrders(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!title.trim()) { setError("タイトルを入力してください"); return }
    setError(""); setCreating(true)
    const res = await fetch("/api/tray/irregular-orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    })
    const d = await res.json().catch(() => ({}))
    setCreating(false)
    if (res.ok) {
      router.push(`/dashboard/tray/irregular-orders/${d.id}`)
    } else {
      setError(d.error ?? "作成に失敗しました")
    }
  }

  const remove = async (o: Order) => {
    if (!confirm(`管理No.${o.order_no} を削除しますか？明細も一緒に削除されます。`)) return
    setError("")
    const res = await fetch(`/api/tray/irregular-orders/${o.id}`, { method: "DELETE" })
    if (res.ok) {
      load()
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? "削除に失敗しました")
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-bold text-gray-800">イレギュラートレイ発注一覧</h1>

      {error && <p className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mb-4">
        <Button onClick={() => { setShowNew(true); setTitle(""); setError("") }}>＋ 新規作成</Button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">No.</th>
                <th className="px-3 py-2 text-left">申請日</th>
                <th className="px-3 py-2 text-left">進捗</th>
                <th className="px-3 py-2 text-left">作成者</th>
                <th className="px-3 py-2 text-left">タイトル（アーティスト、備考など）</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 tabular-nums">{o.order_no}</td>
                  <td className="px-3 py-2">{fmtDate(o.request_date)}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLE[o.status] ?? "bg-gray-100 text-gray-600"}`}>{o.status}</span>
                  </td>
                  <td className="px-3 py-2">{o.requester_name}</td>
                  <td className="px-3 py-2">{o.title}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button onClick={() => router.push(`/dashboard/tray/irregular-orders/${o.id}`)} className="mr-3 text-blue-600 hover:underline">開く</button>
                    {o.status !== "承認済" && (
                      <button onClick={() => remove(o)} className="text-red-500 hover:underline">削除</button>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">発注書はまだありません</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowNew(false)} />
          <div className="relative mx-4 w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
            <h2 className="mb-3 text-lg font-bold text-gray-800">イレギュラートレイ発注書を作成</h2>
            <div className="mb-1 text-xs text-gray-500">タイトル（アーティスト、備考など）<span className="text-red-500"> *</span></div>
            <input value={title} onChange={e => setTitle(e.target.value)} autoFocus autoComplete="off"
              className="h-9 w-full rounded-md border px-2 text-sm" />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNew(false)}>キャンセル</Button>
              <Button onClick={create} disabled={creating}>{creating ? "作成中..." : "作成"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
