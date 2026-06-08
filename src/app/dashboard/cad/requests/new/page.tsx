"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

type User = { id: string; name: string | null; department: string | null }

type Department = { id: string; name: string; sort_order: number; groups: { id: string; name: string }[] }
const CONTENT_OPTIONS = ["校正カット", "有型 白ダミー", "新規型 白ダミー"]

const GENRE_OPTIONS = ["CD", "BD", "DVD", "その他"]
const HINMOKU_OPTIONS = ["ハコ", "オビ", "ラベル", "スペーサー", "E式ジャケット", "デジ本体", "その他"]

function today() { return new Date().toISOString().slice(0, 10) }
function nowTime() { return new Date().toTimeString().slice(0, 5) }

export default function CadRequestNewPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    request_date: today(),
    request_time: nowTime(),
    requester_id: "",
    requester_name: "",
    department: "",
    content: "",
    client: "",
    title: "",
    genre: "",
    hinmoku: "",
    hinban: "",
    dieline_no: "",
    develop_y: "",
    develop_x: "",
    paper: "",
    finish_count: "",
    desired_date: "",
    desired_time: "",
    tray: "",
    degi_spec: "",
    tray_count: "",
    pocket: "",
    remarks: "",
  })

  useEffect(() => {
    fetch("/api/users/list").then(r => r.json()).then(setUsers)
    fetch("/api/masters/departments").then(r => r.json()).then(setDepartments)
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      set("requester_id", userId)
      set("requester_name", user.name ?? "")
    } else {
      set("requester_id", "")
    }
  }

  const handleSubmit = async () => {
    if (!form.requester_name) { alert("依頼営業名を入力してください"); return }
    setSaving(true)
    const res = await fetch("/api/cad/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        develop_y: form.develop_y ? parseFloat(form.develop_y) : null,
        develop_x: form.develop_x ? parseFloat(form.develop_x) : null,
        finish_count: form.finish_count ? parseInt(form.finish_count) : null,
        tray_count: form.tray_count ? parseInt(form.tray_count) : null,
        requester_id: form.requester_id || null,
        desired_date: form.desired_date || null,
        desired_time: form.desired_time || null,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      router.push(`/dashboard/cad/requests/${data.id}`)
    } else {
      alert("登録に失敗しました")
      setSaving(false)
    }
  }


  const labelCls = "text-sm font-medium text-gray-700 mb-1 block"
  const inputCls = "h-9 text-sm"

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>← 戻る</Button>
        <h1 className="text-2xl font-bold">CAD依頼書 新規登録</h1>
      </div>

      <div className="space-y-6">
        {/* 依頼情報 */}
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
                <label className={labelCls}>依頼部署</label>
                <Input
                  value={form.department}
                  onChange={e => set("department", e.target.value)}
                  className={inputCls}
                  autoComplete="off"
                  list="dept-list"
                  placeholder="部署名を入力または選択"
                />
                <datalist id="dept-list">
                  {departments.map(d => (
                    <option key={d.id} value={d.name} />
                  ))}
                  {departments.flatMap(d => d.groups.map(g => (
                    <option key={g.id} value={`${d.name} ${g.name}`} />
                  )))}
                </datalist>
              </div>
              <div>
                <label className={labelCls}>依頼営業名 <span className="text-red-500">*</span></label>
                <select
                  value={form.requester_id}
                  onChange={e => handleUserSelect(e.target.value)}
                  className="w-full h-9 border rounded px-2 text-sm bg-white"
                >
                  <option value="">-- 選択してください --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>依頼内容</label>
                <Input
                  value={form.content}
                  onChange={e => set("content", e.target.value)}
                  className={inputCls}
                  autoComplete="off"
                  list="content-list"
                  placeholder="依頼内容を入力または選択"
                />
                <datalist id="content-list">
                  {CONTENT_OPTIONS.map(o => <option key={o} value={o} />)}
                </datalist>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 案件情報 */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4">案件情報</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>クライアント</label>
                <Input value={form.client} onChange={e => set("client", e.target.value)} className={inputCls} autoComplete="off" />
              </div>
              <div>
                <label className={labelCls}>タイトル</label>
                <Input value={form.title} onChange={e => set("title", e.target.value)} className={inputCls} autoComplete="off" />
              </div>
              <div>
                <label className={labelCls}>ジャンル</label>
                <select value={form.genre} onChange={e => set("genre", e.target.value)}
                  className="w-full h-9 border rounded px-2 text-sm bg-white">
                  <option value="">-- 選択 --</option>
                  {GENRE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>品目名</label>
                <select value={form.hinmoku} onChange={e => set("hinmoku", e.target.value)}
                  className="w-full h-9 border rounded px-2 text-sm bg-white">
                  <option value="">-- 選択 --</option>
                  {HINMOKU_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>品番</label>
                <Input value={form.hinban} onChange={e => set("hinban", e.target.value)} className={inputCls} autoComplete="off" />
              </div>
              <div>
                <label className={labelCls}>型台帳番号</label>
                <Input value={form.dieline_no} onChange={e => set("dieline_no", e.target.value)} className={inputCls} autoComplete="off" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 寸法・仕様 */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4">寸法・仕様</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>展開天地 (mm)</label>
                <Input type="number" value={form.develop_y} onChange={e => set("develop_y", e.target.value)} className={inputCls} autoComplete="off" />
              </div>
              <div>
                <label className={labelCls}>展開左右 (mm)</label>
                <Input type="number" value={form.develop_x} onChange={e => set("develop_x", e.target.value)} className={inputCls} autoComplete="off" />
              </div>
              <div>
                <label className={labelCls}>用紙</label>
                <Input value={form.paper} onChange={e => set("paper", e.target.value)} className={inputCls} autoComplete="off" />
              </div>
              <div>
                <label className={labelCls}>仕上げ個数</label>
                <Input type="number" value={form.finish_count} onChange={e => set("finish_count", e.target.value)} className={inputCls} autoComplete="off" />
              </div>
              <div>
                <label className={labelCls}>希望納期日</label>
                <Input type="date" value={form.desired_date} onChange={e => set("desired_date", e.target.value)} className={inputCls} autoComplete="off" />
              </div>
              <div>
                <label className={labelCls}>希望納期時刻</label>
                <Input type="time" value={form.desired_time} onChange={e => set("desired_time", e.target.value)} className={inputCls} autoComplete="off" />
              </div>
              <div>
                <label className={labelCls}>使用トレイ</label>
                <Input value={form.tray} onChange={e => set("tray", e.target.value)} className={inputCls} autoComplete="off" />
              </div>
              <div>
                <label className={labelCls}>デジ仕様</label>
                <Input value={form.degi_spec} onChange={e => set("degi_spec", e.target.value)} className={inputCls} autoComplete="off" />
              </div>
              <div>
                <label className={labelCls}>トレイ枚数</label>
                <Input type="number" value={form.tray_count} onChange={e => set("tray_count", e.target.value)} className={inputCls} autoComplete="off" />
              </div>
              <div>
                <label className={labelCls}>ポケット</label>
                <Input value={form.pocket} onChange={e => set("pocket", e.target.value)} className={inputCls} autoComplete="off" />
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

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.back()}>キャンセル</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "登録中..." : "登録する"}
          </Button>
        </div>
      </div>
    </div>
  )
}
