"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

type Detail = {
  id: string
  usage_month: string
  planned_qty: number
  item_name: string | null
  usage_person_name: string | null
  approved_flg: boolean
  lock_flg: boolean
  temp_lock_flg: boolean
}
type DetailResponse = { records: Detail[]; canCreate: boolean; firstUsageMonth: string }

type Props = {
  submissionMonth: string
  trayName: string
  rendoTrayCd: string
  onClose: () => void
}

function addMonths(ym: string, n: number): string {
  const y = Number(ym.slice(0, 4))
  const m = Number(ym.slice(4, 6)) - 1 + n
  const yy = y + Math.floor(m / 12)
  const mm = ((m % 12) + 12) % 12 + 1
  return `${yy}${String(mm).padStart(2, "0")}`
}
function fmt(ym: string) {
  return `${ym.slice(0, 4)}年${Number(ym.slice(4, 6))}月`
}

export function UsageDetailModal({ submissionMonth, trayName, rendoTrayCd, onClose }: Props) {
  const [data, setData] = useState<DetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editId, setEditId] = useState<string | null>(null)
  const [usageMonth, setUsageMonth] = useState("")
  const [qty, setQty] = useState("")
  const [itemName, setItemName] = useState("")
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams({ submission_month: submissionMonth, rendo_tray_cd: rendoTrayCd })
    const res = await fetch(`/api/tray/usage-sheet/details?${params.toString()}`)
    if (res.ok) {
      const d: DetailResponse = await res.json()
      setData(d)
      if (!usageMonth) setUsageMonth(d.firstUsageMonth)
    } else {
      const e = await res.json().catch(() => ({}))
      setError(e.error ?? "読み込みに失敗しました")
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  const resetForm = () => {
    setEditId(null)
    setUsageMonth(data?.firstUsageMonth ?? "")
    setQty("")
    setItemName("")
  }

  const startEdit = (d: Detail) => {
    setEditId(d.id)
    setUsageMonth(d.usage_month)
    setQty(String(d.planned_qty))
    setItemName(d.item_name ?? "")
    setError("")
  }

  const handleSave = async () => {
    setError("")
    if (qty === "") { setError("数量を入力してください"); return }
    setSaving(true)
    const body = { submission_month: submissionMonth, rendo_tray_cd: rendoTrayCd, usage_month: usageMonth, planned_qty: Number(qty), item_name: itemName }
    const res = editId
      ? await fetch(`/api/tray/usage-sheet/details/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/tray/usage-sheet/details", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    setSaving(false)
    if (res.ok) {
      resetForm()
      load()
    } else {
      const e = await res.json().catch(() => ({}))
      setError(e.error ?? "保存に失敗しました")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("この明細を削除しますか？")) return
    setError("")
    const res = await fetch(`/api/tray/usage-sheet/details/${id}`, { method: "DELETE" })
    if (res.ok) {
      if (editId === id) resetForm()
      load()
    } else {
      const e = await res.json().catch(() => ({}))
      setError(e.error ?? "削除に失敗しました")
    }
  }

  const monthChoices = data ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => addMonths(data.firstUsageMonth, i)) : []
  const showForm = editId !== null || data?.canCreate

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative mx-4 flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div>
            <div className="text-xs text-gray-500">提出月：{fmt(submissionMonth)}</div>
            <h2 className="text-lg font-bold text-gray-800">{trayName}</h2>
          </div>
          <button onClick={onClose} className="text-xl leading-none text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && <p className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          {showForm ? (
            <div className="mb-4 rounded-lg border bg-gray-50 p-3">
              <div className="mb-2 text-sm font-semibold text-gray-700">{editId ? "明細を編集" : "新規登録"}</div>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <div className="mb-1 text-xs text-gray-500">使用年月</div>
                  <select value={usageMonth} onChange={e => setUsageMonth(e.target.value)} className="h-9 rounded-md border px-2 text-sm">
                    {monthChoices.map(m => <option key={m} value={m}>{fmt(m)}</option>)}
                  </select>
                </div>
                <div>
                  <div className="mb-1 text-xs text-gray-500">数量</div>
                  <input type="number" min={0} value={qty} onChange={e => setQty(e.target.value)} className="h-9 w-28 rounded-md border px-2 text-sm" />
                </div>
                <div className="min-w-[12rem] flex-1">
                  <div className="mb-1 text-xs text-gray-500">タイトル（アーティスト、備考など）</div>
                  <input type="text" value={itemName} onChange={e => setItemName(e.target.value)} className="h-9 w-full rounded-md border px-2 text-sm" autoComplete="off" />
                </div>
                <Button onClick={handleSave} disabled={saving}>{saving ? "保存中..." : editId ? "更新" : "登録"}</Button>
                {editId && <Button variant="outline" onClick={resetForm}>キャンセル</Button>}
              </div>
            </div>
          ) : (
            !loading && <p className="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">新規登録は締め切られています。既存の明細の編集・削除は、ロックされていないものに限りできます。</p>
          )}

          {loading ? (
            <p className="text-sm text-gray-400">読み込み中...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">使用年月</th>
                  <th className="px-3 py-2 text-right">数量</th>
                  <th className="px-3 py-2 text-left">タイトル</th>
                  <th className="px-3 py-2 text-left">作成者</th>
                  <th className="px-3 py-2 text-left">承認</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {data?.records.map(d => {
                  const locked = d.lock_flg || d.temp_lock_flg
                  return (
                    <tr key={d.id} className="border-t">
                      <td className="px-3 py-2">{fmt(d.usage_month)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{d.planned_qty.toLocaleString()}</td>
                      <td className="px-3 py-2">{d.item_name || "—"}</td>
                      <td className="px-3 py-2">{d.usage_person_name || "—"}</td>
                      <td className="px-3 py-2">{d.approved_flg ? "承認済" : "—"}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        {locked ? (
                          <span className="text-xs text-gray-400">ロック中</span>
                        ) : (
                          <>
                            <button onClick={() => startEdit(d)} className="mr-3 text-blue-600 hover:underline">編集</button>
                            <button onClick={() => handleDelete(d.id)} className="text-red-500 hover:underline">削除</button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {data?.records.length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">明細はまだありません</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex justify-end border-t bg-gray-50 px-5 py-3">
          <Button variant="outline" onClick={onClose}>閉じる</Button>
        </div>
      </div>
    </div>
  )
}
