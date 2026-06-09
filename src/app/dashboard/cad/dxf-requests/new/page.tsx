"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

type User = { id: string; name: string | null }
const STATUS_OPTIONS = ["作成中", "依頼済み", "作業中", "完了"]
function today() { return new Date().toISOString().slice(0, 10) }
function nowTime() { return new Date().toTimeString().slice(0, 5) }

export default function DxfRequestNewPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    id_cad: "",
    request_date: today(),
    request_time: nowTime(),
    desired_date: "",
    desired_time: "",
    purpose: "",
    remarks: "",
    history: "",
    worker: "",
    status: "作成中",
  })

  useEffect(() => {
    fetch("/api/users/list").then(r => r.json()).then(setUsers)
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setSaving(true)
    const res = await fetch("/api/cad/dxf-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const data = await res.json()
      router.push(`/dashboard/cad/dxf-requests/${data.id}`)
    } else {
      alert("登録に失敗しました")
      setSaving(false)
    }
  }

  const labelCls = "text-sm font-medium text-gray-700 mb-1 block"
  const inputCls = "h-9 text-sm"

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>← 戻る</Button>
        <h1 className="text-2xl font-bold">DXF変換依頼書 新規作成</h1>
      </div>
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4">依頼情報</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>依頼日 <span className="text-red-500">*</span></label>
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
                <label className={labelCls}>目的 <span className="text-red-500">*</span></label>
                <div className="flex gap-6 mt-1">
                  {["台紙データ作成", "抜き型データとして使用"].map(v => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="purpose"
                        value={v}
                        checked={form.purpose === v}
                        onChange={() => set("purpose", v)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>備考</label>
                <textarea
                  value={form.remarks}
                  onChange={e => set("remarks", e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm resize-none"
                  rows={3}
                  autoComplete="off"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4">作業情報</h2>
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
                <select
                  value={form.status}
                  onChange={e => set("status", e.target.value)}
                  className="w-full h-9 border rounded px-2 text-sm bg-white"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>履歴</label>
                <textarea
                  value={form.history}
                  onChange={e => set("history", e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm resize-none"
                  rows={4}
                  autoComplete="off"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.back()}>キャンセル</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.purpose}>
            {saving ? "登録中..." : "登録する"}
          </Button>
        </div>
      </div>
    </div>
  )
}
