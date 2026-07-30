"use client"
import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, ShieldCheck } from "lucide-react"

type UserOption = { id: string; name: string | null }
type ApprovalRoute = {
  id: string
  step_order: number
  position: { id: string; name: string } | null
  approver: { id: string; name: string | null; email: string } | null
}
type Position = { id: string; name: string }

export default function ApprovalRoutesPage() {
  const [routes, setRoutes] = useState<ApprovalRoute[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editRoute, setEditRoute] = useState<ApprovalRoute | null>(null)
  const [stepOrder, setStepOrder] = useState(0)
  const [positionId, setPositionId] = useState("")
  const [approverUserId, setApproverUserId] = useState("")

  const fetchAll = async () => {
    setLoading(true)
    const [routeRes, positionRes, userRes] = await Promise.all([
      fetch("/api/eapp/masters/approval-routes"),
      fetch("/api/masters/positions"),
      fetch("/api/users/list"),
    ])
    setRoutes(await routeRes.json())
    setPositions(await positionRes.json())
    setUsers(await userRes.json())
    setLoading(false)
  }
  useEffect(() => { fetchAll() }, [])

  const startAdd = () => {
    setEditRoute(null)
    setStepOrder(routes.length + 1)
    setPositionId("")
    setApproverUserId("")
    setShowForm(true)
  }
  const startEdit = (route: ApprovalRoute) => {
    setEditRoute(route)
    setStepOrder(route.step_order)
    setPositionId(route.position?.id ?? "")
    setApproverUserId(route.approver?.id ?? "")
    setShowForm(true)
  }
  const save = async () => {
    const body = JSON.stringify({ step_order: stepOrder, position_id: positionId || null, approver_user_id: approverUserId || null })
    if (editRoute) {
      await fetch(`/api/eapp/masters/approval-routes/${editRoute.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body })
    } else {
      await fetch("/api/eapp/masters/approval-routes", { method: "POST", headers: { "Content-Type": "application/json" }, body })
    }
    setShowForm(false)
    setEditRoute(null)
    fetchAll()
  }
  const remove = async (id: string) => {
    if (!confirm("この承認ステップを削除しますか？")) return
    await fetch(`/api/eapp/masters/approval-routes/${id}`, { method: "DELETE" })
    fetchAll()
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-slate-600" />
          <h1 className="text-xl font-bold text-gray-900">得意先共通承認者設定</h1>
        </div>
        <button onClick={startAdd} className="flex items-center gap-1 px-3 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800">
          <Plus className="w-4 h-4" /> ステップ追加
        </button>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        全ての得意先申請に共通で適用される固定の承認ステップです（経理部・社長など）。ユーザーごとの可変ステップの後に、ここでの並び順で承認が進みます。
      </p>
      {showForm && (
        <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-sm font-medium text-slate-700 mb-3">{editRoute ? "承認ステップを編集" : "承認ステップを追加"}</p>
          <div className="flex gap-2 flex-wrap">
            <input autoComplete="off" type="number" className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="順序" value={stepOrder} onChange={e => setStepOrder(Number(e.target.value))} />
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={positionId} onChange={e => setPositionId(e.target.value)}>
              <option value="">-- 役職を選択 --</option>
              {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select className="flex-1 min-w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm" value={approverUserId} onChange={e => setApproverUserId(e.target.value)}>
              <option value="">-- 承認者(氏名)を選択 --</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <button onClick={save} className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800">保存</button>
            <button onClick={() => { setShowForm(false); setEditRoute(null) }} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">キャンセル</button>
          </div>
        </div>
      )}
      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : routes.length === 0 ? (
        <p className="text-sm text-gray-400">承認ステップがまだ登録されていません。</p>
      ) : (
        <div className="space-y-2">
          {routes.map(route => (
            <div key={route.id} className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm">
              <span className="text-xs font-bold text-slate-500 w-8">{route.step_order}</span>
              <span className="text-sm text-gray-500 w-24">{route.position?.name ?? "-"}</span>
              <span className="flex-1 text-sm font-medium text-gray-900">{route.approver?.name ?? "-"}</span>
              <button onClick={() => startEdit(route)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(route.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
