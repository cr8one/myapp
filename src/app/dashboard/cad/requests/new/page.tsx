"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type User = { id: string; name: string | null; position: string | null; departmentLabels: string[] }
type Department = { id: string; name: string; sort_order: number; groups: { id: string; name: string }[] }
type CadClient = { id: string; name: string; short_name: string | null; sort_order: number }
type CadContent = { id: string; name: string; sort_order: number }
type CadOption = { id: string; category: string; value: string; sort_order: number }

const GENRE_OPTIONS = ["CD", "BD", "DVD", "その他"]

function today() { return new Date().toISOString().slice(0, 10) }
function nowTime() { return new Date().toTimeString().slice(0, 5) }

export default function CadRequestNewPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [clients, setClients] = useState<CadClient[]>([])
  const [contents, setContents] = useState<CadContent[]>([])
  const [options, setOptions] = useState<CadOption[]>([])
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
    flg_tray_spec: false,
    tray: "",
    degi_spec: "",
    tray_count: "",
    pocket: "",
    remarks: "",
  })

  useEffect(() => {
    fetch("/api/users/list").then(r => r.json()).then(setUsers)
    fetch("/api/masters/departments").then(r => r.json()).then(setDepartments)
    fetch("/api/cad/masters/clients").then(r => r.json()).then(setClients)
    fetch("/api/cad/masters/contents").then(r => r.json()).then(setContents)
    fetch("/api/cad/masters/options").then(r => r.json()).then(setOptions)
  }, [])

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  const optionsFor = (category: string) => options.filter(o => o.category === category)

  const filteredUsers = form.department
    ? users.filter(u => u.departmentLabels.includes(form.department))
    : users

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      set("requester_id", userId)
      set("requester_name", user.name ?? "")
    } else {
      set("requester_id", "")
    }
  }

  const handleDepartmentChange = (v: string) => {
    set("department", v)
    // 絞り込みの結果、現在選択中の営業担当が対象外になったら選択解除
    const stillValid = users.some(u => u.id === form.requester_id && (!v || u.departmentLabels.includes(v)))
    if (!stillValid) {
      set("requester_id", "")
      set("requester_name", "")
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
        flg_tray_spec: form.flg_tray_spec ? 1 : 0,
        develop_y: form.develop_y ? parseFloat(form.develop_y) : null,
        develop_x: form.develop_x ? parseFloat(form.develop_x) : null,
        finish_count: form.finish_count ? parseInt(form.finish_count) : null,
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

  const labelCls = "text-xs font-medium text-gray-500 w-24 shrink-0 pt-2"
  const inputCls = "h-8 text-sm flex-1"
  const rowCls = "flex items-center gap-3"

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>← 戻る</Button>
          <h1 className="text-2xl font-bold">CAD作業依頼書 新規登録</h1>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold">作成中</span>
      </div>

      <div className="bg-white border rounded-lg shadow-sm">
        {/* ヘッダー：依頼日時 */}
        <div className="border-b px-6 py-4 flex items-center gap-6">
          <div className={rowCls}>
            <label className={labelCls + " pt-0"}>依頼日 <span className="text-red-500">*</span></label>
            <Input type="date" value={form.request_date} onChange={e => set("request_date", e.target.value)} className="h-8 text-sm w-40" autoComplete="off" />
          </div>
          <div className={rowCls}>
            <label className={labelCls + " pt-0"}>依頼時刻</label>
            <Input type="time" value={form.request_time} onChange={e => set("request_time", e.target.value)} className="h-8 text-sm w-28" autoComplete="off" />
          </div>
        </div>

        {/* 本体：2カラム */}
        <div className="grid grid-cols-2 divide-x">
          {/* 左カラム */}
          <div className="p-6 space-y-3">
            <div className={rowCls}>
              <label className={labelCls}>依頼部署</label>
              <div className="flex-1">
                <Input
                  value={form.department}
                  onChange={e => handleDepartmentChange(e.target.value)}
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
            </div>
            <div className={rowCls}>
              <label className={labelCls}>依頼営業名 <span className="text-red-500">*</span></label>
              <select
                value={form.requester_id}
                onChange={e => handleUserSelect(e.target.value)}
                className="flex-1 h-8 border rounded px-2 text-sm bg-white"
              >
                <option value="">-- 選択してください --</option>
                {filteredUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className={rowCls}>
              <label className={labelCls}>クライアント</label>
              <select value={form.client} onChange={e => set("client", e.target.value)}
                className="flex-1 h-8 border rounded px-2 text-sm bg-white">
                <option value="">-- 選択 --</option>
                {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className={rowCls}>
              <label className={labelCls}>タイトル</label>
              <Input value={form.title} onChange={e => set("title", e.target.value)} className={inputCls} autoComplete="off" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>依頼内容</label>
              <div className="flex-1">
                <Input
                  value={form.content}
                  onChange={e => set("content", e.target.value)}
                  className={inputCls}
                  autoComplete="off"
                  list="content-list"
                  placeholder="依頼内容を入力または選択"
                />
                <datalist id="content-list">
                  {contents.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>
            </div>
            <div className={rowCls}>
              <label className={labelCls}>ジャンル</label>
              <select value={form.genre} onChange={e => set("genre", e.target.value)}
                className="flex-1 h-8 border rounded px-2 text-sm bg-white">
                <option value="">-- 選択 --</option>
                {GENRE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className={rowCls}>
              <label className={labelCls}>品目名</label>
              <div className="flex-1">
                <Input
                  value={form.hinmoku}
                  onChange={e => set("hinmoku", e.target.value)}
                  className={inputCls}
                  autoComplete="off"
                  list="hinmoku-list"
                  placeholder="品目名を入力または選択"
                />
                <datalist id="hinmoku-list">
                  {optionsFor("hinmoku").map(o => <option key={o.id} value={o.value} />)}
                </datalist>
              </div>
            </div>
            <div className={rowCls}>
              <label className={labelCls}>品番</label>
              <Input value={form.hinban} onChange={e => set("hinban", e.target.value)} className={inputCls} autoComplete="off" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>型台帳番号</label>
              <Input value={form.dieline_no} onChange={e => set("dieline_no", e.target.value)} className={inputCls} autoComplete="off" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>展開寸法</label>
              <div className="flex-1 flex items-center gap-2">
                <Input type="number" value={form.develop_y} onChange={e => set("develop_y", e.target.value)} className="h-8 text-sm w-20" autoComplete="off" placeholder="天地" />
                <span className="text-gray-400 text-sm">×</span>
                <Input type="number" value={form.develop_x} onChange={e => set("develop_x", e.target.value)} className="h-8 text-sm w-20" autoComplete="off" placeholder="左右" />
                <span className="text-xs text-gray-400">mm</span>
              </div>
            </div>
            <div className={rowCls}>
              <label className={labelCls}>用紙</label>
              <Input value={form.paper} onChange={e => set("paper", e.target.value)} className={inputCls} autoComplete="off" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>仕上個数</label>
              <Input type="number" value={form.finish_count} onChange={e => set("finish_count", e.target.value)} className={inputCls} autoComplete="off" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>希望納期</label>
              <div className="flex-1 flex items-center gap-2">
                <Input type="date" value={form.desired_date} onChange={e => set("desired_date", e.target.value)} className="h-8 text-sm w-36" autoComplete="off" />
                <Input type="time" value={form.desired_time} onChange={e => set("desired_time", e.target.value)} className="h-8 text-sm w-24" autoComplete="off" />
              </div>
            </div>
          </div>

          {/* 右カラム */}
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-500">トレイ仕様詳細</h3>
                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.flg_tray_spec}
                    onChange={e => set("flg_tray_spec", e.target.checked)}
                    className="w-3.5 h-3.5"
                  />
                  トレイ仕様あり
                </label>
              </div>
              {form.flg_tray_spec && (
                <div className="space-y-3">
                  <div className={rowCls}>
                    <label className={labelCls}>使用トレイ</label>
                    <div className="flex-1">
                      <Input value={form.tray} onChange={e => set("tray", e.target.value)} className={inputCls} autoComplete="off" list="tray-list" />
                      <datalist id="tray-list">
                        {optionsFor("tray").map(o => <option key={o.id} value={o.value} />)}
                      </datalist>
                    </div>
                  </div>
                  <div className={rowCls}>
                    <label className={labelCls}>デジ仕様</label>
                    <div className="flex-1">
                      <Input value={form.degi_spec} onChange={e => set("degi_spec", e.target.value)} className={inputCls} autoComplete="off" list="degi-spec-list" />
                      <datalist id="degi-spec-list">
                        {optionsFor("degi_spec").map(o => <option key={o.id} value={o.value} />)}
                      </datalist>
                    </div>
                  </div>
                  <div className={rowCls}>
                    <label className={labelCls}>トレイ枚数</label>
                    <div className="flex-1">
                      <Input value={form.tray_count} onChange={e => set("tray_count", e.target.value)} className={inputCls} autoComplete="off" list="tray-count-list" />
                      <datalist id="tray-count-list">
                        {optionsFor("tray_count").map(o => <option key={o.id} value={o.value} />)}
                      </datalist>
                    </div>
                  </div>
                  <div className={rowCls}>
                    <label className={labelCls}>ポケット</label>
                    <div className="flex-1">
                      <Input value={form.pocket} onChange={e => set("pocket", e.target.value)} className={inputCls} autoComplete="off" list="pocket-list" />
                      <datalist id="pocket-list">
                        {optionsFor("pocket").map(o => <option key={o.id} value={o.value} />)}
                      </datalist>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 mb-3">詳細記入欄</h3>
              <textarea
                value={form.remarks}
                onChange={e => set("remarks", e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm resize-none"
                rows={form.flg_tray_spec ? 8 : 16}
                autoComplete="off"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={() => router.back()}>キャンセル</Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? "登録中..." : "登録する"}
        </Button>
      </div>
    </div>
  )
}
