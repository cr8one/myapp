"use client"
import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, MapPin } from "lucide-react"

type Permission = {
  specView: boolean;     specEdit: boolean
  estimateView: boolean; estimateEdit: boolean
  eappView: boolean;     eappEdit: boolean
  travelView: boolean;   travelEdit: boolean
  sopView: boolean;      sopEdit: boolean
  reportView: boolean;   reportEdit: boolean
  bpmsView: boolean;     bpmsEdit: boolean
  dlmsView: boolean;     dlmsEdit: boolean
  dppView: boolean;      dppEdit: boolean
  ssssView: boolean;     ssssEdit: boolean
  mastersView: boolean;  mastersEdit: boolean
  cadView: boolean;      cadEdit: boolean
  manufacturingView: boolean; manufacturingEdit: boolean
  trayView: boolean;          trayEdit: boolean
  ssssIsIssuer: boolean; ssssIsSupplier: boolean
  ssssIsReceiver: boolean; ssssIsOutsourceReceiver: boolean
  addressBookView: boolean; addressBookEdit: boolean
  addressBookChangeRequestTarget: boolean
  dppStorageLedgerImport: boolean
}
type UserDept = {
  department_id: string
  is_primary: boolean
  department: { id: string; name: string }
}
type UserGroup = {
  group_id: string
  is_primary: boolean
  group: { id: string; name: string }
}
type User = {
  id: string; name: string; email: string
  lastName?: string; firstName?: string; furiganaLastName?: string; furiganaFirstName?: string
  position?: string; positionId?: string; positionRef?: { id: string; name: string; sort_order: number } | null
  phone?: string; employeeNo?: string; gender?: string; employmentType?: string
  role: "ADMIN" | "USER"; createdAt: string
  permission?: Permission
  departments: UserDept[]
  groups: UserGroup[]
}
type Department = {
  id: string
  name: string
  groups: { id: string; name: string; base: { name: string } | null }[]
  base: { name: string } | null
}

const defaultPermission: Permission = {
  specView: true,     specEdit: false,
  estimateView: true, estimateEdit: false,
  eappView: true,     eappEdit: false,
  travelView: true,   travelEdit: false,
  sopView: true,      sopEdit: false,
  reportView: true,   reportEdit: false,
  bpmsView: true,     bpmsEdit: false,
  dlmsView: true,     dlmsEdit: false,
  dppView: true,      dppEdit: false,
  ssssView: true,     ssssEdit: false,
  mastersView: false, mastersEdit: false,
  cadView: true,      cadEdit: false,
  manufacturingView: true, manufacturingEdit: false,
  trayView: true,          trayEdit: false,
  ssssIsIssuer: false, ssssIsSupplier: false,
  ssssIsReceiver: false, ssssIsOutsourceReceiver: false,
  addressBookView: true, addressBookEdit: false,
  addressBookChangeRequestTarget: false,
  dppStorageLedgerImport: false,
}
const permissionGroups: { group: string; color: string; items: { key: keyof Permission; label: string }[] }[] = [
  { group: "仕様書",     color: "bg-blue-50 text-blue-700",    items: [{ key: "specView", label: "閲覧" }, { key: "specEdit", label: "編集" }] },
  { group: "見積書",     color: "bg-green-50 text-green-700",  items: [{ key: "estimateView", label: "閲覧" }, { key: "estimateEdit", label: "編集" }] },
  { group: "電子申請",   color: "bg-cyan-50 text-cyan-700",    items: [{ key: "eappView", label: "閲覧" }, { key: "eappEdit", label: "編集" }] },
  { group: "交通費精算", color: "bg-teal-50 text-teal-700",    items: [{ key: "travelView", label: "閲覧" }, { key: "travelEdit", label: "編集" }] },
  { group: "作業標準書", color: "bg-sky-50 text-sky-700",      items: [{ key: "sopView", label: "閲覧" }, { key: "sopEdit", label: "編集" }] },
  { group: "業務報告書", color: "bg-violet-50 text-violet-700",items: [{ key: "reportView", label: "閲覧" }, { key: "reportEdit", label: "編集" }] },
  { group: "BPMS",       color: "bg-indigo-50 text-indigo-700",items: [{ key: "bpmsView", label: "閲覧" }, { key: "bpmsEdit", label: "編集" }] },
  { group: "DLMS",       color: "bg-orange-50 text-orange-700",items: [{ key: "dlmsView", label: "閲覧" }, { key: "dlmsEdit", label: "編集" }] },
  { group: "CAD/台紙",   color: "bg-lime-50 text-lime-700",    items: [{ key: "cadView", label: "閲覧" }, { key: "cadEdit", label: "編集" }] },
  { group: "製造依頼書", color: "bg-fuchsia-50 text-fuchsia-700", items: [{ key: "manufacturingView", label: "閲覧" }, { key: "manufacturingEdit", label: "編集" }] },
  { group: "トレイ管理", color: "bg-emerald-50 text-emerald-700", items: [{ key: "trayView", label: "閲覧" }, { key: "trayEdit", label: "編集" }] },
  { group: "住所録",     color: "bg-amber-50 text-amber-700",  items: [{ key: "addressBookView", label: "閲覧" }, { key: "addressBookEdit", label: "編集" }, { key: "addressBookChangeRequestTarget", label: "変更依頼配信先" }] },
  { group: "DPP予定表",  color: "bg-pink-50 text-pink-700",    items: [{ key: "dppView", label: "閲覧" }, { key: "dppEdit", label: "編集" }, { key: "dppStorageLedgerImport", label: "データ保管台帳 取込/出力" }] },
  { group: "SSSS",       color: "bg-yellow-50 text-yellow-700",items: [
    { key: "ssssView", label: "閲覧" }, { key: "ssssEdit", label: "編集" },
    { key: "ssssIsIssuer", label: "起票者" }, { key: "ssssIsSupplier", label: "支給者" },
    { key: "ssssIsReceiver", label: "受領者" }, { key: "ssssIsOutsourceReceiver", label: "外注受領" },
  ]},
  { group: "マスタ管理", color: "bg-gray-100 text-gray-700",   items: [{ key: "mastersView", label: "閲覧" }, { key: "mastersEdit", label: "編集" }] },
]

