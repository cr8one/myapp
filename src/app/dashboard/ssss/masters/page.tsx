"use client"
import { useEffect, useState, useCallback } from "react"
import { Plus, Pencil, Trash2, X, Check, AlertCircle } from "lucide-react"

type Company = { id: number; name: string; isActive: boolean }
type Staff = {
  id: string
  name: string
  isIssuer: boolean
  isSupplier: boolean
  isReceiver: boolean
  isOutsourceReceiver: boolean
}

type Tab = "companies" | "staffs"

function RoleBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
      active ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"
    }`}>
      {label}
    </span>
  )
}

export default function MastersPage() {
  const [tab, setTab] = useState<Tab>("companies")
  const [companies, setCompanies] = useState<Company[]>([])
  const [staffs, setStaffs] = useState<Staff[]>([])
  const [fetching, setFetching] = useState(true)

  // 会社マスタ
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [newCompanyName, setNewCompanyName] = useState("")
  const [addingCompany, setAddingCompany] = useState(false)

  // 担当者（編集のみ、追加はユーザー管理から）
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)

  const fetchAll = useCallback(async () => {
    setFetching(true)
    const [c, s] = await Promise.all([
      fetch("/api/ssss/companies?all=1").then(r => r.json()),
      fetch("/api/ssss/staffs?all=1").then(r => r.json()),
    ])
    setCompanies(Array.isArray(c) ? c : [])
    setStaffs(Array.isArray(s) ? s : [])
    setFetching(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // 会社マスタ操作
  const saveCompany = async () => {
    if (!newCompanyName.trim()) return
    await fetch("/api/ssss/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCompanyName.trim() }),
    })
    setNewCompanyName("")
    setAddingCompany(false)
    fetchAll()
  }

  const updateCompany = async (c: Company) => {
    await fetch(`/api/ssss/companies/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: c.name, isActive: c.isActive }),
    })
    setEditingCompany(null)
    fetchAll()
  }

  const deleteCompany = async (id: number) => {
    if (!confirm("削除しますか？")) return
    await fetch(`/api/ssss/companies/${id}`, { method: "DELETE" })
    fetchAll()
  }

  const toggleCompanyActive = async (c: Company) => {
    await fetch(`/api/ssss/companies/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: c.name, isActive: !c.isActive }),
    })
    fetchAll()
  }

  // 担当者フラグ更新（UserPermission経由）
  const updateStaffFlags = async (s: Staff) => {
    await fetch(`/api/users/${s.id}/permission`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ssssIsIssuer: s.isIssuer,
        ssssIsSupplier: s.isSupplier,
        ssssIsReceiver: s.isReceiver,
        ssssIsOutsourceReceiver: s.isOutsourceReceiver,
      }),
    })
    setEditingStaff(null)
    fetchAll()
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">マスタ管理</h1>
        <p className="text-xs text-gray-400 mt-0.5">支給先会社・担当者フラグの管理</p>
      </div>

      {/* タブ */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-6">
          {([["companies", "支給先会社"], ["staffs", "担当者"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
              <span className="ml-2 text-xs text-gray-400">
                {key === "companies" ? companies.length : staffs.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 py-6 max-w-3xl">
        {fetching ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-white rounded-lg animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <>
            {/* 支給先会社タブ */}
            {tab === "companies" && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    onClick={() => setAddingCompany(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    会社を追加
                  </button>
                </div>

                {addingCompany && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
                    <input
                      type="text"
                      value={newCompanyName}
                      onChange={e => setNewCompanyName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && saveCompany()}
                      placeholder="会社名を入力"
                      autoFocus
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={saveCompany} className="text-blue-600 hover:text-blue-800">
                      <Check className="w-5 h-5" />
                    </button>
                    <button onClick={() => { setAddingCompany(false); setNewCompanyName("") }} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {companies.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <AlertCircle className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">会社が登録されていません</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm divide-y divide-gray-100">
                    {companies.map(c => (
                      <div key={c.id} className={`flex items-center gap-3 px-4 py-3 ${!c.isActive ? "opacity-50" : ""}`}>
                        {editingCompany?.id === c.id ? (
                          <>
                            <input
                              type="text"
                              value={editingCompany.name}
                              onChange={e => setEditingCompany({ ...editingCompany, name: e.target.value })}
                              onKeyDown={e => e.key === "Enter" && updateCompany(editingCompany)}
                              autoFocus
                              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button onClick={() => updateCompany(editingCompany)} className="text-blue-600 hover:text-blue-800">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingCompany(null)} className="text-gray-400 hover:text-gray-600">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm text-gray-800">{c.name}</span>
                            <button
                              onClick={() => toggleCompanyActive(c)}
                              className={`text-xs px-2 py-0.5 rounded font-medium border transition-colors ${
                                c.isActive
                                  ? "border-green-200 text-green-600 hover:bg-green-50"
                                  : "border-gray-200 text-gray-400 hover:bg-gray-50"
                              }`}
                            >
                              {c.isActive ? "有効" : "無効"}
                            </button>
                            <button onClick={() => setEditingCompany(c)} className="text-gray-400 hover:text-blue-600">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteCompany(c.id)} className="text-gray-400 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 担当者タブ */}
            {tab === "staffs" && (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700">
                  担当者の追加・削除はユーザー管理画面から行ってください。ここでは各ユーザーのSSSS担当フラグを設定できます。
                </div>

                {staffs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <AlertCircle className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">ユーザーが登録されていません</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm divide-y divide-gray-100">
                    {staffs.map(s => (
                      <div key={s.id} className="px-4 py-3">
                        {editingStaff?.id === s.id ? (
                          <div className="space-y-3">
                            <div className="text-sm font-medium text-gray-800">{s.name}</div>
                            <div className="flex flex-wrap gap-3">
                              {([
                                ["isIssuer", "起票者"],
                                ["isSupplier", "支給者"],
                                ["isReceiver", "受領者"],
                                ["isOutsourceReceiver", "外注受領担当"],
                              ] as const).map(([key, label]) => (
                                <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editingStaff[key]}
                                    onChange={e => setEditingStaff({ ...editingStaff, [key]: e.target.checked })}
                                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600"
                                  />
                                  <span className="text-xs text-gray-600">{label}</span>
                                </label>
                              ))}
                            </div>
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingStaff(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                              </button>
                              <button onClick={() => updateStaffFlags(editingStaff)} className="text-blue-600 hover:text-blue-800">
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className="w-28 text-sm text-gray-800 font-medium">{s.name}</span>
                            <div className="flex flex-wrap gap-1 flex-1">
                              <RoleBadge label="起票者" active={s.isIssuer} />
                              <RoleBadge label="支給者" active={s.isSupplier} />
                              <RoleBadge label="受領者" active={s.isReceiver} />
                              <RoleBadge label="外注受領" active={s.isOutsourceReceiver} />
                            </div>
                            <button onClick={() => setEditingStaff(s)} className="text-gray-400 hover:text-blue-600">
                              <Pencil className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
