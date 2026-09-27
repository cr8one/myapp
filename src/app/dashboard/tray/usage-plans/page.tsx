"use client"
import { useEffect, useRef, useState } from "react"
import { Plus, Pencil, Trash2, X, Search } from "lucide-react"
import { AutocompleteInput } from "@/components/ui/autocomplete-input"

type UsagePlan = {
  id: string
  submission_month: string
  usage_month: string
  rendo_tray_cd: string
  usage_dept: string | null
  usage_person_id: string | null
  usage_person_name: string | null
  planned_qty: number
  item_name: string | null
  lock_flg: boolean
  approved_flg: boolean
  irregular_order_flg: boolean
}
type Department = { id: string; name: string; groups: { id: string; name: string }[] }
type User = { id: string; name: string | null; departmentLabels: string[] }
type PrinserTraySuggestion = { tray_cd: string; tray_nm: string; t_maker: string; rendo_tray_cd: string }

function formatMonth(m: string) {
  if (m.length !== 6) return m
  return `${m.slice(0, 4)}年${m.slice(4, 6)}月`
}
function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`
}

export default function TrayUsagePlansPage() {
  const [plans, setPlans] = useState<UsagePlan[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSubmissionMonth, setFilterSubmissionMonth] = useState("")
  const [filterUsageMonth, setFilterUsageMonth] = useState("")

  const [showForm, setShowForm] = useState(false)
  const [editPlan, setEditPlan] = useState<UsagePlan | null>(null)
  const [submissionMonth, setSubmissionMonth] = useState(currentMonth())
  const [usageMonth, setUsageMonth] = useState("")
  const [rendoTrayCd, setRendoTrayCd] = useState("")
  const [usageDept, setUsageDept] = useState("")
  const [usagePersonId, setUsagePersonId] = useState("")
  const [usagePersonName, setUsagePersonName] = useState("")
  const [plannedQty, setPlannedQty] = useState(0)
  const [itemName, setItemName] = useState("")
  const [lockFlg, setLockFlg] = useState(false)
  const [approvedFlg, setApprovedFlg] = useState(false)
  const [irregularFlg, setIrregularFlg] = useState(false)
  const [error, setError] = useState("")

  const [suggestions, setSuggestions] = useState<PrinserTraySuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadPlans = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterSubmissionMonth) params.set("submission_month", filterSubmissionMonth)
    if (filterUsageMonth) params.set("usage_month", filterUsageMonth)
    const res = await fetch(`/api/tray/usage-plans?${params.toString()}`)
    const data = await res.json()
    setPlans(data)
    setLoading(false)
  }

  useEffect(() => {
    fetch("/api/masters/departments").then(r => r.json()).then(setDepartments)
    fetch("/api/users/list").then(r => r.json()).then(setUsers)
  }, [])

  useEffect(() => { loadPlans() }, [filterSubmissionMonth, filterUsageMonth])

  const deptOptions = departments.flatMap(d => [
    { id: d.id, label: d.name },
    ...d.groups.map(g => ({ id: g.id, label: `${d.name} ${g.name}` })),
  ])
  const userOptions = users.map(u => ({ id: u.id, label: u.name ?? "" }))

  const handleRendoCdChange = (v: string) => {
    setRendoTrayCd(v)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!v.trim()) { setSuggestions([]); setShowSuggestions(false); return }
    searchTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/prinser/m-tray?keyword=${encodeURIComponent(v)}`)
      const data = await res.json()
      setSuggestions((data.records ?? []).slice(0, 8))
      setShowSuggestions(true)
    }, 300)
  }

  const resetForm = () => {
    setSubmissionMonth(currentMonth()); setUsageMonth(""); setRendoTrayCd("")
    setUsageDept(""); setUsagePersonId(""); setUsagePersonName("")
    setPlannedQty(0); setItemName("")
    setLockFlg(false); setApprovedFlg(false); setIrregularFlg(false)
    setSuggestions([]); setShowSuggestions(false); setError("")
  }

  const openNew = () => { setEditPlan(null); resetForm(); setShowForm(true) }
  const openEdit = (p: UsagePlan) => {
    setEditPlan(p)
    setSubmissionMonth(p.submission_month); setUsageMonth(p.usage_month); setRendoTrayCd(p.rendo_tray_cd)
    setUsageDept(p.usage_dept ?? ""); setUsagePersonId(p.usage_person_id ?? ""); setUsagePersonName(p.usage_person_name ?? "")
    setPlannedQty(p.planned_qty); setItemName(p.item_name ?? "")
    setLockFlg(p.lock_flg); setApprovedFlg(p.approved_flg); setIrregularFlg(p.irregular_order_flg)
    setSuggestions([]); setShowSuggestions(false); setError("")
    setShowForm(true)
  }

  const handleUserSelect = (label: string) => {
    setUsagePersonName(label)
    const found = users.find(u => u.name === label)
    setUsagePersonId(found?.id ?? "")
  }

  const handleSave = async () => {
    if (!submissionMonth || !usageMonth || !rendoTrayCd) { setError("提出年月・使用予定年月・連動トレイコードは必須です"); return }
    setError("")
    const body = {
      submission_month: submissionMonth,
      usage_month: usageMonth,
      rendo_tray_cd: rendoTrayCd,
      usage_dept: usageDept || null,
      usage_person_id: usagePersonId || null,
      usage_person_name: usagePersonName || null,
      planned_qty: plannedQty,
      item_name: itemName || null,
      lock_flg: lockFlg,
      approved_flg: approvedFlg,
      irregular_order_flg: irregularFlg,
    }
    const res = editPlan
      ? await fetch(`/api/tray/usage-plans/${editPlan.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/tray/usage-plans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (!res.ok) { setError(editPlan ? "更新に失敗しました" : "登録に失敗しました"); return }
    await loadPlans()
    setShowForm(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("この予定を削除しますか？")) return
    await fetch(`/api/tray/usage-plans/${id}`, { method: "DELETE" })
    await loadPlans()
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">トレイ使用予定情報</h1>
          <p className="text-sm text-gray-400 mt-1">受注ごとのトレイ使用予定を管理</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
          <Plus size={16} /> 新規登録
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">提出年月：</label>
          <input value={filterSubmissionMonth} onChange={e => setFilterSubmissionMonth(e.target.value)} placeholder="例: 202609" className="w-28 rounded-md border border-gray-200 px-2 py-1.5 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">使用予定年月：</label>
          <input value={filterUsageMonth} onChange={e => setFilterUsageMonth(e.target.value)} placeholder="例: 202610" className="w-28 rounded-md border border-gray-200 px-2 py-1.5 text-sm" />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : plans.length === 0 ? (
        <p className="text-sm text-gray-400">該当する使用予定がありません</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-3 py-2 font-medium">提出年月</th>
                <th className="px-3 py-2 font-medium">使用予定年月</th>
                <th className="px-3 py-2 font-medium">連動トレイコード</th>
                <th className="px-3 py-2 font-medium">品名</th>
                <th className="px-3 py-2 font-medium">使用予定部署</th>
                <th className="px-3 py-2 font-medium">使用予定者</th>
                <th className="px-3 py-2 font-medium text-right">使用予定数</th>
                <th className="px-3 py-2 font-medium">フラグ</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {plans.map(p => (
                <tr key={p.id} className="border-t border-gray-100">
                  <td className="px-3 py-2">{formatMonth(p.submission_month)}</td>
                  <td className="px-3 py-2">{formatMonth(p.usage_month)}</td>
                  <td className="px-3 py-2">{p.rendo_tray_cd}</td>
                  <td className="px-3 py-2">{p.item_name || "—"}</td>
                  <td className="px-3 py-2">{p.usage_dept || "—"}</td>
                  <td className="px-3 py-2">{p.usage_person_name || "—"}</td>
                  <td className="px-3 py-2 text-right">{p.planned_qty.toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      {p.lock_flg && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">ロック</span>}
                      {p.approved_flg && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-600">承認済</span>}
                      {p.irregular_order_flg && <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-500">イレギュラー</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-gray-600"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editPlan ? "使用予定編集" : "使用予定新規登録"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">提出年月</label>
                  <input value={submissionMonth} onChange={e => setSubmissionMonth(e.target.value)} placeholder="例: 202609" className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">使用予定年月</label>
                  <input value={usageMonth} onChange={e => setUsageMonth(e.target.value)} placeholder="例: 202610" className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
                </div>
              </div>

              <div className="relative">
                <label className="mb-1 block text-xs font-medium text-gray-500">連動トレイコード</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 text-gray-300" size={14} />
                  <input
                    value={rendoTrayCd}
                    onChange={e => handleRendoCdChange(e.target.value)}
                    onFocus={() => { if (suggestions.length) setShowSuggestions(true) }}
                    className="w-full rounded-md border border-gray-200 py-2 pl-8 pr-3 text-sm"
                  />
                </div>
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.map(s => (
                      <button key={s.rendo_tray_cd + s.tray_cd} type="button" onClick={() => { setRendoTrayCd(s.rendo_tray_cd); setShowSuggestions(false) }} className="block w-full px-3 py-2 text-left text-xs hover:bg-amber-50">
                        <span className="font-medium text-gray-800">{s.rendo_tray_cd}</span>
                        <span className="ml-2 text-gray-400">{s.tray_nm} / {s.t_maker}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">品名</label>
                <input value={itemName} onChange={e => setItemName(e.target.value)} className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">使用予定部署</label>
                  <AutocompleteInput value={usageDept} onChange={setUsageDept} options={deptOptions} className="h-[38px] py-2" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">使用予定者</label>
                  <AutocompleteInput value={usagePersonName} onChange={handleUserSelect} options={userOptions} className="h-[38px] py-2" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">使用予定数</label>
                <input type="number" value={plannedQty} onChange={e => setPlannedQty(Number(e.target.value))} className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-1.5 text-sm text-gray-600">
                  <input type="checkbox" checked={lockFlg} onChange={e => setLockFlg(e.target.checked)} /> ロック
                </label>
                <label className="flex items-center gap-1.5 text-sm text-gray-600">
                  <input type="checkbox" checked={approvedFlg} onChange={e => setApprovedFlg(e.target.checked)} /> 上長承認
                </label>
                <label className="flex items-center gap-1.5 text-sm text-gray-600">
                  <input type="checkbox" checked={irregularFlg} onChange={e => setIrregularFlg(e.target.checked)} /> イレギュラー発注
                </label>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">キャンセル</button>
              <button onClick={handleSave} className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">{editPlan ? "更新" : "登録"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
