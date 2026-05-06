"use client"
import { useEffect, useState } from "react"

type Part = { id: number; name: string; width: number; height: number; shape: string; note?: string }
const empty = { name: "", width: 0, height: 0, shape: "rect", note: "" }

export default function PartMasterPage() {
  const [items, setItems] = useState<Part[]>([])
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  const fetch_ = async () => {
    const res = await fetch("/api/dlms/parts")
    setItems(await res.json())
  }
  useEffect(() => { fetch_() }, [])

  const handleSubmit = async () => {
    const method = editId ? "PUT" : "POST"
    const url = editId ? `/api/dlms/parts/${editId}` : "/api/dlms/parts"
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setForm(empty); setEditId(null); setShowForm(false); fetch_()
  }

  const handleEdit = (item: Part) => {
    setForm({ name: item.name, width: item.width, height: item.height, shape: item.shape, note: item.note ?? "" })
    setEditId(item.id); setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("削除しますか？")) return
    await fetch(`/api/dlms/parts/${id}`, { method: "DELETE" })
    fetch_()
  }

  const shapeLabel = (s: string) => ({ rect: "矩形", circle: "円", polygon: "多角形" }[s] ?? s)

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">パーツマスタ</h1>
          <p className="text-sm text-gray-400">図面で使用するパーツの外形サイズ登録</p>
        </div>
        <button onClick={() => { setForm(empty); setEditId(null); setShowForm(true) }} className="text-sm px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">+ 新規追加</button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 border rounded-xl bg-gray-50">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">パーツ名</label>
              <input className="w-full border rounded px-3 py-1.5 text-sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="例：スリーブA" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">形状</label>
              <select className="w-full border rounded px-3 py-1.5 text-sm" value={form.shape} onChange={e => setForm(f => ({ ...f, shape: e.target.value }))}>
                <option value="rect">矩形</option>
                <option value="circle">円</option>
                <option value="polygon">多角形</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">幅 (mm)</label>
              <input type="number" className="w-full border rounded px-3 py-1.5 text-sm" value={form.width} onChange={e => setForm(f => ({ ...f, width: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">高さ (mm)</label>
              <input type="number" className="w-full border rounded px-3 py-1.5 text-sm" value={form.height} onChange={e => setForm(f => ({ ...f, height: Number(e.target.value) }))} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">備考</label>
              <input className="w-full border rounded px-3 py-1.5 text-sm" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="text-sm px-4 py-1.5 bg-amber-500 text-white rounded hover:bg-amber-600">{editId ? "更新" : "登録"}</button>
            <button onClick={() => setShowForm(false)} className="text-sm px-4 py-1.5 border rounded hover:bg-gray-100">キャンセル</button>
          </div>
        </div>
      )}

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2">パーツ名</th>
              <th className="text-left px-4 py-2">形状</th>
              <th className="text-right px-4 py-2">幅 (mm)</th>
              <th className="text-right px-4 py-2">高さ (mm)</th>
              <th className="text-left px-4 py-2">備考</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{item.name}</td>
                <td className="px-4 py-2 text-gray-500">{shapeLabel(item.shape)}</td>
                <td className="px-4 py-2 text-right">{item.width}</td>
                <td className="px-4 py-2 text-right">{item.height}</td>
                <td className="px-4 py-2 text-gray-400">{item.note}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => handleEdit(item)} className="text-xs px-2 py-1 border rounded hover:bg-gray-100">編集</button>
                    <button onClick={() => handleDelete(item.id)} className="text-xs px-2 py-1 border rounded text-red-500 hover:bg-red-50">削除</button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">データがありません</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
