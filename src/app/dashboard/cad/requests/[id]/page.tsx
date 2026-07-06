"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type User = { id: string; name: string | null; department: string | null }
type Department = { id: string; name: string; sort_order: number; groups: { id: string; name: string }[] }
const CONTENT_OPTIONS = ["校正カット", "有型 白ダミー", "新規型 白ダミー"]
const GENRE_OPTIONS = ["CD", "BD", "DVD", "その他"]
const HINMOKU_OPTIONS = ["ハコ", "オビ", "ラベル", "スペーサー", "E式ジャケット", "デジ本体", "その他"]

const STATUS_STYLE: Record<string, string> = {
  "作成中": "bg-gray-100 text-gray-600",
  "依頼済": "bg-blue-100 text-blue-700",
  "着手": "bg-yellow-100 text-yellow-700",
  "完了": "bg-green-100 text-green-700",
  "保留": "bg-red-100 text-red-700",
}

type CadRequest = {
  id: string
  uid: string
  request_date: string
  request_time: string
  requester_id: string | null
  requester_name: string
  department: string | null
  content: string | null
  client: string | null
  title: string | null
  genre: string | null
  hinmoku: string | null
  hinban: string | null
  status: string
  dieline_no: string | null
  develop_y: number | null
  develop_x: number | null
  paper: string | null
  finish_count: number | null
  desired_date: string | null
  desired_time: string | null
  tray: string | null
  degi_spec: string | null
  tray_count: number | null
  pocket: string | null
  remarks: string | null
  requester: { id: string; name: string | null; department: string | null } | null
}

