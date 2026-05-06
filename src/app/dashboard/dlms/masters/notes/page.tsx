"use client"
import { useEffect, useState } from "react"

type Note = { id: number; name: string; content: string; fontSize: number; color: string; fontWeight: string }
const empty = { name: "", content: "", fontSize: 12, color: "#1a1a1a", fontWeight: "normal" }
const COLORS = ["#1a1a1a", "#e24b4a", "#378add", "#639922", "#ba7517", "#888780"]

export default function NoteMasterPage() {
  const [items, setItems] = useState<Note[]>([])
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  const fetch_ = async () => {
    const res = await fetch("/api/dlms/notes")
    setItems(await res.json())
  }
  useEffect(() => { fetch_() }, [])

  const handleSubmit = async () => {
    const method = editId ? "PUT" : "POST"
    const url = editId ? `/api/dlms/notes/${editId}` : "/api/dlms/notes"
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setForm(empty); setEditId(null); setShowForm(false); fetch_()
  }

  const handleEdit = (item: Note) => {
    setForm({ name: item.name, content: item.content, fontSize: item.fontSize, color: item.color, fontWeight: item.fontWeight })
    setEditId(item.id); setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("削除しますか？")) return
    await fetch(`/api/dlms/notes/${id}`, { method: "DELETE" })
    fetch_()
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">注記マスタ</h1>
          <p className="text-sm text-gray-400">図面で使用する定型テキストの登録</p>
        </div>
        <button onClick={() => { setForm(empty); setEditId(null); setShowForm(true) }} className="text-sm px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">+ 新規追加</button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 border rounded-xl bg-gray-50">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">注記名</label>
              <input className="w-full border rounded px-3 py-1.5 text-sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="例：折り線注意書き" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">テキスト内容</label>
              <textarea rows={3} className="w-full border rounded px-3 py-1.5 text-sm" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="例：この面が表になります" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">フォントサイズ (px)</label>
              <input type="number" min="8" max="72" className="w-full border rounded px-3 py-1.5 text-sm" value={form.fontSize} onChange={e => setForm(f => ({ ...f, fontSize: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">フォントウェイト</label>
              <select className="w-full border rounded px-3 py-1.5 text-sm" value={form.fontWeight} onChange={e => setForm(f => ({ ...f, fontWeight: e.target.value }))}>
                <option value="normal">標準</option>
                <option value="bold">太字</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">テキストカラー</label>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      style={{ background: c, width: 24, height: 24, borderRadius: "50%", border: form.color === c ? "3px solid #378add" : "2px solid transparent" }} />
                  ))}
                </div>
                <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border" />
                <span className="text-xs text-gray-400">{form.color}</span>
              </div>
            </div>
            {/* プレビュー */}
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">プレビュー</label>
              <div className="border rounded px-3 py-2 bg-white min-h-10">
                <span style={{ fontSize: form.fontSize, color: form.color, fontWeight: form.fontWeight, whiteSpace: "pre-wrap" }}>
                  {form.content || "テキストを入力すると表示されます"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="text-sm px-4 py-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600">{editId ? "更新" : "登録"}</button>
            <button onClick={() => setShowForm(false)} className="text-sm px-4 py-1.5 border rounded hover:bg-gray-100">キャンセル</button>
          </div>
        </div>
      )}

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2">注記名</th>
              <th className="text-left px-4 py-2">プレビュー</th>
              <th className="text-right px-4 py-2">サイズ</th>
              <th className="text-left px-4 py-2">ウェイト</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{item.name}</td>
                <td className="px-4 py-2">
                  <span style={{ fontSize: Math.min(item.fontSize, 14), color: item.color, fontWeight: item.fontWeight, whiteSpace: "pre-wrap" }}>
                    {item.content.length > 30 ? item.content.slice(0, 30) + "…" : item.content}
                  </span>
                </td>
                <td className="px-4 py-2 text-right text-gray-500">{item.fontSize}px</td>
                <td className="px-4 py-2 text-gray-500">{item.fontWeight === "bold" ? "太字" : "標準"}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => handleEdit(item)} className="text-xs px-2 py-1 border rounded hover:bg-gray-100">編集</button>
                    <button onClick={() => handleDelete(item.id)} className="text-xs px-2 py-1 border rounded text-red-500 hover:bg-red-50">削除</button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">データがありません</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
