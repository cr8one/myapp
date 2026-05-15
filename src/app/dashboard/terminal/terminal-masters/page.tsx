"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2 } from "lucide-react"

type Master = { id: number; category: string; value: string; sortOrder: number; flgDel: boolean }

const CATEGORIES = ["メーカー", "設置場所", "状態", "管理区分"]

export default function TerminalMastersPage() {
  const [records, setRecords] = useState<Master[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Master | null>(null)
  const [form, setForm] = useState({ category: CATEGORIES[0], value: "", sortOrder: "0" })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Master | null>(null)

  const fetchRecords = async () => {
    setLoading(true)
    const res = await fetch("/api/terminal/terminal-masters")
    setRecords(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchRecords() }, [])

  const filtered = records.filter(r => r.category === activeCategory)

  const openCreate = () => {
    setEditTarget(null)
    setForm({ category: activeCategory, value: "", sortOrder: "0" })
    setDialogOpen(true)
  }

  const openEdit = (r: Master) => {
    setEditTarget(r)
    setForm({ category: r.category, value: r.value, sortOrder: r.sortOrder.toString() })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.value) return
    setSaving(true)
    try {
      if (editTarget) {
        await fetch("/api/terminal/terminal-masters", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editTarget.id, ...form }),
        })
      } else {
        await fetch("/api/terminal/terminal-masters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      }
      setDialogOpen(false)
      fetchRecords()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await fetch("/api/terminal/terminal-masters", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id }),
    })
    setDeleteTarget(null)
    fetchRecords()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">端末管理マスタ</h1>
          <p className="text-sm text-gray-500 mt-1">入力補助用マスタデータの管理</p>
        </div>
        <Button size="sm" onClick={openCreate} className="flex items-center gap-1">
          <Plus className="w-4 h-4" />新規追加
        </Button>
      </div>

      <div className="flex gap-1 mb-4 border-b">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeCategory === cat
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {cat}
            <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">
              {records.filter(r => r.category === cat).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-500 py-8">データがありません。</p>
      ) : (
        <div className="border rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm bg-white">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-3 py-2.5 text-gray-600 font-medium w-16">順序</th>
                <th className="text-left px-3 py-2.5 text-gray-600 font-medium">値</th>
                <th className="px-3 py-2.5 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-blue-50">
                  <td className="px-3 py-2 text-gray-400 text-center">{r.sortOrder}</td>
                  <td className="px-3 py-2 font-medium">{r.value}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(r)} className="p-1 text-gray-400 hover:text-blue-600 rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteTarget(r)} className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editTarget ? "編集" : "新規追加"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>カテゴリ</Label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full h-10 border rounded px-3 text-sm bg-white">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>値 <span className="text-red-500">*</span></Label>
              <Input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} autoComplete="off" />
            </div>
            <div className="space-y-1">
              <Label>表示順</Label>
              <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
              <Button onClick={handleSave} disabled={saving || !form.value}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>削除の確認</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-2">「{deleteTarget?.value}」を削除しますか？</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>キャンセル</Button>
            <Button variant="destructive" onClick={handleDelete}>削除</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
