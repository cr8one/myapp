"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"

type MSoftware = {
  id: number
  name: string
  version: string | null
  vendor: string | null
  licenseType: string | null
  licenseCount: number | null
  note: string | null
}

const emptyForm = {
  name: "",
  version: "",
  vendor: "",
  licenseType: "",
  licenseCount: "",
  note: "",
}

export default function SoftwareMastersPage() {
  const [records, setRecords] = useState<MSoftware[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<MSoftware | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MSoftware | null>(null)

  const fetchRecords = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (keyword) params.set("keyword", keyword)
    const res = await fetch(`/api/terminal/software?${params.toString()}`)
    const data = await res.json()
    setRecords(data)
    setLoading(false)
  }

  useEffect(() => { fetchRecords() }, [])

  const openCreate = () => {
    setEditTarget(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (r: MSoftware) => {
    setEditTarget(r)
    setForm({
      name: r.name,
      version: r.version ?? "",
      vendor: r.vendor ?? "",
      licenseType: r.licenseType ?? "",
      licenseCount: r.licenseCount?.toString() ?? "",
      note: r.note ?? "",
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name) return
    setSaving(true)
    try {
      const body = { ...form }
      if (editTarget) {
        await fetch("/api/terminal/software", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, id: editTarget.id }),
        })
      } else {
        await fetch("/api/terminal/software", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
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
    await fetch("/api/terminal/software", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id }),
    })
    setDeleteTarget(null)
    fetchRecords()
  }

  const trunc = (v: string | null, max = 20) => {
    if (!v) return <span className="text-gray-300">—</span>
    return v.length > max ? v.slice(0, max) + "…" : v
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">ソフトウェアマスタ</h1>
          <p className="text-sm text-gray-500 mt-1">{records.length}件</p>
        </div>
        <Button size="sm" onClick={openCreate} className="flex items-center gap-1">
          <Plus className="w-4 h-4" />新規作成
        </Button>
      </div>

      <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex gap-3 items-end">
          <div className="flex-1 min-w-40">
            <Input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="ソフトウェア名・バージョン・ベンダー・ライセンス種別で検索"
              onKeyDown={e => { if (e.key === "Enter") fetchRecords() }}
              autoComplete="off"
            />
          </div>
          <Button onClick={fetchRecords} className="flex items-center gap-1">
            <Search className="w-4 h-4" />検索
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p>
      ) : records.length === 0 ? (
        <p className="text-center text-gray-500 py-8">データがありません。</p>
      ) : (
        <div className="border rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">ソフトウェア名</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">バージョン</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">ベンダー</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">ライセンス種別</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">ライセンス数</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">備考</th>
                  <th className="px-3 py-2.5 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-blue-50">
                    <td className="px-3 py-2.5 font-medium max-w-[180px]">
                      <div className="truncate">{r.name}</div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 max-w-[100px]">
                      <div className="truncate">{trunc(r.version)}</div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 max-w-[140px]">
                      <div className="truncate">{trunc(r.vendor)}</div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 max-w-[120px]">
                      <div className="truncate">{trunc(r.licenseType)}</div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 text-right pr-6">
                      {r.licenseCount ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 max-w-[200px]">
                      <div className="truncate">{trunc(r.note, 30)}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(r)} className="p-1 text-gray-400 hover:text-blue-600 rounded">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(r)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? "ソフトウェアを編集" : "ソフトウェアを新規作成"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>ソフトウェア名 <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoComplete="off" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>バージョン</Label>
                <Input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} autoComplete="off" placeholder="例：1.0.0" />
              </div>
              <div className="space-y-1">
                <Label>ベンダー</Label>
                <Input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} autoComplete="off" placeholder="例：Microsoft" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>ライセンス種別</Label>
                <Input value={form.licenseType} onChange={e => setForm(f => ({ ...f, licenseType: e.target.value }))} autoComplete="off" placeholder="例：永続・サブスク・フリー" />
              </div>
              <div className="space-y-1">
                <Label>ライセンス数</Label>
                <Input type="number" value={form.licenseCount} onChange={e => setForm(f => ({ ...f, licenseCount: e.target.value }))} autoComplete="off" placeholder="例：10" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>備考</Label>
              <Textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={3} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
              <Button onClick={handleSave} disabled={saving || !form.name}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>削除の確認</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-2">「{deleteTarget?.name}」を削除しますか？この操作は取り消せません。</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>キャンセル</Button>
            <Button variant="destructive" onClick={handleDelete}>削除</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
