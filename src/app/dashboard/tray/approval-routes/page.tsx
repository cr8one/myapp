"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

type Route = { id: string; step_order: number; label: string | null; approver_user_id: string | null; approver_name: string | null; has_inkan: boolean }
type User = { id: string; name: string | null }

export default function TrayApprovalRoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)

  const [editId, setEditId] = useState<string | null>(null)
  const [stepOrder, setStepOrder] = useState("")
  const [label, setLabel] = useState("")
  const [approverId, setApproverId] = useState("")

  const load = async () => {
    setLoading(true)
    const res = await fetch("/api/tray/approval-routes")
    if (res.status === 403) setDenied(true)
    else if (res.ok) setRoutes(await res.json())
    setLoading(false)
  }
  useEffect(() => {
    load()
    fetch("/api/users/list?sort=org").then(r => r.json()).then(setUsers)
  }, [])

  const resetForm = () => {
    setEditId(null)
    setStepOrder(String(routes.length + 1))
    setLabel("")
    setApproverId("")
  }
  useEffect(() => { if (!editId && !stepOrder) setStepOrder(String(routes.length + 1)) }, [routes])

  const startEdit = (r: Route) => {
    setEditId(r.id)
    setStepOrder(String(r.step_order))
    setLabel(r.label ?? "")
    setApproverId(r.approver_user_id ?? "")
    setError(""); setMessage("")
  }

  const save = async () => {
    setError(""); setMessage(""); setBusy(true)
    const body = JSON.stringify({ step_order: Number(stepOrder), label, approver_user_id: approverId })
    const res = editId
      ? await fetch(`/api/tray/approval-routes/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body })
      : await fetch("/api/tray/approval-routes", { method: "POST", headers: { "Content-Type": "application/json" }, body })
    const d = await res.json().catch(() => ({}))
    setBusy(false)
    if (res.ok) {
      setMessage(editId ? "更新しました" : "追加しました")
      setEditId(null); setLabel(""); setApproverId(""); setStepOrder("")
      load()
    } else {
      setError(d.error ?? "保存に失敗しました")
    }
  }

  const remove = async (r: Route) => {
    if (!confirm(`「${r.label}」を削除しますか？（承認済みの書類の押印は変わりません）`)) return
    setError(""); setMessage(""); setBusy(true)
    const res = await fetch(`/api/tray/approval-routes/${r.id}`, { method: "DELETE" })
    const d = await res.json().catch(() => ({}))
    setBusy(false)
    if (res.ok) { setMessage("削除しました"); load() }
    else setError(d.error ?? "削除に失敗しました")
  }

  if (denied) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-gray-800">トレイ承認経路マスタ</h1>
        <p className="mt-3 text-gray-500">購買担当者のみ操作できます。</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-bold text-gray-800">トレイ承認経路マスタ</h1>
      <p className="mb-4 text-sm text-gray-500">イレギュラートレイ発注書の、購買側の承認者を、承認の順番に登録します。承認依頼の時点の内容が、発注書ごとに保存されます。</p>

      {error && <p className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {message && <p className="mb-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}

      <div className="mb-6 rounded-lg border bg-gray-50 p-3">
        <div className="mb-2 text-sm font-semibold text-gray-700">{editId ? "経路を編集" : "経路を追加"}</div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <div className="mb-1 text-xs text-gray-500">承認の順番</div>
            <input type="number" min={1} value={stepOrder} onChange={e => setStepOrder(e.target.value)} className="h-9 w-24 rounded-md border px-2 text-sm" />
          </div>
          <div>
            <div className="mb-1 text-xs text-gray-500">押印欄の名称（例：東京生産管理1）</div>
            <input value={label} onChange={e => setLabel(e.target.value)} autoComplete="off" className="h-9 w-56 rounded-md border px-2 text-sm" />
          </div>
          <div>
            <div className="mb-1 text-xs text-gray-500">承認者</div>
            <select value={approverId} onChange={e => setApproverId(e.target.value)} className="h-9 w-56 rounded-md border px-2 text-sm">
              <option value="">-- 選択してください --</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <Button onClick={save} disabled={busy}>{editId ? "更新" : "追加"}</Button>
          {editId && <Button variant="outline" onClick={resetForm}>キャンセル</Button>}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">承認の順番</th>
                <th className="px-3 py-2 text-left">押印欄の名称</th>
                <th className="px-3 py-2 text-left">承認者</th>
                <th className="px-3 py-2 text-left">印影</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {routes.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2 tabular-nums">{r.step_order}</td>
                  <td className="px-3 py-2">{r.label}</td>
                  <td className="px-3 py-2">{r.approver_name ?? "—"}</td>
                  <td className="px-3 py-2">
                    {r.has_inkan ? <span className="text-green-700">登録済み</span> : <span className="text-red-600">未登録（押印欄が空白になります）</span>}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button onClick={() => startEdit(r)} className="mr-3 text-blue-600 hover:underline">編集</button>
                    <button onClick={() => remove(r)} className="text-red-500 hover:underline">削除</button>
                  </td>
                </tr>
              ))}
              {routes.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-400">承認経路がまだありません</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
