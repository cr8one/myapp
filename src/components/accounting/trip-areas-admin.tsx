"use client"
import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"

type Area = { id: string; name: string; sort_order: number }

// 電子申請マスタの「出張区域」タブ。出張旅費精算書の「出張区域」の入力候補を管理する
export default function TripAreasAdmin() {
  const [areas, setAreas] = useState<Area[]>([])
  const [canManage, setCanManage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [sortOrder, setSortOrder] = useState("")
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState("")

  const load = async () => {
    try {
      const res = await fetch("/api/eapp/trip-areas")
      if (!res.ok) throw new Error("出張区域を取得できませんでした")
      const data = await res.json()
      setAreas(data.areas)
      setCanManage(data.can_manage)
      setError("")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const startAdd = () => { setEditId(null); setName(""); setSortOrder(String(areas.length + 1)); setFormError(""); setFormOpen(true) }
  const startEdit = (a: Area) => { setEditId(a.id); setName(a.name); setSortOrder(String(a.sort_order)); setFormError(""); setFormOpen(true) }
  const closeForm = () => { setFormOpen(false); setEditId(null); setName(""); setSortOrder(""); setFormError("") }

  const send = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "保存に失敗しました")
  }

  const submit = async () => {
    setFormError("")
    if (!name.trim()) { setFormError("名前を入力してください"); return }
    if (name.trim().length > 60) { setFormError("名前は60文字までです"); return }
    setBusy(true)
    try {
      const body = { name, sort_order: Number(sortOrder || 0) }
      if (editId) await send(`/api/eapp/trip-areas/${editId}`, "PUT", body)
      else await send("/api/eapp/trip-areas", "POST", body)
      closeForm()
      await load()
    } catch (e: any) {
      setFormError(e.message)
    } finally {
      setBusy(false)
    }
  }
  const remove = async (a: Area) => {
    if (!confirm(`「${a.name}」を削除しますか？すでに伝票に入力された文字は、そのまま残ります（候補から消えるだけです）。`)) return
    try {
      await send(`/api/eapp/trip-areas/${a.id}`, "DELETE")
      await load()
    } catch (e: any) {
      setError(e.message)
    }
  }

  if (loading) return <p className="text-sm text-gray-400">読み込み中...</p>
  if (!canManage) {
    return <p className="text-sm text-gray-500">出張区域の候補を管理できるのは、システム管理者と経理担当だけです。</p>
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4">
        <p className="text-xs text-gray-400">出張旅費精算書の「出張区域」に、文字を打つと出る候補を登録します。候補にない場所も、入力画面では自由に入力できます。</p>
        <button onClick={startAdd} className="flex items-center gap-1 px-3 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 shrink-0">
          <Plus className="w-4 h-4" /> 出張区域を追加
        </button>
      </div>

      {error && <p className="mb-4 text-sm px-4 py-2 rounded bg-red-50 text-red-600">{error}</p>}

      {formOpen && (
        <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <p className="text-sm font-medium text-slate-700">{editId ? "出張区域を変更" : "出張区域を追加"}</p>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-3">
              <label className="block text-xs text-gray-500 mb-1">名前（60文字まで）</label>
              <input className={inputClass} value={name} maxLength={60} autoComplete="off" onChange={e => setName(e.target.value)} placeholder="例：島田プロダクションセンター" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">表示順</label>
              <input className={inputClass} inputMode="numeric" value={sortOrder} autoComplete="off" onChange={e => setSortOrder(e.target.value.replace(/\D/g, "").slice(0, 4))} />
            </div>
          </div>
          {formError && <p className="text-sm px-3 py-2 rounded bg-red-50 text-red-600">{formError}</p>}
          <div className="flex gap-2 justify-end">
            <button disabled={busy} onClick={closeForm} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50">キャンセル</button>
            <button disabled={busy} onClick={submit} className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-50">{busy ? "処理中..." : "保存"}</button>
          </div>
        </div>
      )}

      {areas.length === 0 ? (
        <p className="text-sm text-gray-400">出張区域がまだ登録されていません。</p>
      ) : (
        <div className="space-y-2">
          {areas.map(a => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm">
              <span className="text-xs font-bold text-slate-500 w-8">{a.sort_order}</span>
              <span className="flex-1 text-sm font-medium text-gray-900">{a.name}</span>
              <button onClick={() => startEdit(a)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(a)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
