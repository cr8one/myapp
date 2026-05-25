"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Pencil, Trash2, X } from "lucide-react"

type Master = { id: number; name: string; sort_order: number; is_active: boolean }

function MasterTab({ type, label }: { type: "eigyo" | "seihan"; label: string }) {
  const [records, setRecords] = useState<Master[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Master | null>(null)
  const [form, setForm] = useState({ name: "", sort_order: "0", is_active: true })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Master | null>(null)

  const fetchRecords = async () => {
    setLoading(true)
    const res = await fetch(`/api/dpp/masters?type=${type}`)
    setRecords(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchRecords() }, [type])

  const openCreate = () => {
    setEditTarget(null)
    setForm({ name: "", sort_order: "0", is_active: true })
    setModalOpen(true)
  }

  const openEdit = (r: Master) => {
    setEditTarget(r)
    setForm({ name: r.name, sort_order: r.sort_order.toString(), is_active: r.is_active })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name) return
    setSaving(true)
    try {
      if (editTarget) {
        await fetch("/api/dpp/masters", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, id: editTarget.id, name: form.name, sort_order: parseInt(form.sort_order) || 0, is_active: form.is_active }),
        })
      } else {
        await fetch("/api/dpp/masters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, name: form.name, sort_order: parseInt(form.sort_order) || 0 }),
        })
      }
      setModalOpen(false)
      fetchRecords()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await fetch("/api/dpp/masters", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id: deleteTarget.id }),
    })
    setDeleteTarget(null)
    fetchRecords()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{records.length}件</p>
        <Button size="sm" onClick={openCreate} className="flex items-center gap-1">
          <Plus className="w-4 h-4" />追加
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p>
      ) : records.length === 0 ? (
        <p className="text-center text-gray-500 py-8">データがありません。</p>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 text-gray-600 font-medium">名前</th>
                <th className="text-left px-4 py-2.5 text-gray-600 font-medium">並び順</th>
                <th className="text-left px-4 py-2.5 text-gray-600 font-medium">有効</th>
                <th className="px-4 py-2.5 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-800">
                    {r.name}
                    {!r.is_active && <span className="ml-2 text-xs text-gray-400">（無効）</span>}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{r.sort_order}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {r.is_active ? "有効" : "無効"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
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

      {/* 追加・編集モーダル */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">{editTarget ? `${label}を編集` : `${label}を追加`}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">名前 <span className="text-red-500">*</span></Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoComplete="off" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">並び順</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} autoComplete="off" className="h-8 text-sm" />
              </div>
              {editTarget && (
                <div className="space-y-1">
                  <Label className="text-xs">有効/無効</Label>
                  <select value={form.is_active ? "1" : "0"} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === "1" }))}
                    className="w-full h-8 border rounded px-2 text-sm bg-white">
                    <option value="1">有効</option>
                    <option value="0">無効</option>
                  </select>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>キャンセル</Button>
              <Button onClick={handleSave} disabled={saving || !form.name}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">削除の確認</h2>
            <p className="text-sm text-gray-600">「{deleteTarget.name}」を削除しますか？</p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>キャンセル</Button>
              <Button variant="destructive" onClick={handleDelete}>削除</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DppMastersPage() {
  const [activeTab, setActiveTab] = useState<"eigyo" | "seihan">("eigyo")

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">DPPマスタ管理</h1>
      </div>
      <div className="flex border-b mb-6">
        {([["eigyo", "営業担当"], ["seihan", "製版担当"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-6 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === key ? "border-pink-500 text-pink-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {label}
          </button>
        ))}
      </div>
      <MasterTab key={activeTab} type={activeTab} label={activeTab === "eigyo" ? "営業担当" : "製版担当"} />
    </div>
  )
}
