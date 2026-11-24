"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Pencil, Trash2 } from "lucide-react"

type Category = {
  id: string
  name: string
  code: string
  next_serial: number
  default_standard_id: string | null
  customer_name: string | null
  remarks: string | null
  is_active: boolean
  default_standard: { id: string; name: string } | null
  _count: { estimates: number }
}
type Standard = { id: string; name: string; is_archived: boolean }
type Form = {
  id: string | null
  name: string
  code: string
  next_serial: string
  default_standard_id: string
  customer_name: string
  remarks: string
  is_active: boolean
}

async function request(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
  const data = await res.json().catch(() => null)
  return { ok: res.ok, data }
}

const btnPrimary = "px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800"
const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
const empty: Form = { id: null, name: "", code: "", next_serial: "1", default_standard_id: "", customer_name: "", remarks: "", is_active: true }

export default function EstimateCategoriesPage() {
  const [rows, setRows] = useState<Category[]>([])
  const [standards, setStandards] = useState<Standard[]>([])
  const [form, setForm] = useState<Form | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [c, s] = await Promise.all([request("/api/estimates/categories", "GET"), request("/api/estimates/standards", "GET")])
    setRows(c.ok && Array.isArray(c.data) ? c.data : [])
    setStandards(s.ok && Array.isArray(s.data) ? s.data : [])
    if (!c.ok) setError(c.data?.error ?? "読み込みに失敗しました")
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const openEdit = (c: Category) =>
    setForm({
      id: c.id,
      name: c.name,
      code: c.code,
      next_serial: String(c.next_serial),
      default_standard_id: c.default_standard_id ?? "",
      customer_name: c.customer_name ?? "",
      remarks: c.remarks ?? "",
      is_active: c.is_active,
    })

  const save = async () => {
    if (!form) return
    setError("")
    const body = {
      name: form.name,
      code: form.code,
      next_serial: Number(form.next_serial),
      default_standard_id: form.default_standard_id || null,
      customer_name: form.customer_name,
      remarks: form.remarks,
      is_active: form.is_active,
    }
    const r = form.id ? await request(`/api/estimates/categories/${form.id}`, "PUT", body) : await request("/api/estimates/categories", "POST", body)
    if (!r.ok) { setError(r.data?.error ?? "保存に失敗しました"); return }
    setForm(null)
    await load()
  }

  const remove = async (c: Category) => {
    if (!confirm(`「${c.name}」を削除しますか？`)) return
    setError("")
    const r = await request(`/api/estimates/categories/${c.id}`, "DELETE")
    if (!r.ok) { setError(r.data?.error ?? "削除に失敗しました"); return }
    await load()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-gray-900">見積区分（客先・部署）</h1>
        <Link href="/dashboard/estimates" className="text-sm text-gray-500 hover:text-gray-700">← 見積一覧に戻る</Link>
      </div>
      <div className="flex items-center justify-between mb-4 gap-4">
        <p className="text-xs text-gray-400">
          見積書の番号は、区分ごとの「接頭辞」と「次の番号」で振られます（例：10-05992）。FileMakerから続けて使う場合は、現在の最終番号の次の番号を設定してください。
          既定の基準と宛名は、新しい見積書を作るときの初期値です。
        </p>
        <button onClick={() => setForm({ ...empty })} className="flex items-center gap-1 px-3 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 shrink-0">
          <Plus className="w-4 h-4" /> 追加
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {form && (
        <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <p className="text-sm font-medium text-gray-700">{form.id ? "区分を編集" : "区分を追加"}</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">区分名（例：PC 音楽）</label>
              <input autoComplete="off" className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">番号の接頭辞（例：10）</label>
              <input autoComplete="off" className={inputCls} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">次の番号（例：5992）</label>
              <input autoComplete="off" inputMode="numeric" className={inputCls} value={form.next_serial} onChange={e => setForm({ ...form, next_serial: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">既定の基準</label>
              <select className={inputCls} value={form.default_standard_id} onChange={e => setForm({ ...form, default_standard_id: e.target.value })}>
                <option value="">未選択</option>
                {standards.filter(s => !s.is_archived || s.id === form.default_standard_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">宛名の既定（例：㈱ポニーキャニオン）</label>
              <input autoComplete="off" className={inputCls} value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">備考</label>
              <input autoComplete="off" className={inputCls} value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
            </div>
          </div>
          {form.id && (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              有効（無効にすると、新しい見積書の区分に選べなくなります）
            </label>
          )}
          <div className="flex gap-2">
            <button onClick={save} className={btnPrimary}>保存</button>
            <button onClick={() => setForm(null)} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">キャンセル</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-400">まだ登録されていません。見積書を作る前に、区分を1つ以上作ってください。</p>
      ) : (
        <div className="space-y-2">
          {rows.map(c => (
            <div key={c.id} className={`flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl shadow-sm text-sm ${c.is_active ? "bg-white" : "bg-gray-50"}`}>
              <div className="w-56">
                <span className="font-medium text-gray-900">{c.name}</span>
                {!c.is_active && <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">無効</span>}
              </div>
              <span className="w-40 text-gray-600 tabular-nums">{c.code}-{String(c.next_serial).padStart(5, "0")}</span>
              <span className="w-56 text-gray-500">{c.default_standard ? `基準：${c.default_standard.name}` : "基準：未設定"}</span>
              <span className="w-24 text-gray-500">見積 {c._count.estimates}件</span>
              <span className="flex-1 text-xs text-gray-400 truncate">{c.customer_name ?? ""}</span>
              <button onClick={() => openEdit(c)} title="編集" className="p-1 text-gray-400 hover:text-blue-500"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(c)} title="削除" className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}