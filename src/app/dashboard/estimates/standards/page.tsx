"use client"
import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Copy, Archive, RotateCcw } from "lucide-react"
import Link from "next/link"

type Standard = {
  id: string
  name: string
  parent_id: string | null
  remarks: string | null
  is_archived: boolean
  parent: { id: string; name: string } | null
  _count: { children: number; estimates: number }
}
type Form = { id: string | null; copy_from_id: string | null; name: string; parent_id: string; remarks: string }

async function request(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
  const data = await res.json().catch(() => null)
  return { ok: res.ok, data }
}

const btnPrimary = "px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800"
const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"

export default function EstimateStandardsPage() {
  const [rows, setRows] = useState<Standard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [form, setForm] = useState<Form | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const load = async () => {
    setLoading(true)
    const r = await request("/api/estimates/standards", "GET")
    if (r.ok && Array.isArray(r.data)) {
      setRows(r.data)
    } else {
      setRows([])
      setError(r.data?.error ?? "読み込みに失敗しました")
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const openNew = () => setForm({ id: null, copy_from_id: null, name: "", parent_id: "", remarks: "" })
  const openEdit = (s: Standard) => setForm({ id: s.id, copy_from_id: null, name: s.name, parent_id: s.parent_id ?? "", remarks: s.remarks ?? "" })
  const openCopy = (s: Standard) => setForm({ id: null, copy_from_id: s.id, name: `${s.name}（コピー）`, parent_id: s.parent_id ?? "", remarks: s.remarks ?? "" })

  const save = async () => {
    if (!form) return
    setError("")
    const r = form.id
      ? await request(`/api/estimates/standards/${form.id}`, "PUT", { name: form.name, parent_id: form.parent_id || null, remarks: form.remarks })
      : await request("/api/estimates/standards", "POST", { name: form.name, parent_id: form.parent_id || null, remarks: form.remarks, copy_from_id: form.copy_from_id })
    if (!r.ok) { setError(r.data?.error ?? "保存に失敗しました"); return }
    setForm(null)
    await load()
  }

  const toggleArchive = async (s: Standard) => {
    setError("")
    const r = await request(`/api/estimates/standards/${s.id}`, "PUT", { is_archived: !s.is_archived })
    if (!r.ok) { setError(r.data?.error ?? "更新に失敗しました"); return }
    await load()
  }

  const remove = async (s: Standard) => {
    if (!confirm(`「${s.name}」を削除しますか？`)) return
    setError("")
    const r = await request(`/api/estimates/standards/${s.id}`, "DELETE")
    if (!r.ok) { setError(r.data?.error ?? "削除に失敗しました"); return }
    await load()
  }

  const visible = rows.filter(r => showArchived || !r.is_archived)
  const parentOptions = form ? rows.filter(r => r.id !== form.id && (!r.is_archived || r.id === form.parent_id)) : []

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-4">見積書マスタ（基準）</h1>

      <div className="flex items-center justify-between mb-4 gap-4">
        <p className="text-xs text-gray-400">
          見積書の単価の基準です。親の基準を指定すると、表ごとに親の値を引き継げます。見積に使われている基準は、削除できません（アーカイブしてください）。
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/dashboard/estimates/standards/import" className="px-3 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50">
            FileMakerから取り込み
          </Link>
          <button onClick={openNew} className="flex items-center gap-1 px-3 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800">
            <Plus className="w-4 h-4" /> 追加
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 mb-4 text-sm text-gray-600">
        <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
        アーカイブ済みを表示
      </label>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {form && (
        <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <p className="text-sm font-medium text-gray-700">
            {form.id ? "基準を編集" : form.copy_from_id ? "基準を複製（値・単価も、すべてコピーされます）" : "基準を追加"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">基準名</label>
              <input autoComplete="off" className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">親の基準</label>
              <select className={inputCls} value={form.parent_id} onChange={e => setForm({ ...form, parent_id: e.target.value })}>
                <option value="">なし</option>
                {parentOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">備考</label>
            <input autoComplete="off" className={inputCls} value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={save} className={btnPrimary}>保存</button>
            <button onClick={() => setForm(null)} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">キャンセル</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-gray-400">まだ登録されていません。</p>
      ) : (
        <div className="space-y-2">
          {visible.map(s => (
            <div key={s.id} className={`flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl shadow-sm text-sm ${s.is_archived ? "bg-gray-50" : "bg-white"}`}>
              <div className="w-72">
                <span className="font-medium text-gray-900">{s.name}</span>
                {s.is_archived && <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">アーカイブ</span>}
              </div>
              <span className="w-56 text-gray-500">{s.parent ? `親：${s.parent.name}` : "親なし"}</span>
              <span className="w-16 text-gray-500">子 {s._count.children}</span>
              <span className="w-24 text-gray-500">見積 {s._count.estimates}件</span>
              <span className="flex-1 text-xs text-gray-400 line-clamp-2" title={s.remarks ?? ""}>{s.remarks ?? ""}</span>
              <button onClick={() => openCopy(s)} title="複製" className="p-1 text-gray-400 hover:text-blue-500"><Copy className="w-4 h-4" /></button>
              <button onClick={() => openEdit(s)} title="編集" className="p-1 text-gray-400 hover:text-blue-500"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => toggleArchive(s)} title={s.is_archived ? "アーカイブを戻す" : "アーカイブ"} className="p-1 text-gray-400 hover:text-amber-500">
                {s.is_archived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
              </button>
              <button onClick={() => remove(s)} title="削除" className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}