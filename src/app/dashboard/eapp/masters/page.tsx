"use client"
import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, ShieldCheck, UserCog } from "lucide-react"

type UserOption = { id: string; name: string | null; email: string }
type ApprovalRoute = {
  id: string
  step_order: number
  position: { id: string; name: string } | null
  approver: { id: string; name: string | null; email: string } | null
}
type Position = { id: string; name: string }
type Staff = {
  id: string
  sort_order: number
  user: { id: string; name: string | null; email: string }
}

export default function EappMastersPage() {
  const [activeTab, setActiveTab] = useState<"approval-routes" | "system-staff">("approval-routes")
  const [routeServiceType, setRouteServiceType] = useState<"tokui_credit" | "ringi">("tokui_credit")

  // 得意先共通承認者設定
  const [routes, setRoutes] = useState<ApprovalRoute[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [routesLoading, setRoutesLoading] = useState(true)
  const [showRouteForm, setShowRouteForm] = useState(false)
  const [editRoute, setEditRoute] = useState<ApprovalRoute | null>(null)
  const [stepOrder, setStepOrder] = useState(0)
  const [positionId, setPositionId] = useState("")
  const [approverUserId, setApproverUserId] = useState("")

  // システム担当者マスタ
  const [staff, setStaff] = useState<Staff[]>([])
  const [staffLoading, setStaffLoading] = useState(true)
  const [showStaffForm, setShowStaffForm] = useState(false)
  const [staffUserId, setStaffUserId] = useState("")

  const fetchRoutes = async (serviceType?: string) => {
    setRoutesLoading(true)
    const [routeRes, positionRes, userRes] = await Promise.all([
      fetch(`/api/eapp/masters/approval-routes?service_type=${serviceType ?? routeServiceType}`),
      fetch("/api/masters/positions"),
      fetch("/api/users/list"),
    ])
    setRoutes(await routeRes.json())
    setPositions(await positionRes.json())
    setUsers(await userRes.json())
    setRoutesLoading(false)
  }
  const fetchStaff = async () => {
    setStaffLoading(true)
    const [staffRes, userRes] = await Promise.all([
      fetch("/api/eapp/masters/system-staff"),
      fetch("/api/users/list"),
    ])
    setStaff(await staffRes.json())
    setUsers(await userRes.json())
    setStaffLoading(false)
  }
  useEffect(() => { fetchRoutes(); fetchStaff() }, [])

  const saveRoute = async () => {
    const body = JSON.stringify({ service_type: routeServiceType, step_order: stepOrder, position_id: positionId || null, approver_user_id: approverUserId || null })
    if (editRoute) {
      await fetch(`/api/eapp/masters/approval-routes/${editRoute.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body })
    } else {
      await fetch("/api/eapp/masters/approval-routes", { method: "POST", headers: { "Content-Type": "application/json" }, body })
    }
    setShowRouteForm(false)
    setEditRoute(null)
    fetchRoutes()
  }
  const startAddRoute = () => {
    setEditRoute(null)
    setStepOrder(routes.length + 1)
    setPositionId("")
    setApproverUserId("")
    setShowRouteForm(true)
  }
  const startEditRoute = (route: ApprovalRoute) => {
    setEditRoute(route)
    setStepOrder(route.step_order)
    setPositionId(route.position?.id ?? "")
    setApproverUserId(route.approver?.id ?? "")
    setShowRouteForm(true)
  }
  const body = JSON.stringify({ service_type: routeServiceType, step_order: stepOrder, position_id: positionId || null, approver_user_id: approverUserId || null })
  const removeRoute = async (id: string) => {
    if (!confirm("この承認ステップを削除しますか？")) return
    await fetch(`/api/eapp/masters/approval-routes/${id}`, { method: "DELETE" })
    fetchRoutes()
  }

  const addStaff = async () => {
    if (!staffUserId) return
    await fetch("/api/eapp/masters/system-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: staffUserId, sort_order: staff.length }),
    })
    setShowStaffForm(false)
    setStaffUserId("")
    fetchStaff()
  }
  const removeStaff = async (id: string) => {
    if (!confirm("このシステム担当者を削除しますか？")) return
    await fetch(`/api/eapp/masters/system-staff/${id}`, { method: "DELETE" })
    fetchStaff()
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-4">電子申請マスタ</h1>

      <div className="flex gap-1 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("approval-routes")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "approval-routes" ? "border-slate-700 text-slate-900" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          得意先共通承認者設定
        </button>
        <button
          onClick={() => setActiveTab("system-staff")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "system-staff" ? "border-slate-700 text-slate-900" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          システム担当者マスタ
        </button>
      </div>

      {activeTab === "approval-routes" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-slate-600" />
              <p className="text-xs text-gray-400">
                全ての得意先申請に共通で適用される固定の承認ステップです（経理部・社長など）。ユーザーごとの可変ステップの後に、ここでの並び順で承認が進みます。
              </p>
            </div>
          <div className="flex gap-1 mb-3">
            <button
              onClick={() => { setRouteServiceType("tokui_credit"); fetchRoutes("tokui_credit") }}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${routeServiceType === "tokui_credit" ? "bg-slate-700 text-white border-slate-700" : "bg-white text-gray-500 border-gray-200"}`}
            >得意先申請</button>
            <button
              onClick={() => { setRouteServiceType("ringi"); fetchRoutes("ringi") }}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${routeServiceType === "ringi" ? "bg-slate-700 text-white border-slate-700" : "bg-white text-gray-500 border-gray-200"}`}
            >稟議書</button>
          </div>
            <button onClick={startAddRoute} className="flex items-center gap-1 px-3 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 shrink-0">
              <Plus className="w-4 h-4" /> ステップ追加
            </button>
          </div>
          {showRouteForm && (
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
                <button onClick={saveRoute} className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800">保存</button>
                <button onClick={() => { setShowRouteForm(false); setEditRoute(null) }} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">キャンセル</button>
              </div>
            </div>
          )}
          {routesLoading ? (
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
                  <button onClick={() => startEditRoute(route)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => removeRoute(route.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "system-staff" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-slate-600" />
              <p className="text-xs text-gray-400">
                得意先申請の全ステップ承認完了時に「PRINSER登録依頼」メールが届く担当者です。ここに登録されたユーザーのみ、承認完了後の申請を「登録済み」に変更できます。
              </p>
            </div>
            <button onClick={() => setShowStaffForm(true)} className="flex items-center gap-1 px-3 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 shrink-0">
              <Plus className="w-4 h-4" /> 追加
            </button>
          </div>
          {showStaffForm && (
            <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex gap-2">
                <select className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={staffUserId} onChange={e => setStaffUserId(e.target.value)}>
                  <option value="">-- ユーザーを選択 --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <button onClick={addStaff} className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800">保存</button>
                <button onClick={() => setShowStaffForm(false)} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">キャンセル</button>
              </div>
            </div>
          )}
          {staffLoading ? (
            <p className="text-sm text-gray-400">読み込み中...</p>
          ) : staff.length === 0 ? (
            <p className="text-sm text-gray-400">まだ登録されていません。</p>
          ) : (
            <div className="space-y-2">
              {staff.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm">
                  <span className="flex-1 font-medium text-gray-900">{s.user.name}</span>
                  <span className="text-xs text-gray-400">{s.user.email}</span>
                  <button onClick={() => removeStaff(s.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
