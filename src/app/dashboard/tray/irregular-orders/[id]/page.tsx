"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

type Item = { id: string; usage_month: string; rendo_tray_cd: string; tray_name: string; planned_qty: number }
type Order = { id: string; order_no: string; status: string; request_date: string; title: string; requester_name: string; items: Item[] }
type Tray = { id: string; name: string; type: string; rendo_tray_cd: string | null }

const KNOWN_TYPES = ["CD", "DVD", "BD"]
const TYPE_FILTERS = ["すべて", "CD", "DVD", "BD", "その他"]

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })
}
function fmtMonth(ym: string) {
  return `${ym.slice(0, 4)}年${Number(ym.slice(4, 6))}月`
}
function addMonths(ym: string, n: number): string {
  const y = Number(ym.slice(0, 4))
  const m = Number(ym.slice(4, 6)) - 1 + n
  const yy = y + Math.floor(m / 12)
  const mm = ((m % 12) + 12) % 12 + 1
  return `${yy}${String(mm).padStart(2, "0")}`
}
function monthOfDate(s: string) {
  const d = new Date(new Date(s).getTime() + 9 * 60 * 60 * 1000)
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

export default function IrregularOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [trays, setTrays] = useState<Tray[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [title, setTitle] = useState("")

  const [editItemId, setEditItemId] = useState<string | null>(null)
  const [usageMonth, setUsageMonth] = useState("")
  const [trayCd, setTrayCd] = useState("")
  const [qty, setQty] = useState("")
  const [typeFilter, setTypeFilter] = useState("すべて")
  const [trayQuery, setTrayQuery] = useState("")
  const [busy, setBusy] = useState(false)

  const load = async () => {
    const res = await fetch(`/api/tray/irregular-orders/${id}`)
    if (res.ok) {
      const o: Order = await res.json()
      setOrder(o)
      setTitle(o.title)
      if (!usageMonth) setUsageMonth(monthOfDate(o.request_date))
    } else {
      setError("発注書を読み込めませんでした")
    }
    setLoading(false)
  }
  useEffect(() => {
    load()
    fetch("/api/masters/items/trays").then(r => r.json()).then(setTrays)
  }, [id])

  const editable = order?.status === "作成中"

  const call = async (fn: () => Promise<Response>, okMsg: string, after?: () => void) => {
    setError(""); setMessage(""); setBusy(true)
    const res = await fn()
    const d = await res.json().catch(() => ({}))
    setBusy(false)
    if (res.ok) {
      setMessage(okMsg)
      after?.()
      load()
    } else {
      setError((d as { error?: string }).error ?? "操作に失敗しました")
    }
  }

  const saveTitle = () => call(
    () => fetch(`/api/tray/irregular-orders/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) }),
    "タイトルを保存しました",
  )

  const resetForm = () => {
    setEditItemId(null)
    setTrayCd(""); setQty(""); setTrayQuery("")
  }

  const startEdit = (it: Item) => {
    setEditItemId(it.id)
    setUsageMonth(it.usage_month)
    setTrayCd(it.rendo_tray_cd)
    setQty(String(it.planned_qty))
    setError(""); setMessage("")
  }

  const saveItem = () => {
    if (!trayCd) { setError("トレイを選択してください"); return }
    if (!qty) { setError("数量を入力してください"); return }
    const body = JSON.stringify({ usage_month: usageMonth, rendo_tray_cd: trayCd, planned_qty: Number(qty) })
    const url = editItemId ? `/api/tray/irregular-orders/${id}/items/${editItemId}` : `/api/tray/irregular-orders/${id}/items`
    call(
      () => fetch(url, { method: editItemId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body }),
      editItemId ? "明細を更新しました" : "明細を追加しました",
      resetForm,
    )
  }

  const deleteItem = (it: Item) => {
    if (!confirm("この明細を削除しますか？")) return
    call(
      () => fetch(`/api/tray/irregular-orders/${id}/items/${it.id}`, { method: "DELETE" }),
      "明細を削除しました",
      () => { if (editItemId === it.id) resetForm() },
    )
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">読み込み中...</div>
  if (!order) return <div className="p-6 text-sm text-red-600">{error || "発注書が見つかりません"}</div>

  const firstMonth = monthOfDate(order.request_date)
  const monthChoices = Array.from({ length: 12 }, (_, i) => addMonths(firstMonth, i))
  const trayChoices = trays
    .filter(t => t.rendo_tray_cd)
    .filter(t => typeFilter === "すべて" ? true : typeFilter === "その他" ? !KNOWN_TYPES.includes(t.type) : t.type === typeFilter)
    .filter(t => !trayQuery || t.name.toLowerCase().includes(trayQuery.toLowerCase()))
  const selectedTray = trays.find(t => t.rendo_tray_cd === trayCd)

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">イレギュラートレイ発注書</h1>
        <Button variant="outline" onClick={() => router.push("/dashboard/tray/irregular-orders")}>一覧へ戻る</Button>
      </div>

      {error && <p className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {message && <p className="mb-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}

      <table className="mb-6 w-full max-w-3xl border text-sm">
        <tbody>
          <tr className="border-b"><th className="w-56 bg-gray-100 px-3 py-2 text-left font-medium">管理No.</th><td className="px-3 py-2">{order.order_no}</td></tr>
          <tr className="border-b"><th className="bg-gray-100 px-3 py-2 text-left font-medium">ステータス</th><td className="px-3 py-2">{order.status}</td></tr>
          <tr className="border-b"><th className="bg-gray-100 px-3 py-2 text-left font-medium">依頼日</th><td className="px-3 py-2">{fmtDate(order.request_date)}</td></tr>
          <tr>
            <th className="bg-gray-100 px-3 py-2 text-left font-medium">タイトル（アーティスト、備考など）<span className="text-red-500"> *</span></th>
            <td className="px-3 py-2">
              {editable ? (
                <div className="flex gap-2">
                  <input value={title} onChange={e => setTitle(e.target.value)} className="h-8 flex-1 rounded-md border px-2 text-sm" autoComplete="off" />
                  <Button size="sm" onClick={saveTitle} disabled={busy || title.trim() === order.title}>保存</Button>
                </div>
              ) : order.title}
            </td>
          </tr>
        </tbody>
      </table>

      {editable && (
        <div className="mb-4 rounded-lg border bg-gray-50 p-3">
          <div className="mb-2 text-sm font-semibold text-gray-700">{editItemId ? "明細を編集" : "明細を追加"}</div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <div className="mb-1 text-xs text-gray-500">使用年月</div>
              <select value={usageMonth} onChange={e => setUsageMonth(e.target.value)} className="h-9 rounded-md border px-2 text-sm">
                {monthChoices.map(m => <option key={m} value={m}>{fmtMonth(m)}</option>)}
              </select>
            </div>
            <div>
              <div className="mb-1 text-xs text-gray-500">数量</div>
              <input type="number" min={1} value={qty} onChange={e => setQty(e.target.value)} className="h-9 w-32 rounded-md border px-2 text-sm" />
            </div>
            <Button onClick={saveItem} disabled={busy}>{editItemId ? "更新" : "追加"}</Button>
            {editItemId && <Button variant="outline" onClick={resetForm}>キャンセル</Button>}
          </div>

          <div className="mt-3">
            <div className="mb-1 text-xs text-gray-500">トレイ{selectedTray ? `：${selectedTray.name}` : "（未選択）"}</div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {TYPE_FILTERS.map(t => (
                <button key={t} type="button" onClick={() => setTypeFilter(t)}
                  className={`rounded px-3 py-1 text-xs ${typeFilter === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{t}</button>
              ))}
              <input value={trayQuery} onChange={e => setTrayQuery(e.target.value)} placeholder="トレイ名で検索" autoComplete="off"
                className="h-8 w-56 rounded-md border px-2 text-sm" />
            </div>
            <div className="max-h-48 overflow-y-auto rounded-md border bg-white">
              {trayChoices.map(t => (
                <button key={t.id} type="button" onClick={() => setTrayCd(t.rendo_tray_cd ?? "")}
                  className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-blue-50 ${trayCd === t.rendo_tray_cd ? "bg-blue-100 font-semibold" : ""}`}>
                  {t.name}
                </button>
              ))}
              {trayChoices.length === 0 && <p className="px-3 py-3 text-center text-sm text-gray-400">該当なし</p>}
            </div>
          </div>
        </div>
      )}

      <table className="w-full max-w-3xl text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-3 py-2 text-left">使用年月</th>
            <th className="px-3 py-2 text-left">トレイ名</th>
            <th className="px-3 py-2 text-right">数量</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {order.items.map(it => (
            <tr key={it.id} className="border-t">
              <td className="px-3 py-2">{fmtMonth(it.usage_month)}</td>
              <td className="px-3 py-2">{it.tray_name}</td>
              <td className="px-3 py-2 text-right tabular-nums">{it.planned_qty.toLocaleString()}</td>
              <td className="px-3 py-2 text-right whitespace-nowrap">
                {editable && (
                  <>
                    <button onClick={() => startEdit(it)} className="mr-3 text-blue-600 hover:underline">編集</button>
                    <button onClick={() => deleteItem(it)} className="text-red-500 hover:underline">削除</button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {order.items.length === 0 && (
            <tr><td colSpan={4} className="px-3 py-8 text-center text-gray-400">明細はまだありません</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
