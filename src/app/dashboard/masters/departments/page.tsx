"use client"
import { useEffect, useState } from "react"
import { Building2, Plus, Pencil, Trash2, ChevronDown, ChevronRight, Users, MapPin } from "lucide-react"

type Base = {
  id: string
  name: string
  sort_order: number
  _count: { departments: number; groups: number }
}
type Group = {
  id: string
  name: string
  sort_order: number
  base: { id: string; name: string } | null
  _count: { users: number }
}
type Department = {
  id: string
  name: string
  sort_order: number
  base: { id: string; name: string } | null
  groups: Group[]
  _count: { users: number }
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [bases, setBases] = useState<Base[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<"departments" | "bases">("departments")

  // 拠点フォーム
  const [showBaseForm, setShowBaseForm] = useState(false)
  const [editBase, setEditBase] = useState<Base | null>(null)
  const [baseName, setBaseName] = useState("")
  const [baseOrder, setBaseOrder] = useState(0)

  // 部署フォーム
  const [showDeptForm, setShowDeptForm] = useState(false)
  const [editDept, setEditDept] = useState<Department | null>(null)
  const [deptName, setDeptName] = useState("")
  const [deptOrder, setDeptOrder] = useState(0)
  const [deptBaseId, setDeptBaseId] = useState("")

  // グループフォーム
  const [showGroupForm, setShowGroupForm] = useState<string | null>(null)
  const [editGroup, setEditGroup] = useState<Group | null>(null)
  const [groupName, setGroupName] = useState("")
  const [groupOrder, setGroupOrder] = useState(0)
  const [groupDeptId, setGroupDeptId] = useState("")
  const [groupBaseId, setGroupBaseId] = useState("")

  const fetchAll = async () => {
    setLoading(true)
    const [deptRes, baseRes] = await Promise.all([
      fetch("/api/masters/departments"),
      fetch("/api/masters/bases"),
    ])
    setDepartments(await deptRes.json())
    setBases(await baseRes.json())
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // 拠点保存
  const saveBase = async () => {
    if (!baseName.trim()) return
    if (editBase) {
      await fetch(`/api/masters/bases/${editBase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: baseName, sort_order: baseOrder }),
      })
    } else {
      await fetch("/api/masters/bases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: baseName, sort_order: baseOrder }),
      })
    }
    setShowBaseForm(false)
    setEditBase(null)
    setBaseName("")
    setBaseOrder(0)
    fetchAll()
  }

  const deleteBase = async (id: string) => {
    if (!confirm("この拠点を削除しますか？")) return
    await fetch(`/api/masters/bases/${id}`, { method: "DELETE" })
    fetchAll()
  }

  // 部署保存
  const saveDept = async () => {
    if (!deptName.trim()) return
    if (editDept) {
      await fetch(`/api/masters/departments/${editDept.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deptName, sort_order: deptOrder, base_id: deptBaseId || null }),
      })
    } else {
      await fetch("/api/masters/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deptName, sort_order: deptOrder, base_id: deptBaseId || null }),
      })
    }
    setShowDeptForm(false)
    setEditDept(null)
    setDeptName("")
    setDeptOrder(0)
    setDeptBaseId("")
    fetchAll()
  }

  const deleteDept = async (id: string) => {
    if (!confirm("この部署を削除しますか？\n所属するグループも削除されます。")) return
    await fetch(`/api/masters/departments/${id}`, { method: "DELETE" })
    fetchAll()
  }

  const startEditDept = (dept: Department) => {
    setEditDept(dept)
    setDeptName(dept.name)
    setDeptOrder(dept.sort_order)
    setDeptBaseId(dept.base?.id ?? "")
    setShowDeptForm(true)
    setShowGroupForm(null)
  }

  // グループ保存
  const saveGroup = async () => {
    if (!groupName.trim()) return
    if (editGroup) {
      await fetch(`/api/masters/groups/${editGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName, department_id: groupDeptId, sort_order: groupOrder, base_id: groupBaseId || null }),
      })
    } else {
      await fetch("/api/masters/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName, department_id: groupDeptId, sort_order: groupOrder, base_id: groupBaseId || null }),
      })
    }
    setShowGroupForm(null)
    setEditGroup(null)
    setGroupName("")
    setGroupOrder(0)
    setGroupDeptId("")
    setGroupBaseId("")
    fetchAll()
  }

  const deleteGroup = async (id: string) => {
    if (!confirm("このグループを削除しますか？")) return
    await fetch(`/api/masters/groups/${id}`, { method: "DELETE" })
    fetchAll()
  }

  const startEditGroup = (group: Group, deptId: string) => {
    setEditGroup(group)
    setGroupName(group.name)
    setGroupOrder(group.sort_order)
    setGroupDeptId(deptId)
    setGroupBaseId(group.base?.id ?? "")
    setShowGroupForm(deptId)
    setShowDeptForm(false)
  }

  const startAddGroup = (deptId: string) => {
    setEditGroup(null)
    setGroupName("")
    setGroupOrder(0)
    setGroupDeptId(deptId)
    setGroupBaseId("")
    setShowGroupForm(deptId)
    setShowDeptForm(false)
    setExpanded(prev => new Set([...prev, deptId]))
  }

  const baseSelectOptions = (
    <>
      <option value="">拠点なし（横断）</option>
      {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
    </>
  )

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-slate-600" />
          <h1 className="text-xl font-bold text-gray-900">部署・グループマスタ</h1>
        </div>
      </div>

      {/* タブ */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("departments")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === "departments" ? "border-slate-700 text-slate-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          部署・グループ
        </button>
        <button
          onClick={() => setActiveTab("bases")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === "bases" ? "border-slate-700 text-slate-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          拠点マスタ
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : activeTab === "bases" ? (
        /* 拠点タブ */
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { setShowBaseForm(true); setEditBase(null); setBaseName(""); setBaseOrder(0) }}
              className="flex items-center gap-1 px-3 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800"
            >
              <Plus className="w-4 h-4" /> 拠点追加
            </button>
          </div>
          {showBaseForm && (
            <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-sm font-medium text-slate-700 mb-3">{editBase ? "拠点を編集" : "拠点を追加"}</p>
              <div className="flex gap-2">
                <input autoComplete="off" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="拠点名" value={baseName} onChange={e => setBaseName(e.target.value)} />
                <input autoComplete="off" type="number" className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="順序" value={baseOrder} onChange={e => setBaseOrder(Number(e.target.value))} />
                <button onClick={saveBase} className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800">保存</button>
                <button onClick={() => { setShowBaseForm(false); setEditBase(null) }} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">キャンセル</button>
              </div>
            </div>
          )}
          {bases.length === 0 ? (
            <p className="text-sm text-gray-400">拠点がまだ登録されていません。</p>
          ) : (
            <div className="space-y-2">
              {bases.map(base => (
                <div key={base.id} className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span className="flex-1 font-medium text-gray-900">{base.name}</span>
                  <span className="text-xs text-gray-400">{base._count.departments}部署 / {base._count.groups}グループ</span>
                  <button onClick={() => { setEditBase(base); setBaseName(base.name); setBaseOrder(base.sort_order); setShowBaseForm(true) }} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => deleteBase(base.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* 部署・グループタブ */
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { setShowDeptForm(true); setEditDept(null); setDeptName(""); setDeptOrder(0); setDeptBaseId(""); setShowGroupForm(null) }}
              className="flex items-center gap-1 px-3 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800"
            >
              <Plus className="w-4 h-4" /> 部署追加
            </button>
          </div>

          {/* 部署フォーム */}
          {showDeptForm && (
            <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-sm font-medium text-slate-700 mb-3">{editDept ? "部署を編集" : "部署を追加"}</p>
              <div className="flex gap-2 flex-wrap">
                <input autoComplete="off" className="flex-1 min-w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="部署名" value={deptName} onChange={e => setDeptName(e.target.value)} />
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={deptBaseId} onChange={e => setDeptBaseId(e.target.value)}>{baseSelectOptions}</select>
                <input autoComplete="off" type="number" className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="順序" value={deptOrder} onChange={e => setDeptOrder(Number(e.target.value))} />
                <button onClick={saveDept} className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800">保存</button>
                <button onClick={() => { setShowDeptForm(false); setEditDept(null) }} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">キャンセル</button>
              </div>
            </div>
          )}

          {departments.length === 0 ? (
            <p className="text-sm text-gray-400">部署がまだ登録されていません。</p>
          ) : (
            <div className="space-y-2">
              {departments.map(dept => (
                <div key={dept.id} className="border border-gray-200 rounded-xl bg-white shadow-sm">
                  <div className="flex items-center gap-2 px-4 py-3">
                    <button onClick={() => toggleExpand(dept.id)} className="text-gray-400 hover:text-gray-600">
                      {expanded.has(dept.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span className="flex-1 font-medium text-gray-900">{dept.name}</span>
                    {dept.base && (
                      <span className="text-xs text-slate-500 flex items-center gap-0.5 bg-slate-50 px-2 py-0.5 rounded-full">
                        <MapPin className="w-3 h-3" />{dept.base.name}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Users className="w-3 h-3" />{dept._count.users}名</span>
                    <button onClick={() => startAddGroup(dept.id)} className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-50">+ グループ</button>
                    <button onClick={() => startEditDept(dept)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteDept(dept.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>

                  {expanded.has(dept.id) && (
                    <div className="border-t border-gray-100 px-4 py-2 space-y-1">
                      {dept.groups.length === 0 && showGroupForm !== dept.id && (
                        <p className="text-xs text-gray-400 py-1">グループなし</p>
                      )}
                      {dept.groups.map(group => (
                        <div key={group.id}>
                          {showGroupForm === dept.id && editGroup?.id === group.id ? (
                            <div className="flex gap-2 py-1 flex-wrap">
                              <input autoComplete="off" className="flex-1 min-w-28 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" placeholder="グループ名" value={groupName} onChange={e => setGroupName(e.target.value)} />
                              <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" value={groupBaseId} onChange={e => setGroupBaseId(e.target.value)}>{baseSelectOptions}</select>
                              <input autoComplete="off" type="number" className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" placeholder="順序" value={groupOrder} onChange={e => setGroupOrder(Number(e.target.value))} />
                              <button onClick={saveGroup} className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800">保存</button>
                              <button onClick={() => { setShowGroupForm(null); setEditGroup(null) }} className="px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700">×</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 py-1 pl-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                              <span className="flex-1 text-sm text-gray-700">{group.name}</span>
                              {group.base && (
                                <span className="text-xs text-slate-500 flex items-center gap-0.5 bg-slate-50 px-2 py-0.5 rounded-full">
                                  <MapPin className="w-3 h-3" />{group.base.name}
                                </span>
                              )}
                              <span className="text-xs text-gray-400 flex items-center gap-1"><Users className="w-3 h-3" />{group._count.users}名</span>
                              <button onClick={() => startEditGroup(group, dept.id)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-3 h-3" /></button>
                              <button onClick={() => deleteGroup(group.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          )}
                        </div>
                      ))}
                      {showGroupForm === dept.id && !editGroup && (
                        <div className="flex gap-2 py-1 flex-wrap">
                          <input autoComplete="off" className="flex-1 min-w-28 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" placeholder="グループ名" value={groupName} onChange={e => setGroupName(e.target.value)} />
                          <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" value={groupBaseId} onChange={e => setGroupBaseId(e.target.value)}>{baseSelectOptions}</select>
                          <input autoComplete="off" type="number" className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" placeholder="順序" value={groupOrder} onChange={e => setGroupOrder(Number(e.target.value))} />
                          <button onClick={saveGroup} className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800">保存</button>
                          <button onClick={() => setShowGroupForm(null)} className="px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700">×</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
