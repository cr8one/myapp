"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

type User = { id: string; name: string | null; department: string | null }
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

const GENRE_OPTIONS = ["CD", "BD", "DVD", "その他"]
const HINMOKU_OPTIONS = ["ハコ", "オビ", "ラベル", "スペーサー", "E式ジャケット", "デジ本体", "その他"]

export default function CadRequestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [record, setRecord] = useState<CadRequest | null>(null)
  const [users, setUsers] = useState<User[]>([])
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

  const departments = Array.from(new Set(users.map(u => u.department ?? "")).values()).sort()
  const labelCls = "text-sm font-medium text-gray-700 mb-1 block"
  const inputCls = "h-9 text-sm"
  const valCls = "text-sm text-gray-800"
  const rowCls = "grid grid-cols-2 gap-4"

  if (!record) return <p className="p-8 text-gray-400 animate-pulse">読み込み中...</p>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/cad/requests")}>← 一覧</Button>
          <h1 className="text-2xl font-bold">CAD依頼書 No.{record.uid}</h1>
        </div>
        <div className="flex gap-2">
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

      <div className="space-y-6">
        {/* 依頼情報 */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4">依頼情報</h2>
            {editing ? (
              <div className={rowCls}>
                <div>
                  <label className={labelCls}>依頼日</label>
                  <Input type="date" value={form.request_date} onChange={e => set("request_date", e.target.value)} className={inputCls} autoComplete="off" />
                </div>
                <div>
                  <label className={labelCls}>依頼時刻</label>
                  <Input type="time" value={form.request_time} onChange={e => set("request_time", e.target.value)} className={inputCls} autoComplete="off" />
                </div>
                <div>
                  <label className={labelCls}>依頼営業名</label>
                  <select value={form.requester_id} onChange={e => handleUserSelect(e.target.value)}
                    className="w-full h-9 border rounded px-2 text-sm bg-white">
                    <option value="">-- 選択してください --</option>
                    {departments.map(dept => (
                      <optgroup key={dept} label={dept || "部署未設定"}>
                        {users.filter(u => (u.department ?? "") === dept).map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>依頼部署</label>
                  <Input value={form.department} onChange={e => set("department", e.target.value)} className={inputCls} autoComplete="off" />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>依頼内容</label>
                  <textarea value={form.content} onChange={e => set("content", e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm resize-none" rows={3} autoComplete="off" />
                </div>
              </div>
            ) : (
              <div className={rowCls}>
                <div><p className="text-xs text-gray-400">依頼日</p><p className={valCls}>{formatDate(record.request_date)}</p></div>
                <div><p className="text-xs text-gray-400">依頼時刻</p><p className={valCls}>{record.request_time || "—"}</p></div>
                <div><p className="text-xs text-gray-400">依頼営業名</p><p className={valCls}>{record.requester_name || "—"}</p></div>
                <div><p className="text-xs text-gray-400">依頼部署</p><p className={valCls}>{record.department || "—"}</p></div>
                <div className="col-span-2"><p className="text-xs text-gray-400">依頼内容</p><p className={valCls + " whitespace-pre-wrap"}>{record.content || "—"}</p></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 案件情報 */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4">案件情報</h2>
            {editing ? (
              <div className={rowCls}>
                <div><label className={labelCls}>クライアント</label><Input value={form.client} onChange={e => set("client", e.target.value)} className={inputCls} autoComplete="off" /></div>
                <div><label className={labelCls}>タイトル</label><Input value={form.title} onChange={e => set("title", e.target.value)} className={inputCls} autoComplete="off" /></div>
                <div>
                  <label className={labelCls}>ジャンル</label>
                  <select value={form.genre} onChange={e => set("genre", e.target.value)} className="w-full h-9 border rounded px-2 text-sm bg-white">
                    <option value="">-- 選択 --</option>
                    {GENRE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>品目名</label>
                  <select value={form.hinmoku} onChange={e => set("hinmoku", e.target.value)} className="w-full h-9 border rounded px-2 text-sm bg-white">
                    <option value="">-- 選択 --</option>
                    {HINMOKU_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>品番</label><Input value={form.hinban} onChange={e => set("hinban", e.target.value)} className={inputCls} autoComplete="off" /></div>
                <div><label className={labelCls}>型台帳番号</label><Input value={form.dieline_no} onChange={e => set("dieline_no", e.target.value)} className={inputCls} autoComplete="off" /></div>
              </div>
            ) : (
              <div className={rowCls}>
                <div><p className="text-xs text-gray-400">クライアント</p><p className={valCls}>{record.client || "—"}</p></div>
                <div><p className="text-xs text-gray-400">タイトル</p><p className={valCls}>{record.title || "—"}</p></div>
                <div><p className="text-xs text-gray-400">ジャンル</p><p className={valCls}>{record.genre || "—"}</p></div>
                <div><p className="text-xs text-gray-400">品目名</p><p className={valCls}>{record.hinmoku || "—"}</p></div>
                <div><p className="text-xs text-gray-400">品番</p><p className={valCls}>{record.hinban || "—"}</p></div>
                <div><p className="text-xs text-gray-400">型台帳番号</p><p className={valCls}>{record.dieline_no || "—"}</p></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 寸法・仕様 */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4">寸法・仕様</h2>
            {editing ? (
              <div className={rowCls}>
                <div><label className={labelCls}>展開天地 (mm)</label><Input type="number" value={form.develop_y} onChange={e => set("develop_y", e.target.value)} className={inputCls} autoComplete="off" /></div>
                <div><label className={labelCls}>展開左右 (mm)</label><Input type="number" value={form.develop_x} onChange={e => set("develop_x", e.target.value)} className={inputCls} autoComplete="off" /></div>
                <div><label className={labelCls}>用紙</label><Input value={form.paper} onChange={e => set("paper", e.target.value)} className={inputCls} autoComplete="off" /></div>
                <div><label className={labelCls}>仕上げ個数</label><Input type="number" value={form.finish_count} onChange={e => set("finish_count", e.target.value)} className={inputCls} autoComplete="off" /></div>
                <div><label className={labelCls}>希望納期日</label><Input type="date" value={form.desired_date} onChange={e => set("desired_date", e.target.value)} className={inputCls} autoComplete="off" /></div>
                <div><label className={labelCls}>希望納期時刻</label><Input type="time" value={form.desired_time} onChange={e => set("desired_time", e.target.value)} className={inputCls} autoComplete="off" /></div>
                <div><label className={labelCls}>使用トレイ</label><Input value={form.tray} onChange={e => set("tray", e.target.value)} className={inputCls} autoComplete="off" /></div>
                <div><label className={labelCls}>デジ仕様</label><Input value={form.degi_spec} onChange={e => set("degi_spec", e.target.value)} className={inputCls} autoComplete="off" /></div>
                <div><label className={labelCls}>トレイ枚数</label><Input type="number" value={form.tray_count} onChange={e => set("tray_count", e.target.value)} className={inputCls} autoComplete="off" /></div>
                <div><label className={labelCls}>ポケット</label><Input value={form.pocket} onChange={e => set("pocket", e.target.value)} className={inputCls} autoComplete="off" /></div>
                <div className="col-span-2">
                  <label className={labelCls}>備考</label>
                  <textarea value={form.remarks} onChange={e => set("remarks", e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm resize-none" rows={3} autoComplete="off" />
                </div>
              </div>
            ) : (
              <div className={rowCls}>
                <div><p className="text-xs text-gray-400">展開天地</p><p className={valCls}>{record.develop_y != null ? `${record.develop_y}mm` : "—"}</p></div>
                <div><p className="text-xs text-gray-400">展開左右</p><p className={valCls}>{record.develop_x != null ? `${record.develop_x}mm` : "—"}</p></div>
                <div><p className="text-xs text-gray-400">用紙</p><p className={valCls}>{record.paper || "—"}</p></div>
                <div><p className="text-xs text-gray-400">仕上げ個数</p><p className={valCls}>{record.finish_count != null ? `${record.finish_count}個` : "—"}</p></div>
                <div><p className="text-xs text-gray-400">希望納期日</p><p className={valCls}>{formatDate(record.desired_date)}</p></div>
                <div><p className="text-xs text-gray-400">希望納期時刻</p><p className={valCls}>{record.desired_time || "—"}</p></div>
                <div><p className="text-xs text-gray-400">使用トレイ</p><p className={valCls}>{record.tray || "—"}</p></div>
                <div><p className="text-xs text-gray-400">デジ仕様</p><p className={valCls}>{record.degi_spec || "—"}</p></div>
                <div><p className="text-xs text-gray-400">トレイ枚数</p><p className={valCls}>{record.tray_count != null ? `${record.tray_count}枚` : "—"}</p></div>
                <div><p className="text-xs text-gray-400">ポケット</p><p className={valCls}>{record.pocket || "—"}</p></div>
                <div className="col-span-2"><p className="text-xs text-gray-400">備考</p><p className={valCls + " whitespace-pre-wrap"}>{record.remarks || "—"}</p></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