export default function CadRequestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [record, setRecord] = useState<CadRequest | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch(`/api/cad/requests/${id}`).then(r => r.json()).then((data: CadRequest) => {
      setRecord(data)
      setForm({
        request_date: data.request_date?.slice(0, 10) ?? "",
        request_time: data.request_time ?? "",
        requester_id: data.requester_id ?? "",
        requester_name: data.requester_name ?? "",
        department: data.department ?? "",
        content: data.content ?? "",
        client: data.client ?? "",
        title: data.title ?? "",
        genre: data.genre ?? "",
        hinmoku: data.hinmoku ?? "",
        hinban: data.hinban ?? "",
        dieline_no: data.dieline_no ?? "",
        develop_y: data.develop_y?.toString() ?? "",
        develop_x: data.develop_x?.toString() ?? "",
        paper: data.paper ?? "",
        finish_count: data.finish_count?.toString() ?? "",
        desired_date: data.desired_date?.slice(0, 10) ?? "",
        desired_time: data.desired_time ?? "",
        tray: data.tray ?? "",
        degi_spec: data.degi_spec ?? "",
        tray_count: data.tray_count?.toString() ?? "",
        pocket: data.pocket ?? "",
        remarks: data.remarks ?? "",
      })
    })
    fetch("/api/users/list").then(r => r.json()).then(setUsers)
    fetch("/api/masters/departments").then(r => r.json()).then(setDepartments)
  }, [id])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      set("requester_id", userId)
      set("requester_name", user.name ?? "")
      set("department", user.department ?? "")
    } else {
      set("requester_id", "")
    }
  }

  const handleSave = async () => {
    if (!form.requester_name) { alert("依頼営業名を入力してください"); return }
    setSaving(true)
    const res = await fetch(`/api/cad/requests/${id}`, {
      method: "PUT",
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
      setRecord(data)
      setEditing(false)
    } else {
      alert("保存に失敗しました")
    }
    setSaving(false)
  }

  const formatDate = (str: string | null) => {
    if (!str) return "—"
    return new Date(str).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })
  }

  const labelCls = "text-xs font-medium text-gray-500 w-24 shrink-0 pt-2"
  const inputCls = "h-8 text-sm flex-1"
  const rowCls = "flex items-center gap-3"
  const valLabelCls = "text-xs text-gray-400 w-24 shrink-0"
  const valCls = "text-sm text-gray-800 flex-1"

  if (!record) return <p className="p-8 text-gray-400 animate-pulse">読み込み中...</p>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/cad/requests")}>← 一覧</Button>
          <h1 className="text-2xl font-bold">CAD作業依頼書 No.{record.uid}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${STATUS_STYLE[record.status] ?? "bg-gray-100 text-gray-600"}`}>
            {record.status}
          </span>
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>キャンセル</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "保存中..." : "保存する"}</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => window.open(`/api/cad/requests/pdf?id=${record.id}`, "_blank")}>PDF出力</Button>
              <Button onClick={() => setEditing(true)}>編集</Button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white border rounded-lg shadow-sm">
        {/* ヘッダー：依頼日時 */}
        <div className="border-b px-6 py-4 flex items-center gap-6">
          {editing ? (
            <>
              <div className={rowCls}>
                <label className={labelCls + " pt-0"}>依頼日</label>
                <Input type="date" value={form.request_date} onChange={e => set("request_date", e.target.value)} className="h-8 text-sm w-40" autoComplete="off" />
              </div>
              <div className={rowCls}>
                <label className={labelCls + " pt-0"}>依頼時刻</label>
                <Input type="time" value={form.request_time} onChange={e => set("request_time", e.target.value)} className="h-8 text-sm w-28" autoComplete="off" />
              </div>
            </>
          ) : (
            <>
              <div className={rowCls}>
                <span className={valLabelCls}>依頼日</span>
                <span className={valCls}>{formatDate(record.request_date)}</span>
              </div>
              <div className={rowCls}>
                <span className={valLabelCls}>依頼時刻</span>
                <span className={valCls}>{record.request_time || "—"}</span>
              </div>
            </>
          )}
        </div>

        {/* 本体：2カラム */}
        <div className="grid grid-cols-2 divide-x">
          {/* 左カラム */}
          <div className="p-6 space-y-3">
            {editing ? (
              <>
                <div className={rowCls}>
                  <label className={labelCls}>依頼部署</label>
                  <div className="flex-1">
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
                </div>
                <div className={rowCls}>
                  <label className={labelCls}>依頼営業名</label>
                  <select value={form.requester_id} onChange={e => handleUserSelect(e.target.value)}
                    className="flex-1 h-8 border rounded px-2 text-sm bg-white">
                    <option value="">-- 選択してください --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className={rowCls}>
                  <label className={labelCls}>クライアント</label>
                  <Input value={form.client} onChange={e => set("client", e.target.value)} className={inputCls} autoComplete="off" />
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
                      {CONTENT_OPTIONS.map(o => <option key={o} value={o} />)}
                    </datalist>
                  </div>
                </div>
                <div className={rowCls}>
                  <label className={labelCls}>ジャンル</label>
                  <select value={form.genre} onChange={e => set("genre", e.target.value)} className="flex-1 h-8 border rounded px-2 text-sm bg-white">
                    <option value="">-- 選択 --</option>
                    {GENRE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className={rowCls}>
                  <label className={labelCls}>品目名</label>
                  <select value={form.hinmoku} onChange={e => set("hinmoku", e.target.value)} className="flex-1 h-8 border rounded px-2 text-sm bg-white">
                    <option value="">-- 選択 --</option>
                    {HINMOKU_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
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
              </>
            ) : (
              <>
                <div className={rowCls}><span className={valLabelCls}>依頼部署</span><span className={valCls}>{record.department || "—"}</span></div>
                <div className={rowCls}><span className={valLabelCls}>依頼営業名</span><span className={valCls}>{record.requester_name || "—"}</span></div>
                <div className={rowCls}><span className={valLabelCls}>クライアント</span><span className={valCls}>{record.client || "—"}</span></div>
                <div className={rowCls}><span className={valLabelCls}>タイトル</span><span className={valCls}>{record.title || "—"}</span></div>
                <div className={rowCls}><span className={valLabelCls}>依頼内容</span><span className={valCls}>{record.content || "—"}</span></div>
                <div className={rowCls}><span className={valLabelCls}>ジャンル</span><span className={valCls}>{record.genre || "—"}</span></div>
                <div className={rowCls}><span className={valLabelCls}>品目名</span><span className={valCls}>{record.hinmoku || "—"}</span></div>
                <div className={rowCls}><span className={valLabelCls}>品番</span><span className={valCls}>{record.hinban || "—"}</span></div>
                <div className={rowCls}><span className={valLabelCls}>型台帳番号</span><span className={valCls}>{record.dieline_no || "—"}</span></div>
                <div className={rowCls}>
                  <span className={valLabelCls}>展開寸法</span>
                  <span className={valCls}>
                    {record.develop_y != null || record.develop_x != null
                      ? `${record.develop_y ?? "—"} × ${record.develop_x ?? "—"} mm`
                      : "—"}
                  </span>
                </div>
                <div className={rowCls}><span className={valLabelCls}>用紙</span><span className={valCls}>{record.paper || "—"}</span></div>
                <div className={rowCls}><span className={valLabelCls}>仕上個数</span><span className={valCls}>{record.finish_count != null ? `${record.finish_count}個` : "—"}</span></div>
                <div className={rowCls}>
                  <span className={valLabelCls}>希望納期</span>
                  <span className={valCls}>{formatDate(record.desired_date)}{record.desired_time ? `　${record.desired_time}` : ""}</span>
                </div>
              </>
            )}
          </div>

          {/* 右カラム */}
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 mb-3">トレイ仕様詳細</h3>
              {editing ? (
                <div className="space-y-3">
                  <div className={rowCls}>
                    <label className={labelCls}>使用トレイ</label>
                    <Input value={form.tray} onChange={e => set("tray", e.target.value)} className={inputCls} autoComplete="off" />
                  </div>
                  <div className={rowCls}>
                    <label className={labelCls}>デジ仕様</label>
                    <Input value={form.degi_spec} onChange={e => set("degi_spec", e.target.value)} className={inputCls} autoComplete="off" />
                  </div>
                  <div className={rowCls}>
                    <label className={labelCls}>トレイ枚数</label>
                    <Input type="number" value={form.tray_count} onChange={e => set("tray_count", e.target.value)} className={inputCls} autoComplete="off" />
                  </div>
                  <div className={rowCls}>
                    <label className={labelCls}>ポケット</label>
                    <Input value={form.pocket} onChange={e => set("pocket", e.target.value)} className={inputCls} autoComplete="off" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={rowCls}><span className={valLabelCls}>使用トレイ</span><span className={valCls}>{record.tray || "—"}</span></div>
                  <div className={rowCls}><span className={valLabelCls}>デジ仕様</span><span className={valCls}>{record.degi_spec || "—"}</span></div>
                  <div className={rowCls}><span className={valLabelCls}>トレイ枚数</span><span className={valCls}>{record.tray_count != null ? `${record.tray_count}枚` : "—"}</span></div>
                  <div className={rowCls}><span className={valLabelCls}>ポケット</span><span className={valCls}>{record.pocket || "—"}</span></div>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 mb-3">詳細記入欄</h3>
              {editing ? (
                <textarea
                  value={form.remarks}
                  onChange={e => set("remarks", e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm resize-none"
                  rows={8}
                  autoComplete="off"
                />
              ) : (
                <p className="text-sm text-gray-800 whitespace-pre-wrap min-h-[8rem]">{record.remarks || "—"}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
