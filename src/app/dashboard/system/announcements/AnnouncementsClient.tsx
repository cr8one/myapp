"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Megaphone } from "lucide-react"

const CATEGORIES = ["メンテナンス", "リリース", "お知らせ"]
const CATEGORY_COLORS: Record<string, string> = {
  "メンテナンス": "bg-yellow-100 text-yellow-700",
  "リリース": "bg-blue-100 text-blue-700",
  "お知らせ": "bg-green-100 text-green-700",
}
const STATUS_COLORS: Record<string, string> = {
  "表示中": "bg-emerald-100 text-emerald-700",
  "掲載前": "bg-sky-100 text-sky-700",
  "終了": "bg-gray-100 text-gray-500",
}

type Announcement = {
  id: string
  title: string
  content: string
  category: string
  publishedAt: string
  expiresAt: string | null
  createdBy: { name: string | null; email: string }
}
type FormData = { title: string; content: string; category: string; publishedAt: string; expiresAt: string }
const emptyForm: FormData = { title: "", content: "", category: "", publishedAt: "", expiresAt: "" }

const toDate = (iso: string) => iso.split("T")[0]
const fmt = (d: string) => d.replaceAll("-", "/")
const todayJst = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" })

const getStatus = (a: Announcement) => {
  const today = todayJst()
  if (toDate(a.publishedAt) > today) return "掲載前"
  if (a.expiresAt && toDate(a.expiresAt) < today) return "終了"
  return "表示中"
}

export default function AnnouncementsClient() {
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Announcement | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null)

  const fetchItems = async () => {
    setLoading(true)
    const res = await fetch("/api/announcements")
    if (res.ok) setItems(await res.json())
    setLoading(false)
  }
  useEffect(() => { fetchItems() }, [])

  const openCreate = () => {
    setEditTarget(null)
    setError("")
    setForm({ ...emptyForm, publishedAt: todayJst() })
    setDialogOpen(true)
  }
  const openEdit = (a: Announcement) => {
    setEditTarget(a)
    setError("")
    setForm({
      title: a.title,
      content: a.content,
      category: a.category,
      publishedAt: toDate(a.publishedAt),
      expiresAt: a.expiresAt ? toDate(a.expiresAt) : "",
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")
    const res = await fetch(editTarget ? `/api/announcements/${editTarget.id}` : "/api/announcements", {
      method: editTarget ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, expiresAt: form.expiresAt || null }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => null)
      setError(d?.error ?? "保存に失敗しました")
      setSaving(false)
      return
    }
    setSaving(false)
    setDialogOpen(false)
    fetchItems()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await fetch(`/api/announcements/${deleteTarget.id}`, { method: "DELETE" })
    setDeleteTarget(null)
    fetchItems()
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Megaphone className="w-6 h-6 text-amber-600" />インフォメーション管理
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            ダッシュボードのお知らせを管理します。表示開始日から表示終了日までの間だけ、ダッシュボードに表示されます。
          </p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" />新規登録</Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col style={{ width: "80px" }} />
            <col style={{ width: "110px" }} />
            <col style={{ width: "220px" }} />
            <col />
            <col style={{ width: "200px" }} />
            <col style={{ width: "90px" }} />
          </colgroup>
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-3 py-2">状態</th>
              <th className="px-3 py-2">カテゴリ</th>
              <th className="px-3 py-2">タイトル</th>
              <th className="px-3 py-2">内容</th>
              <th className="px-3 py-2">表示期間</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">読み込み中...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">お知らせはありません</td></tr>
            ) : items.map(a => {
              const status = getStatus(a)
              return (
                <tr key={a.id} className="border-t border-gray-100 align-top">
                  <td className="px-3 py-2">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}>{status}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[a.category] ?? "bg-gray-100 text-gray-700"}`}>{a.category}</span>
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-900 line-clamp-2" title={a.title}>{a.title}</td>
                  <td className="px-3 py-2 text-gray-600"><div className="line-clamp-2" title={a.content}>{a.content}</div></td>
                  <td className="px-3 py-2 text-gray-600">
                    {fmt(toDate(a.publishedAt))} ～ {a.expiresAt ? fmt(toDate(a.expiresAt)) : "無期限"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(a)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editTarget ? "お知らせの編集" : "お知らせの新規登録"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>カテゴリ</Label>
              <select
                className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              >
                <option value="">選択してください</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>タイトル</Label>
              <Input autoComplete="off" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label>内容</Label>
              <Textarea rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>表示開始日</Label>
                <Input type="date" autoComplete="off" value={form.publishedAt} onChange={e => setForm(f => ({ ...f, publishedAt: e.target.value }))} />
              </div>
              <div>
                <Label>表示終了日（空欄は無期限）</Label>
                <Input type="date" autoComplete="off" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
              <Button onClick={handleSave} disabled={saving || !form.title || !form.content || !form.category || !form.publishedAt}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>お知らせの削除</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">「{deleteTarget?.title}」を削除します。よろしいですか？</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>キャンセル</Button>
            <Button variant="destructive" onClick={handleDelete}>削除</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
