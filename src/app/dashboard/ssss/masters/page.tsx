"use client"
import { useEffect, useState, useCallback } from "react"
import { Plus, Pencil, Trash2, X, Check, AlertCircle } from "lucide-react"

type Company = { id: number; name: string; sortOrder: number; isActive: boolean }
type Part = { id: number; name: string; sortOrder: number; isActive: boolean }
type Staff = {
  id: string; name: string
  isIssuer: boolean; isSupplier: boolean; isReceiver: boolean; isOutsourceReceiver: boolean
  issuerOrder: number; supplierOrder: number; receiverOrder: number; outsourceReceiverOrder: number
}

type Tab = "companies" | "parts" | "staffs"

function RoleBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
      active ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"
    }`}>{label}</span>
  )
}

function SortOrderInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input type="number" value={value} onChange={e => onChange(parseInt(e.target.value) || 0)}
      className="w-16 px-2 py-1 text-xs text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="0" />
  )
}

export default function MastersPage() {
  const [tab, setTab] = useState<Tab>("companies")
  const [companies, setCompanies] = useState<Company[]>([])
  const [parts, setParts] = useState<Part[]>([])
  const [staffs, setStaffs] = useState<Staff[]>([])
  const [fetching, setFetching] = useState(true)

  // 会社
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [addingCompany, setAddingCompany] = useState(false)
  const [newCompany, setNewCompany] = useState({ name: "", sortOrder: 0 })

  // パーツ
  const [editingPart, setEditingPart] = useState<Part | null>(null)
  const [addingPart, setAddingPart] = useState(false)
  const [newPart, setNewPart] = useState({ name: "", sortOrder: 0 })

  // 担当者
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)

  const fetchAll = useCallback(async () => {
    setFetching(true)
    const [c, p, s] = await Promise.all([
      fetch("/api/ssss/companies?all=1").then(r => r.json()),
      fetch("/api/ssss/parts?all=1").then(r => r.json()),
      fetch("/api/ssss/staffs?all=1").then(r => r.json()),
    ])
    setCompanies(Array.isArray(c) ? c : [])
    setParts(Array.isArray(p) ? p : [])
    setStaffs(Array.isArray(s) ? s : [])
    setFetching(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // 会社操作
  const saveCompany = async () => {
    if (!newCompany.name.trim()) return
    await fetch("/api/ssss/companies", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCompany.name.trim(), sortOrder: newCompany.sortOrder }),
    })
    setNewCompany({ name: "", sortOrder: 0 }); setAddingCompany(false); fetchAll()
  }
  const updateCompany = async (c: Company) => {
    await fetch(`/api/ssss/companies/${c.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: c.name, sortOrder: c.sortOrder, isActive: c.isActive }),
    })
    setEditingCompany(null); fetchAll()
  }
  const deleteCompany = async (id: number) => {
    if (!confirm("削除しますか？")) return
    await fetch(`/api/ssss/companies/${id}`, { method: "DELETE" }); fetchAll()
  }
  const toggleCompanyActive = async (c: Company) => {
    await fetch(`/api/ssss/companies/${c.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: c.name, sortOrder: c.sortOrder, isActive: !c.isActive }),
    }); fetchAll()
  }

  // パーツ操作
  const savePart = async () => {
    if (!newPart.name.trim()) return
    await fetch("/api/ssss/parts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newPart.name.trim(), sortOrder: newPart.sortOrder }),
    })
    setNewPart({ name: "", sortOrder: 0 }); setAddingPart(false); fetchAll()
  }
  const updatePart = async (p: Part) => {
    await fetch(`/api/ssss/parts/${p.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: p.name, sortOrder: p.sortOrder, isActive: p.isActive }),
    })
    setEditingPart(null); fetchAll()
  }
  const deletePart = async (id: number) => {
    if (!confirm("削除しますか？")) return
    await fetch(`/api/ssss/parts/${id}`, { method: "DELETE" }); fetchAll()
  }
  const togglePartActive = async (p: Part) => {
    await fetch(`/api/ssss/parts/${p.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: p.name, sortOrder: p.sortOrder, isActive: !p.isActive }),
    }); fetchAll()
  }

  // 担当者フラグ更新
  const updateStaffFlags = async (s: Staff) => {
    await fetch(`/api/users/${s.id}/permission`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ssssIsIssuer: s.isIssuer, ssssIsSupplier: s.isSupplier,
        ssssIsReceiver: s.isReceiver, ssssIsOutsourceReceiver: s.isOutsourceReceiver,
        ssssIssuerOrder: s.issuerOrder, ssssSupplierOrder: s.supplierOrder,
        ssssReceiverOrder: s.receiverOrder, ssssOutsourceReceiverOrder: s.outsourceReceiverOrder,
      }),
    })
    setEditingStaff(null); fetchAll()
  }

  const tabs: [Tab, string, number][] = [
    ["companies", "支給先会社", companies.length],
    ["parts", "貼り付けパーツ", parts.length],
    ["staffs", "担当者", staffs.length],
  ]

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">マスタ管理</h1>
        <p className="text-xs text-gray-400 mt-0.5">支給先会社・パーツ・担当者の登録・編集</p>
      </div>

      <div className="bg-white border-b px-6">
        <div className="flex gap-6">
          {tabs.map(([key, label, count]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              {label}
              <span className="ml-2 text-xs text-gray-400">{count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 py-6 max-w-3xl">
        {fetching ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white rounded-lg animate-pulse border border-gray-100" />)}
          </div>
        ) : (
          <>
            {/* 支給先会社 */}
            {tab === "companies" && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button onClick={() => setAddingCompany(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm">
                    <Plus className="w-4 h-4" />会社を追加
                  </button>
                </div>
                {addingCompany && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
                    <input type="text" value={newCompany.name} onChange={e => setNewCompany(p => ({ ...p, name: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && saveCompany()}
                      placeholder="会社名" autoFocus
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">順序</span>
                      <SortOrderInput value={newCompany.sortOrder} onChange={v => setNewCompany(p => ({ ...p, sortOrder: v }))} />
                    </div>
                    <button onClick={saveCompany} className="text-blue-600 hover:text-blue-800"><Check className="w-5 h-5" /></button>
                    <button onClick={() => { setAddingCompany(false); setNewCompany({ name: "", sortOrder: 0 }) }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
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
                            <input type="text" value={editingCompany.name}
                              onChange={e => setEditingCompany({ ...editingCompany, name: e.target.value })}
                              onKeyDown={e => e.key === "Enter" && updateCompany(editingCompany)}
                              autoFocus className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">順序</span>
                              <SortOrderInput value={editingCompany.sortOrder} onChange={v => setEditingCompany({ ...editingCompany, sortOrder: v })} />
                            </div>
                            <button onClick={() => updateCompany(editingCompany)} className="text-blue-600 hover:text-blue-800"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingCompany(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                          </>
                        ) : (
                          <>
                            <span className="w-6 text-xs text-gray-400 text-right">{c.sortOrder}</span>
                            <span className="flex-1 text-sm text-gray-800">{c.name}</span>
                            <button onClick={() => toggleCompanyActive(c)}
                              className={`text-xs px-2 py-0.5 rounded font-medium border transition-colors ${
                                c.isActive ? "border-green-200 text-green-600 hover:bg-green-50" : "border-gray-200 text-gray-400 hover:bg-gray-50"
                              }`}>{c.isActive ? "有効" : "無効"}</button>
                            <button onClick={() => setEditingCompany(c)} className="text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => deleteCompany(c.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 貼り付けパーツ */}
            {tab === "parts" && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button onClick={() => setAddingPart(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm">
                    <Plus className="w-4 h-4" />パーツを追加
                  </button>
                </div>
                {addingPart && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
                    <input type="text" value={newPart.name} onChange={e => setNewPart(p => ({ ...p, name: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && savePart()}
                      placeholder="パーツ名" autoFocus
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">順序</span>
                      <SortOrderInput value={newPart.sortOrder} onChange={v => setNewPart(p => ({ ...p, sortOrder: v }))} />
                    </div>
                    <button onClick={savePart} className="text-blue-600 hover:text-blue-800"><Check className="w-5 h-5" /></button>
                    <button onClick={() => { setAddingPart(false); setNewPart({ name: "", sortOrder: 0 }) }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                  </div>
                )}
                {parts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <AlertCircle className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">パーツが登録されていません</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm divide-y divide-gray-100">
                    {parts.map(p => (
                      <div key={p.id} className={`flex items-center gap-3 px-4 py-3 ${!p.isActive ? "opacity-50" : ""}`}>
                        {editingPart?.id === p.id ? (
                          <>
                            <input type="text" value={editingPart.name}
                              onChange={e => setEditingPart({ ...editingPart, name: e.target.value })}
                              onKeyDown={e => e.key === "Enter" && updatePart(editingPart)}
                              autoFocus className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">順序</span>
                              <SortOrderInput value={editingPart.sortOrder} onChange={v => setEditingPart({ ...editingPart, sortOrder: v })} />
                            </div>
                            <button onClick={() => updatePart(editingPart)} className="text-blue-600 hover:text-blue-800"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingPart(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                          </>
                        ) : (
                          <>
                            <span className="w-6 text-xs text-gray-400 text-right">{p.sortOrder}</span>
                            <span className="flex-1 text-sm text-gray-800">{p.name}</span>
                            <button onClick={() => togglePartActive(p)}
                              className={`text-xs px-2 py-0.5 rounded font-medium border transition-colors ${
                                p.isActive ? "border-green-200 text-green-600 hover:bg-green-50" : "border-gray-200 text-gray-400 hover:bg-gray-50"
                              }`}>{p.isActive ? "有効" : "無効"}</button>
                            <button onClick={() => setEditingPart(p)} className="text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => deletePart(p.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 担当者 */}
            {tab === "staffs" && (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700">
                  担当者の追加・削除はユーザー管理画面から行ってください。ここではSSSSフラグと各役割のソート順を設定できます。
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
                            <div className="grid grid-cols-2 gap-3">
                              {([
                                ["isIssuer", "issuerOrder", "起票者"],
                                ["isSupplier", "supplierOrder", "支給者"],
                                ["isReceiver", "receiverOrder", "受領者"],
                                ["isOutsourceReceiver", "outsourceReceiverOrder", "外注受領担当"],
                              ] as const).map(([flagKey, orderKey, label]) => (
                                <div key={flagKey} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                                  <label className="flex items-center gap-1.5 cursor-pointer flex-1">
                                    <input type="checkbox" checked={editingStaff[flagKey]}
                                      onChange={e => setEditingStaff({ ...editingStaff, [flagKey]: e.target.checked })}
                                      className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600" />
                                    <span className="text-xs text-gray-600">{label}</span>
                                  </label>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-400">順序</span>
                                    <SortOrderInput value={editingStaff[orderKey]}
                                      onChange={v => setEditingStaff({ ...editingStaff, [orderKey]: v })} />
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingStaff(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                              <button onClick={() => updateStaffFlags(editingStaff)} className="text-blue-600 hover:text-blue-800"><Check className="w-4 h-4" /></button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className="w-24 text-sm text-gray-800 font-medium">{s.name}</span>
                            <div className="flex flex-wrap gap-1 flex-1">
                              <RoleBadge label="起票者" active={s.isIssuer} />
                              <RoleBadge label="支給者" active={s.isSupplier} />
                              <RoleBadge label="受領者" active={s.isReceiver} />
                              <RoleBadge label="外注受領" active={s.isOutsourceReceiver} />
                            </div>
                            <button onClick={() => setEditingStaff(s)} className="text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
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