export default function UsersPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const importRef = useRef<HTMLInputElement>(null)

  const [lastName, setLastName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [furiganaLastName, setFuriganaLastName] = useState("")
  const [furiganaFirstName, setFuriganaFirstName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [positionId, setPositionId] = useState("")
  const [positions, setPositions] = useState<{ id: string; name: string; sort_order: number }[]>([])
  const [employeeNo, setEmployeeNo] = useState("")
  const [gender, setGender] = useState("")
  const [employmentType, setEmploymentType] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<"ADMIN" | "USER">("USER")
  const [permission, setPermission] = useState<Permission>(defaultPermission)
  // 部署・グループ選択: { department_id, is_primary }[]
  const [selectedDepts, setSelectedDepts] = useState<{ department_id: string; is_primary: boolean }[]>([])
  const [selectedGroups, setSelectedGroups] = useState<{ group_id: string; is_primary: boolean }[]>([])

  const [sort, setSort] = useState("org")
  const fetchUsers = async (sortValue?: string) => {
    const res = await fetch(`/api/users?sort=${sortValue ?? sort}`)
    setUsers(await res.json())
  }
  const fetchDepartments = async () => {
    const res = await fetch("/api/masters/departments")
    setDepartments(await res.json())
  }
  const fetchPositions = async () => {
    const res = await fetch("/api/masters/positions")
    setPositions(await res.json())
  }
  useEffect(() => { fetchUsers(); fetchDepartments(); fetchPositions() }, [])
  const changeSort = (value: string) => { setSort(value); fetchUsers(value) }

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase()
    const deptNames = u.departments.map(d => d.department.name.toLowerCase()).join(" ")
    const groupNames = u.groups.map(g => g.group.name.toLowerCase()).join(" ")
    return u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) ||
      u.positionRef?.name.toLowerCase().includes(q) || deptNames.includes(q) || groupNames.includes(q)
  })

  const resetForm = () => {
    setLastName(""); setFirstName(""); setFuriganaLastName(""); setFuriganaFirstName(""); setEmail(""); setPassword("")
    setPositionId(""); setPhone(""); setEmployeeNo(""); setGender(""); setEmploymentType("")
    setRole("USER"); setPermission(defaultPermission)
    setSelectedDepts([]); setSelectedGroups([])
    setError(""); setEditUser(null); setShowForm(false)
  }

  const handleEdit = (user: User) => {
    setEditUser(user)
    setLastName(user.lastName ?? ""); setFirstName(user.firstName ?? "")
    setFuriganaLastName(user.furiganaLastName ?? ""); setFuriganaFirstName(user.furiganaFirstName ?? "")
    setEmail(user.email)
    setPositionId(user.positionId ?? "")
    setEmployeeNo(user.employeeNo ?? "")
    setGender(user.gender ?? "")
    setEmploymentType(user.employmentType ?? "")
    setPhone(user.phone ?? ""); setPassword(""); setRole(user.role)
    setPermission({ ...defaultPermission, ...(user.permission ?? {}) })
    setSelectedDepts(user.departments.map(d => ({ department_id: d.department_id, is_primary: d.is_primary })))
    setSelectedGroups(user.groups.map(g => ({ group_id: g.group_id, is_primary: g.is_primary })))
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSubmit = async () => {
    setLoading(true); setError("")
    const body = {
      lastName, firstName, furiganaLastName, furiganaFirstName,
      email, password: password || undefined, positionId: positionId || null, phone, employeeNo, gender, employmentType, role,
      permission: role === "ADMIN" ? undefined : permission,
      departments: selectedDepts,
      groups: selectedGroups,
    }
    const res = editUser
      ? await fetch(`/api/users/${editUser.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (!res.ok) { setError((await res.json()).error ?? "処理に失敗しました"); setLoading(false); return }
    resetForm(); setLoading(false); fetchUsers()
  }

  const handleDelete = async (id: string) => {
    if (id === session?.user?.id) { alert("自分自身は削除できません"); return }
    if (!confirm("このユーザーを削除しますか？")) return
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" })
    if (!res.ok) { alert(`削除失敗: ${(await res.json().catch(() => ({}))).error ?? res.status}`); return }
    fetchUsers()
  }

  const handleExport = () => { window.location.href = "/api/users/export" }
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const formData = new FormData(); formData.append("file", file)
    const res = await fetch("/api/users/import", { method: "POST", body: formData })
    const result = await res.json()
    if (res.ok) {
      alert(`インポート完了：${result.created}件登録、${result.skipped}件スキップ${result.errors.length > 0 ? `\nエラー：${result.errors.join("\n")}` : ""}`)
      fetchUsers()
    } else { alert(`エラー：${result.error}`) }
    e.target.value = ""
  }

  const toggleDept = (deptId: string) => {
    setSelectedDepts(prev => {
      const exists = prev.find(d => d.department_id === deptId)
      if (exists) {
        const next = prev.filter(d => d.department_id !== deptId)
        // メインが消えた場合、先頭をメインに
        if (exists.is_primary && next.length > 0) next[0].is_primary = true
        return next
      }
      return [...prev, { department_id: deptId, is_primary: prev.length === 0 }]
    })
  }

  const setPrimaryDept = (deptId: string) => {
    setSelectedDepts(prev => prev.map(d => ({ ...d, is_primary: d.department_id === deptId })))
  }

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev => {
      const exists = prev.find(g => g.group_id === groupId)
      if (exists) {
        const next = prev.filter(g => g.group_id !== groupId)
        if (exists.is_primary && next.length > 0) next[0].is_primary = true
        return next
      }
      return [...prev, { group_id: groupId, is_primary: prev.length === 0 }]
    })
  }

  const setPrimaryGroup = (groupId: string) => {
    setSelectedGroups(prev => prev.map(g => ({ ...g, is_primary: g.group_id === groupId })))
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ユーザー管理</h1>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button variant="outline" onClick={handleExport}>CSVエクスポート</Button>
              <Button variant="outline" onClick={() => importRef.current?.click()}>CSVインポート</Button>
              <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
              <Button onClick={() => { resetForm(); setShowForm(!showForm) }}>
                {showForm ? "キャンセル" : "新規登録"}
              </Button>
            </>
          )}
        </div>
      </div>

      {showForm && isAdmin && (
        <Card className="mb-8">
          <CardHeader><CardTitle>{editUser ? "ユーザー編集" : "ユーザー登録"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>姓</Label><Input autoComplete="off" value={lastName} onChange={e => setLastName(e.target.value)} /></div>
              <div className="space-y-2"><Label>名</Label><Input autoComplete="off" value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>フリガナ姓</Label><Input autoComplete="off" value={furiganaLastName} onChange={e => setFuriganaLastName(e.target.value)} /></div>
              <div className="space-y-2"><Label>フリガナ名</Label><Input autoComplete="off" value={furiganaFirstName} onChange={e => setFuriganaFirstName(e.target.value)} /></div>
            </div>
            {!editUser && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>メールアドレス</Label><Input autoComplete="off" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{editUser ? "新しいパスワード（変更する場合のみ）" : "パスワード"}</Label>
                <Input autoComplete="off" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="space-y-2"><Label>電話番号</Label><Input autoComplete="off" value={phone} onChange={e => setPhone(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>役職</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-white" value={positionId} onChange={e => setPositionId(e.target.value)}>
                  <option value="">未選択</option>
                  {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>社員番号</Label><Input autoComplete="off" value={employeeNo} onChange={e => setEmployeeNo(e.target.value)} /></div>
              <div className="space-y-2">
                <Label>性別</Label>
                <select className="w-full border rounded px-3 py-2 text-sm bg-white" value={gender} onChange={e => setGender(e.target.value)}>
                  <option value="">未選択</option>
                  <option value="男性">男性</option>
                  <option value="女性">女性</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>雇用形態</Label>
                <select className="w-full border rounded px-3 py-2 text-sm bg-white" value={employmentType} onChange={e => setEmploymentType(e.target.value)}>
                  <option value="">未選択</option>
                  <option value="正社員">正社員</option>
                  <option value="契約社員">契約社員</option>
                  <option value="嘱託社員">嘱託社員</option>
                  <option value="パート">パート</option>
                  <option value="アルバイト">アルバイト</option>
                  <option value="派遣社員">派遣社員</option>
                  <option value="業務委託">業務委託</option>
                </select>
              </div>
                <Label>ロール</Label>
                <select className="w-full border rounded px-3 py-2 text-sm" value={role} onChange={e => setRole(e.target.value as "ADMIN" | "USER")}>
                  <option value="USER">一般ユーザー</option>
                  <option value="ADMIN">管理者（ADMIN）</option>
                </select>
              </div>
            </div>

            {/* 部署選択 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Building2 className="w-4 h-4" />部署（複数選択可）</Label>
              <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                {departments.length === 0 ? (
                  <p className="text-xs text-gray-400">部署が登録されていません</p>
                ) : departments.map(dept => {
                  const selected = selectedDepts.find(d => d.department_id === dept.id)
                  return (
                    <div key={dept.id} className="flex items-center gap-2">
                      <input type="checkbox" id={`dept-${dept.id}`} checked={!!selected}
                        onChange={() => toggleDept(dept.id)} className="rounded" />
                      <label htmlFor={`dept-${dept.id}`} className="flex-1 text-sm cursor-pointer">
                        {dept.name}
                        {dept.base && <span className="ml-1 text-xs text-gray-400">({dept.base.name})</span>}
                      </label>
                      {selected && (
                        <button
                          onClick={() => setPrimaryDept(dept.id)}
                          className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${selected.is_primary ? "bg-slate-700 text-white border-slate-700" : "text-slate-500 border-slate-300 hover:border-slate-500"}`}
                        >
                          {selected.is_primary ? "メイン" : "メインにする"}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* グループ選択 */}
            <div className="space-y-2">
              <Label>グループ（複数選択可）</Label>
              <div className="border rounded-lg p-3 space-y-3 max-h-48 overflow-y-auto">
                {departments.filter(d => d.groups.length > 0).length === 0 ? (
                  <p className="text-xs text-gray-400">グループが登録されていません</p>
                ) : departments.filter(d => d.groups.length > 0).map(dept => (
                  <div key={dept.id}>
                    <p className="text-xs font-medium text-gray-500 mb-1">{dept.name}</p>
                    <div className="space-y-1 pl-2">
                      {dept.groups.map(group => {
                        const selected = selectedGroups.find(g => g.group_id === group.id)
                        return (
                          <div key={group.id} className="flex items-center gap-2">
                            <input type="checkbox" id={`group-${group.id}`} checked={!!selected}
                              onChange={() => toggleGroup(group.id)} className="rounded" />
                            <label htmlFor={`group-${group.id}`} className="flex-1 text-sm cursor-pointer">
                              {group.name}
                              {group.base && <span className="ml-1 text-xs text-gray-400">({group.base.name})</span>}
                            </label>
                            {selected && (
                              <button
                                onClick={() => setPrimaryGroup(group.id)}
                                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${selected.is_primary ? "bg-slate-700 text-white border-slate-700" : "text-slate-500 border-slate-300 hover:border-slate-500"}`}
                              >
                                {selected.is_primary ? "メイン" : "メインにする"}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {role === "USER" && (
              <div className="space-y-2">
                <Label>権限設定</Label>
                <div className="border rounded p-3 grid grid-cols-2 gap-3">
                  {permissionGroups.map(({ group, items }) => (
                    <div key={group} className="border rounded p-2">
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">{group}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                        {items.map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-1.5 text-sm cursor-pointer">
                            <input type="checkbox" checked={permission[key]}
                              onChange={e => setPermission(p => ({ ...p, [key]: e.target.checked }))} />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? "処理中..." : editUser ? "更新する" : "登録する"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mb-4">
        <Input placeholder="名前・メール・部署・グループ・役職で検索..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { value: "org", label: "組織順" },
          { value: "email_asc", label: "メール昇順" },
          { value: "email_desc", label: "メール降順" },
          { value: "created_asc", label: "作成日昇順" },
          { value: "created_desc", label: "作成日降順" },
          { value: "updated_asc", label: "更新日昇順" },
          { value: "updated_desc", label: "更新日降順" },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => changeSort(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${sort === opt.value ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filteredUsers.length === 0 ? (
        <p className="text-center text-gray-500 py-8">{searchQuery ? "検索結果がありません" : "ユーザーが登録されていません"}</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col style={{ width: "16%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-50 border-b text-xs text-gray-500">
                <th className="px-3 py-2 text-left font-medium">名前</th>
                <th className="px-3 py-2 text-left font-medium">メール</th>
                <th className="px-3 py-2 text-left font-medium">部署・グループ</th>
                <th className="px-3 py-2 text-left font-medium">役職・連絡先</th>
                <th className="px-3 py-2 text-left font-medium">権限</th>
                <th className="px-3 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">{user.name}</span>
                      {user.role === "ADMIN" && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full shrink-0">ADMIN</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-600 truncate" title={user.email}>{user.email}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {user.departments.map(d => (
                        <span key={d.department_id} className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-0.5 ${d.is_primary ? "bg-slate-100 text-slate-700 font-medium" : "bg-gray-50 text-gray-500"}`}>
                          <Building2 className="w-3 h-3" />{d.department.name}{d.is_primary && " ★"}
                        </span>
                      ))}
                      {user.groups.map(g => (
                        <span key={g.group_id} className={`text-xs px-2 py-0.5 rounded-full ${g.is_primary ? "bg-blue-50 text-blue-700 font-medium" : "bg-gray-50 text-gray-500"}`}>
                          {g.group.name}{g.is_primary && " ★"}
                        </span>
                      ))}
                      {user.departments.length === 0 && user.groups.length === 0 && <span className="text-xs text-gray-300">-</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500 space-y-0.5">
                    {user.positionRef && <p>役職: {user.positionRef.name}</p>}
                    {user.phone && <p>電話: {user.phone}</p>}
                    {user.employeeNo && <p>社員番号: {user.employeeNo}</p>}
                    {!user.positionRef && !user.phone && !user.employeeNo && <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-3 py-2">
                    {user.role === "USER" && user.permission ? (
                      <div className="flex flex-wrap gap-1">
                        {permissionGroups.map(({ group, color, items }) => {
                          const active = items.filter(({ key }) => user.permission![key])
                          if (active.length === 0) return null
                          return active.map(({ key, label }) => (
                            <span key={key} className={`text-xs px-2 py-0.5 rounded font-medium ${color}`}>
                              {group}:{label}
                            </span>
                          ))
                        })}
                      </div>
                    ) : <span className="text-xs text-gray-300">-</span>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {isAdmin && (
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>編集</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(user.id)}>削除</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
