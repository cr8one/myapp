"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { DesiredTimeInput, desiredTimeLabel } from "@/components/desired-time-input"

type User = { id: string; name: string | null }
type LinkedCad = {
  id: string
  uid: string
  hinban: string | null
  hinmoku: string | null
  title: string | null
}
type DxfRequest = {
  id: string
  uid: string
  id_cad: string | null
  request_date: string
  request_time: string
  desired_date: string | null
  desired_time: string | null
  desired_time_kbn: number
  purpose: string | null
  remarks: string | null
  daishi_desired_date: string | null
  daishi_desired_time: string | null
  daishi_desired_time_kbn: number
  daishi_remarks: string | null
  worker: string | null
  status: string | null
  linkedCad?: LinkedCad | null
}
type ChangedFieldEntry = { field: string; label: string; before: string; after: string }
type AuditLogEntry = {
  id: string
  action: string
  diff: string | null
  createdAt: string
  user: { id: string; name: string | null } | null
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
  const [form, setForm] = useState<Record<string, string | number>>({})
  const [history, setHistory] = useState<AuditLogEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/cad/dxf-requests/${id}`).then(r => r.json()).then((data: DxfRequest) => {
      setRecord(data)
      setForm({
        id_cad: data.id_cad ?? "",
        request_date: data.request_date?.slice(0, 10) ?? "",
        request_time: data.request_time ?? "",
        desired_date: data.desired_date?.slice(0, 10) ?? "",
        desired_time: data.desired_time ?? "",
        desired_time_kbn: data.desired_time_kbn ?? 0,
        purpose: data.purpose ?? "",
        remarks: data.remarks ?? "",
        daishi_desired_date: data.daishi_desired_date?.slice(0, 10) ?? "",
        daishi_desired_time: data.daishi_desired_time ?? "",
        daishi_desired_time_kbn: data.daishi_desired_time_kbn ?? 0,
        daishi_remarks: data.daishi_remarks ?? "",
        worker: data.worker ?? "",
        status: data.status ?? "",
      })
    })
    fetch("/api/users/list").then(r => r.json()).then(setUsers)
  }, [id])

  const fetchHistory = async () => {
    setHistoryLoading(true)
    const res = await fetch(`/api/cad/dxf-requests/${id}/history`)
    const data = await res.json()
    setHistory(data)
    setHistoryLoading(false)
  }

  useEffect(() => { fetchHistory() }, [id])

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch(`/api/cad/dxf-requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const data = await res.json()
      const refreshed = await fetch(`/api/cad/dxf-requests/${id}`).then(r => r.json())
      setRecord(refreshed)
      setEditing(false)
      fetchHistory()
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

  const currentPurpose = editing ? (form.purpose as string) : record.purpose
  const showDaishiSection = currentPurpose === "台紙データ作成"

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
            <h2 className="text-base font-semibold text-gray-700 mb-4">DXF変換依頼情報</h2>
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
                  <DesiredTimeInput
                    kbn={Number(form.desired_time_kbn ?? 0)}
                    time={(form.desired_time as string) || ""}
                    onChange={(kbn, time) => { set("desired_time_kbn", kbn); set("desired_time", time) }}
                  />
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
                <div><p className="text-xs text-gray-400">希望納期時刻</p><p className="text-sm text-gray-800">{val(desiredTimeLabel(record.desired_time_kbn, record.desired_time) || null)}</p></div>
                <div><p className="text-xs text-gray-400">CAD依頼書No</p><p className="text-sm text-gray-800">{val(record.id_cad)}</p></div>
                <div><p className="text-xs text-gray-400">目的</p><p className="text-sm text-gray-800">{val(record.purpose)}</p></div>
                <div className="col-span-2"><p className="text-xs text-gray-400">備考</p><p className="text-sm text-gray-800 whitespace-pre-wrap">{val(record.remarks)}</p></div>
              </div>
            )}

            {record.linkedCad && (
              <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                <p className="text-xs text-gray-400 mb-2">紐づくCAD依頼書</p>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => router.push(`/dashboard/cad/requests/${record.linkedCad!.id}`)}
                    className="text-sm font-mono text-blue-600 hover:underline"
                  >
                    No.{record.linkedCad.uid}
                  </button>
                  <span className="text-xs text-gray-400">→ 依頼書を開く</span>
                </div>
                <div className="grid grid-cols-3 gap-3 bg-lime-50 rounded-lg p-3 border border-lime-100">
                  <div><p className="text-xs text-gray-400">品番</p><p className="text-sm text-gray-800">{record.linkedCad.hinban || "—"}</p></div>
                  <div><p className="text-xs text-gray-400">品名</p><p className="text-sm text-gray-800">{record.linkedCad.title || "—"}</p></div>
                  <div><p className="text-xs text-gray-400">パーツ</p><p className="text-sm text-gray-800">{record.linkedCad.hinmoku || "—"}</p></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {showDaishiSection && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-base font-semibold text-gray-700 mb-4">台紙作成依頼情報</h2>
              {editing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>希望納期日</label>
                    <Input type="date" value={form.daishi_desired_date} onChange={e => set("daishi_desired_date", e.target.value)} className={inputCls} autoComplete="off" />
                  </div>
                  <div>
                    <label className={labelCls}>希望納期時刻</label>
                    <DesiredTimeInput
                      kbn={Number(form.daishi_desired_time_kbn ?? 0)}
                      time={(form.daishi_desired_time as string) || ""}
                      onChange={(kbn, time) => { set("daishi_desired_time_kbn", kbn); set("daishi_desired_time", time) }}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>備考（台紙依頼）</label>
                    <textarea value={form.daishi_remarks} onChange={e => set("daishi_remarks", e.target.value)} className="w-full border rounded px-3 py-2 text-sm resize-none" rows={3} autoComplete="off" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-gray-400">希望納期日</p><p className="text-sm text-gray-800">{formatDate(record.daishi_desired_date)}</p></div>
                  <div><p className="text-xs text-gray-400">希望納期時刻</p><p className="text-sm text-gray-800">{val(desiredTimeLabel(record.daishi_desired_time_kbn, record.daishi_desired_time) || null)}</p></div>
                  <div className="col-span-2"><p className="text-xs text-gray-400">備考（台紙依頼）</p><p className="text-sm text-gray-800 whitespace-pre-wrap">{val(record.daishi_remarks)}</p></div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-400">作業担当</p><p className="text-sm text-gray-800">{val(record.worker)}</p></div>
                <div><p className="text-xs text-gray-400">ステータス</p><p className="text-sm text-gray-800">{val(record.status)}</p></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="bg-white border rounded-lg shadow-sm mt-6 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">履歴</h2>
        {historyLoading ? (
          <p className="text-xs text-gray-400">読み込み中...</p>
        ) : history.length === 0 ? (
          <p className="text-xs text-gray-400">履歴がありません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-3 py-2 text-gray-600 font-medium whitespace-nowrap">日時</th>
                  <th className="text-left px-3 py-2 text-gray-600 font-medium whitespace-nowrap">ユーザー</th>
                  <th className="text-left px-3 py-2 text-gray-600 font-medium whitespace-nowrap">分類</th>
                  <th className="text-left px-3 py-2 text-gray-600 font-medium whitespace-nowrap">修正項目</th>
                  <th className="text-left px-3 py-2 text-gray-600 font-medium">修正前</th>
                  <th className="text-left px-3 py-2 text-gray-600 font-medium">修正後</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.flatMap(log => {
                  const diff = log.diff ? JSON.parse(log.diff) as { classification?: string; changedFields?: ChangedFieldEntry[] } : null
                  const classification = diff?.classification ?? (log.action === "CREATE" ? "新規" : "編集")
                  const changedFields = diff?.changedFields ?? []
                  const dt = new Date(log.createdAt)
                  const dtStr = `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()} ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`
                  if (changedFields.length === 0) {
                    return [(
                      <tr key={log.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{dtStr}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-700">{log.user?.name ?? "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-700">{classification}</td>
                        <td className="px-3 py-2 text-gray-300">—</td>
                        <td className="px-3 py-2 text-gray-300">—</td>
                        <td className="px-3 py-2 text-gray-300">—</td>
                      </tr>
                    )]
                  }
                  return changedFields.map((cf, i) => (
                    <tr key={`${log.id}-${i}`}>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">{dtStr}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-700">{log.user?.name ?? "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-700">{classification}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-700">{cf.label}</td>
                      <td className="px-3 py-2 text-gray-600">{cf.before}</td>
                      <td className="px-3 py-2 text-gray-600">{cf.after}</td>
                    </tr>
                  ))
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}