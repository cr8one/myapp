"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

type User = { id: string; name: string | null }
type DxfRequest = {
  id: string
  uid: string
  id_cad: string | null
  request_date: string
  request_time: string
  desired_date: string | null
  desired_time: string | null
  purpose: string | null
  remarks: string | null
  history: string | null
  worker: string | null
  status: string | null
}

const STATUS_OPTIONS = ["作成中", "依頼済み", "作業中", "完了"]
const STATUS_COLORS: Record<string, string> = {
  "作成中": "bg-gray-100 text-gray-600",
  "依頼済み": "bg-blue-100 text-blue-700",
  "作業中": "bg-yellow-100 text-yellow-700",
  "完了": "bg-green-100 text-green-700",
}

export default function DxfRequestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [record, setRecord] = useState<DxfRequest | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch(`/api/cad/dxf-requests/${id}`).then(r => r.json()).then((data: DxfRequest) => {
      setRecord(data)
      setForm({
        id_cad: data.id_cad ?? "",
        request_date: data.request_date?.slice(0, 10) ?? "",
        request_time: data.request_time ?? "",
        desired_date: data.desired_date?.slice(0, 10) ?? "",
        desired_time: data.desired_time ?? "",
        purpose: data.purpose ?? "",
        remarks: data.remarks ?? "",
        history: data.history ?? "",
        worker: data.worker ?? "",
        status: data.status ?? "",
      })
    })
    fetch("/api/users/list").then(r => r.json()).then(setUsers)
  }, [id])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch(`/api/cad/dxf-requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const data = await res.json()
      setRecord(data)
      setEditing(false)
    } else {
      alert("保存に失敗しました")
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm("この依頼書を削除しますか？")) return
    await fetch(`/api/cad/dxf-requests/${id}`, { method: "DELETE" })
    router.push("/dashboard/cad/dxf-requests")
  }

  const formatDate = (str: string | null) => {
    if (!str) return "—"
    return new Date(str).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })
  }

  const val = (v: string | null) => v || <span className="text-gray-300">—</span>
  const labelCls = "text-sm font-medium text-gray-700 mb-1 block"
  const inputCls = "h-9 text-sm"

  if (!record) return <p className="p-8 text-gray-400 animate-pulse">読み込み中...</p>

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/cad/dxf-requests")}>← 一覧</Button>
          <h1 className="text-2xl font-bold">DXF変換依頼書 No.{record.uid}</h1>
          {record.status && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[record.status] ?? "bg-gray-100 text-gray-600"}`}>
              {record.status}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>キャンセル</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "保存中..." : "保存する"}</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleDelete} className="text-red-500 hover:text-red-600">削除</Button>
              <Button onClick={() => setEditing(true)}>編集</Button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4">依頼情報</h2>
            {editing ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>依頼日</label>
                  <Input type="date" value={form.request_date} onChange={e => set("request_date", e.target.value)} className={inputCls} autoComplete="off" />
                </div>
                <div>
                  <label className={labelCls}>依頼時刻</label>
                  <Input type="time" value={form.request_time} onChange={e => set("request_time", e.target.value)} className={inputCls} autoComplete="off" />
                </div>
                <div>
                  <label className={labelCls}>希望納期日</label>
                  <Input type="date" value={form.desired_date} onChange={e => set("desired_date", e.target.value)} className={inputCls} autoComplete="off" />
                </div>
                <div>
                  <label className={labelCls}>希望納期時刻</label>
                  <Input type="time" value={form.desired_time} onChange={e => set("desired_time", e.target.value)} className={inputCls} autoComplete="off" />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>CAD依頼書No</label>
                  <Input value={form.id_cad} onChange={e => set("id_cad", e.target.value)} className={inputCls} autoComplete="off" placeholder="例: 010001" />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>目的</label>
                  <div className="flex gap-6 mt-1">
                    {["台紙データ作成", "抜き型データとして使用"].map(v => (
                      <label key={v} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="purpose-edit" value={v} checked={form.purpose === v} onChange={() => set("purpose", v)} className="w-4 h-4" />
                        <span className="text-sm">{v}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>備考</label>
                  <textarea value={form.remarks} onChange={e => set("remarks", e.target.value)} className="w-full border rounded px-3 py-2 text-sm resize-none" rows={3} autoComplete="off" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-400">依頼日</p><p className="text-sm text-gray-800">{formatDate(record.request_date)}</p></div>
                <div><p className="text-xs text-gray-400">依頼時刻</p><p className="text-sm text-gray-800">{val(record.request_time)}</p></div>
                <div><p className="text-xs text-gray-400">希望納期日</p><p className="text-sm text-gray-800">{formatDate(record.desired_date)}</p></div>
                <div><p className="text-xs text-gray-400">希望納期時刻</p><p className="text-sm text-gray-800">{val(record.desired_time)}</p></div>
                <div><p className="text-xs text-gray-400">CAD依頼書No</p><p className="text-sm text-gray-800">{val(record.id_cad)}</p></div>
                <div><p className="text-xs text-gray-400">目的</p><p className="text-sm text-gray-800">{val(record.purpose)}</p></div>
                <div className="col-span-2"><p className="text-xs text-gray-400">備考</p><p className="text-sm text-gray-800 whitespace-pre-wrap">{val(record.remarks)}</p></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4">作業情報</h2>
            {editing ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>作業担当</label>
                  <Input
                    value={form.worker}
                    onChange={e => set("worker", e.target.value)}
                    className={inputCls}
                    autoComplete="off"
                    list="worker-list"
                    placeholder="担当者名を入力または選択"
                  />
                  <datalist id="worker-list">
                    {users.map(u => u.name && <option key={u.id} value={u.name} />)}
                  </datalist>
                </div>
                <div>
                  <label className={labelCls}>ステータス</label>
                  <select value={form.status} onChange={e => set("status", e.target.value)} className="w-full h-9 border rounded px-2 text-sm bg-white">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>履歴</label>
                  <textarea value={form.history} onChange={e => set("history", e.target.value)} className="w-full border rounded px-3 py-2 text-sm resize-none" rows={4} autoComplete="off" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-400">作業担当</p><p className="text-sm text-gray-800">{val(record.worker)}</p></div>
                <div><p className="text-xs text-gray-400">ステータス</p><p className="text-sm text-gray-800">{val(record.status)}</p></div>
                <div className="col-span-2"><p className="text-xs text-gray-400">履歴</p><p className="text-sm text-gray-800 whitespace-pre-wrap">{val(record.history)}</p></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
