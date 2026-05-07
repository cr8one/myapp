"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2 } from "lucide-react"

const CATEGORIES = ["リリース", "機能追加", "バグ修正", "メンテナンス", "その他"]

const CATEGORY_COLORS: Record<string, string> = {
  "リリース": "bg-blue-100 text-blue-700",
  "機能追加": "bg-green-100 text-green-700",
  "バグ修正": "bg-red-100 text-red-700",
  "メンテナンス": "bg-yellow-100 text-yellow-700",
  "その他": "bg-gray-100 text-gray-700",
}

type DevLog = {
  id: string
  date: string
  title: string
  content: string
  category: string
  createdBy: { name: string | null; email: string }
  createdAt: string
}

type FormData = {
  date: string
  title: string
  content: string
  category: string
}

const emptyForm: FormData = { date: "", title: "", content: "", category: "" }

export default function DevLogsPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"

  const [logs, setLogs] = useState<DevLog[]>([])
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<DevLog | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DevLog | null>(null)

  const fetchLogs = async (category?: string) => {
    setLoading(true)
    const url = category && category !== "all" ? `/api/dev-logs?category=${encodeURIComponent(category)}` : "/api/dev-logs"
    const res = await fetch(url)
    const data = await res.json()
    setLogs(data)
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [])

  const handleFilterChange = (value: string | null) => {
    setFilterCategory(value)
    fetchLogs(value ?? undefined)
  }

  const openCreate = () => {
    setEditTarget(null)
    setForm({ ...emptyForm, date: new Date().toISOString().split("T")[0] })
    setDialogOpen(true)
  }

  const openEdit = (log: DevLog) => {
    setEditTarget(log)
    setForm({
      date: log.date.split("T")[0],
      title: log.title,
      content: log.content,
      category: log.category,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.date || !form.title || !form.content || !form.category) return
    setSaving(true)
    if (editTarget) {
      await fetch(`/api/dev-logs/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
    } else {
      await fetch("/api/dev-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
    }
    setSaving(false)
    setDialogOpen(false)
    fetchLogs(filterCategory)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await fetch(`/api/dev-logs/${deleteTarget.id}`, { method: "DELETE" })
    setDeleteTarget(null)
    fetchLogs(filterCategory)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">開発記録</h1>
          <p className="text-sm text-gray-500 mt-1">システムの開発・更新履歴</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新規作成
          </Button>
        )}
      </div>

      {/* フィルター */}
      <div className="mb-4 flex items-center gap-3">
        <Label className="text-sm text-gray-600">カテゴリ絞り込み：</Label>
        <Select value={filterCategory} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {CATEGORIES.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 一覧 */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">読み込み中...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">記録がありません</div>
      ) : (
        <div className="space-y-4">
          {logs.map(log => (
            <div key={log.id} className="bg-white border rounded-lg p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-sm text-gray-500">{new Date(log.date).toLocaleDateString("ja-JP")}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[log.category] ?? "bg-gray-100 text-gray-700"}`}>
                      {log.category}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-gray-800 mb-2">{log.title}</h2>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{log.content}</p>
                  <p className="text-xs text-gray-400 mt-3">記録者：{log.createdBy.name ?? log.createdBy.email}</p>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => openEdit(log)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(log)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 作成・編集ダイアログ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? "開発記録を編集" : "開発記録を作成"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>実施日</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>カテゴリ</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>タイトル</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="例：v1.2.0リリース" />
            </div>
            <div className="space-y-1">
              <Label>内容</Label>
              <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="変更内容の詳細を入力" rows={5} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
              <Button onClick={handleSave} disabled={saving || !form.date || !form.title || !form.content || !form.category}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>削除の確認</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mt-2">「{deleteTarget?.title}」を削除しますか？この操作は取り消せません。</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>キャンセル</Button>
            <Button variant="destructive" onClick={handleDelete}>削除</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
