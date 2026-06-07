"use client"
import { useEffect, useState } from "react"
import { Building2, Plus, Pencil, Trash2, ChevronDown, ChevronRight, Users } from "lucide-react"

type Group = {
  id: string
  name: string
  sort_order: number
  _count: { users: number }
}
type Department = {
  id: string
  name: string
  sort_order: number
  groups: Group[]
  _count: { users: number }
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // 部署フォーム
  const [showDeptForm, setShowDeptForm] = useState(false)
  const [editDept, setEditDept] = useState<Department | null>(null)
  const [deptName, setDeptName] = useState("")
  const [deptOrder, setDeptOrder] = useState(0)

  // グループフォーム
  const [showGroupForm, setShowGroupForm] = useState<string | null>(null) // department_id
  const [editGroup, setEditGroup] = useState<Group | null>(null)
  const [groupName, setGroupName] = useState("")
  const [groupOrder, setGroupOrder] = useState(0)
  const [groupDeptId, setGroupDeptId] = useState("")

  const fetch_ = async () => {
    setLoading(true)
    const res = await fetch("/api/masters/departments")
    const data = await res.json()
    setDepartments(data)
    setLoading(false)
  }

  useEffect(() => { fetch_() }, [])

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // 部署保存
  const saveDept = async () => {
    if (!deptName.trim()) return
    if (editDept) {
      await fetch(`/api/masters/departments/${editDept.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deptName, sort_order: deptOrder }),
      })
    } else {
      await fetch("/api/masters/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deptName, sort_order: deptOrder }),
      })
    }
    setShowDeptForm(false)
    setEditDept(null)
    setDeptName("")
    setDeptOrder(0)
    fetch_()
  }

  const deleteDept = async (id: string) => {
    if (!confirm("この部署を削除しますか？\n所属するグループも削除されます。")) return
    await fetch(`/api/masters/departments/${id}`, { method: "DELETE" })
    fetch_()
  }

  const startEditDept = (dept: Department) => {
    setEditDept(dept)
    setDeptName(dept.name)
    setDeptOrder(dept.sort_order)
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
        body: JSON.stringify({ name: groupName, department_id: groupDeptId, sort_order: groupOrder }),
      })
    } else {
      await fetch("/api/masters/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName, department_id: groupDeptId, sort_order: groupOrder }),
      })
    }
    setShowGroupForm(null)
    setEditGroup(null)
    setGroupName("")
    setGroupOrder(0)
    setGroupDeptId("")
    fetch_()
  }

  const deleteGroup = async (id: string) => {
    if (!confirm("このグループを削除しますか？")) return
    await fetch(`/api/masters/groups/${id}`, { method: "DELETE" })
    fetch_()
  }

  const startEditGroup = (group: Group, deptId: string) => {
    setEditGroup(group)
    setGroupName(group.name)
    setGroupOrder(group.sort_order)
    setGroupDeptId(deptId)
    setShowGroupForm(deptId)
    setShowDeptForm(false)
  }

  const startAddGroup = (deptId: string) => {
    setEditGroup(null)
    setGroupName("")
    setGroupOrder(0)
    setGroupDeptId(deptId)
    setShowGroupForm(deptId)
    setShowDeptForm(false)
    setExpanded(prev => new Set([...prev, deptId]))
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-slate-600" />
          <h1 className="text-xl font-bold text-gray-900">部署・グループマスタ</h1>
        </div>
        <button
          onClick={() => { setShowDeptForm(true); setEditDept(null); setDeptName(""); setDeptOrder(0); setShowGroupForm(null) }}
          className="flex items-center gap-1 px-3 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800"
        >
          <Plus className="w-4 h-4" /> 部署追加
        </button>
      </div>

      {/* 部署フォーム */}
      {showDeptForm && (
        <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-sm font-medium text-slate-700 mb-3">{editDept ? "部署を編集" : "部署を追加"}</p>
          <div className="flex gap-2">
            <input
              autoComplete="off"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="部署名"
              value={deptName}
              onChange={e => setDeptName(e.target.value)}
            />
            <input
              autoComplete="off"
              type="number"
              className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="順序"
              value={deptOrder}
              onChange={e => setDeptOrder(Number(e.target.value))}
            />
            <button onClick={saveDept} className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800">保存</button>
            <button onClick={() => { setShowDeptForm(false); setEditDept(null) }} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">キャンセル</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : departments.length === 0 ? (
        <p className="text-sm text-gray-400">部署がまだ登録されていません。</p>
      ) : (
        <div className="space-y-2">
          {departments.map(dept => (
            <div key={dept.id} className="border border-gray-200 rounded-xl bg-white shadow-sm">
              {/* 部署行 */}
              <div className="flex items-center gap-2 px-4 py-3">
                <button onClick={() => toggleExpand(dept.id)} className="text-gray-400 hover:text-gray-600">
                  {expanded.has(dept.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <Building2 className="w-4 h-4 text-slate-500" />
                <span className="flex-1 font-medium text-gray-900">{dept.name}</span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Users className="w-3 h-3" />{dept._count.users}名
                </span>
                <button onClick={() => startAddGroup(dept.id)} className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-50">
                  + グループ
                </button>
                <button onClick={() => startEditDept(dept)} className="p-1 text-gray-400 hover:text-blue-600">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deleteDept(dept.id)} className="p-1 text-gray-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* グループ一覧 */}
              {expanded.has(dept.id) && (
                <div className="border-t border-gray-100 px-4 py-2 space-y-1">
                  {dept.groups.length === 0 && showGroupForm !== dept.id && (
                    <p className="text-xs text-gray-400 py-1">グループなし</p>
                  )}
                  {dept.groups.map(group => (
                    <div key={group.id}>
                      {showGroupForm === dept.id && editGroup?.id === group.id ? (
                        <div className="flex gap-2 py-1">
                          <input
                            autoComplete="off"
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                            placeholder="グループ名"
                            value={groupName}
                            onChange={e => setGroupName(e.target.value)}
                          />
                          <input
                            autoComplete="off"
                            type="number"
                            className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                            placeholder="順序"
                            value={groupOrder}
                            onChange={e => setGroupOrder(Number(e.target.value))}
                          />
                          <button onClick={saveGroup} className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800">保存</button>
                          <button onClick={() => { setShowGroupForm(null); setEditGroup(null) }} className="px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700">×</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 py-1 pl-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span className="flex-1 text-sm text-gray-700">{group.name}</span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Users className="w-3 h-3" />{group._count.users}名
                          </span>
                          <button onClick={() => startEditGroup(group, dept.id)} className="p-1 text-gray-400 hover:text-blue-600">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button onClick={() => deleteGroup(group.id)} className="p-1 text-gray-400 hover:text-red-500">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {/* グループ追加フォーム */}
                  {showGroupForm === dept.id && !editGroup && (
                    <div className="flex gap-2 py-1">
                      <input
                        autoComplete="off"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                        placeholder="グループ名"
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                      />
                      <input
                        autoComplete="off"
                        type="number"
                        className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                        placeholder="順序"
                        value={groupOrder}
                        onChange={e => setGroupOrder(Number(e.target.value))}
                      />
                      <button onClick={saveGroup} className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800">保存</button>
                      <button onClick={() => { setShowGroupForm(null) }} className="px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700">×</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
