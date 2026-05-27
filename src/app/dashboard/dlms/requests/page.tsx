"use client"
import { useEffect, useState, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Download, Upload } from "lucide-react"

const HAICHI_OPTIONS = ["未手配", "社内作成", "外注手配", "手配不要"]
const LOCATION_OPTIONS = ["J 1", "島田PC", "島田ダイマト", "本社", "東京ユニオン", "イシイ埼玉", "パックウェル"]
const TIME_OPTIONS = ["AM", "PM"]

type Child = { edaban: string; han: string | null; me: string | null; kiri: string | null; men: string | null; sizey: number | null; sizex: number | null; 咥え: number | null }
type Parent = { uid_ntemp: string; genre: string | null; spec: string | null; hinmoku: string | null; sizey?: number | null; sizex?: number | null }
type DielineRequest = {
  id: string; request_no: string; parentId: string; childId: string | null
  shohin_no: string | null; location: string | null; seisan_tanto: string | null
  use_date: string | null; use_time: string | null; request_note: string | null
  haichi_kakunin_by: string | null; haichi_kakunin: string
  kansei_date: string | null; kansei_time: string | null; haichi_note: string | null
  parent: Parent; child: Child | null
}
type DilineParentOption = { id: string; uid_ntemp: string; children: { id: string; edaban: string }[] }
type FormData = {
  parentId: string; childId: string; shohin_no: string; location: string
  seisan_tanto: string; use_date: string; use_time: string; request_note: string
  haichi_kakunin_by: string; haichi_kakunin: string
  kansei_date: string; kansei_time: string; haichi_note: string
}
const emptyForm: FormData = {
  parentId: "", childId: "", shohin_no: "", location: "",
  seisan_tanto: "", use_date: "", use_time: "PM", request_note: "",
  haichi_kakunin_by: "", haichi_kakunin: "未手配",
  kansei_date: "", kansei_time: "PM", haichi_note: "",
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (ch === '"') { inQuotes = false }
      else { field += ch }
    } else {
      if (ch === '"') { inQuotes = true }
      else if (ch === ',') { row.push(field); field = "" }
      else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        if (ch === '\r') i++
        row.push(field); field = ""
        if (row.some(v => v !== "")) rows.push(row)
        row = []
      } else { field += ch }
    }
  }
  if (field || row.length > 0) { row.push(field); if (row.some(v => v !== "")) rows.push(row) }
  return rows
}

function RequestsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [requests, setRequests] = useState<DielineRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filterHaichi, setFilterHaichi] = useState("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DielineRequest | null>(null)
  const [parentOptions, setParentOptions] = useState<DilineParentOption[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ count: number; errors: string[] } | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  const fetchRequests = async (haichi?: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (haichi && haichi !== "all") params.set("haichi", haichi)
    const res = await fetch(`/api/dlms/requests?${params.toString()}`)
    const data = await res.json()
    setRequests(data)
    setLoading(false)
  }
  const fetchParentOptions = async () => {
    const res = await fetch("/api/dlms/dielines")
    const data = await res.json()
    setParentOptions(data.map((p: any) => ({
      id: p.id, uid_ntemp: p.uid_ntemp,
      children: p.children.map((c: any) => ({ id: c.id, edaban: c.edaban })),
    })))
  }
  useEffect(() => { fetchRequests(); fetchParentOptions() }, [])
  useEffect(() => {
    const parentId = searchParams.get("parentId")
    const childId = searchParams.get("childId")
    if (parentId && parentOptions.length > 0) {
      setForm({ ...emptyForm, use_date: new Date().toISOString().split("T")[0], parentId, childId: childId ?? "" })
      setModalOpen(true)
    }
  }, [searchParams, parentOptions])

  const selectedParentOption = parentOptions.find(p => p.id === form.parentId)

  const openCreate = () => {
    setForm({ ...emptyForm, use_date: new Date().toISOString().split("T")[0] })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.parentId) return
    setSaving(true)
    const payload = {
      parentId: form.parentId, childId: form.childId || null,
      shohin_no: form.shohin_no || null, location: form.location || null,
      seisan_tanto: form.seisan_tanto || null,
      use_date: form.use_date || null, use_time: form.use_time || null,
      request_note: form.request_note || null,
      haichi_kakunin_by: form.haichi_kakunin_by || null,
      haichi_kakunin: form.haichi_kakunin,
      kansei_date: form.kansei_date || null, kansei_time: form.kansei_time || null,
      haichi_note: form.haichi_note || null,
    }
    const res = await fetch("/api/dlms/requests", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const created = await res.json()
    setSaving(false)
    setModalOpen(false)
    router.push(`/dashboard/dlms/requests/${created.id}`)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await fetch(`/api/dlms/requests/${deleteTarget.id}`, { method: "DELETE" })
    setDeleteTarget(null)
    fetchRequests(filterHaichi)
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    if (filterHaichi !== "all") params.set("haichi", filterHaichi)
    window.location.href = `/api/dlms/requests/export?${params.toString()}`
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    const text = await file.text()
    const cleaned = text.replace(/^\uFEFF/, "")
    const allRows = parseCSV(cleaned)
    const dataRows = allRows.slice(1).filter(r => r.length >= 2)
    const CHUNK = 10
    let totalCount = 0
    const allErrors: string[] = []
    for (let i = 0; i < dataRows.length; i += CHUNK) {
      const chunk = dataRows.slice(i, i + CHUNK)
      const res = await fetch("/api/dlms/requests/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: chunk }),
      })
      const result = await res.json()
      totalCount += result.count ?? 0
      if (result.errors) allErrors.push(...result.errors)
    }
    setImportResult({ count: totalCount, errors: allErrors })
    setImporting(false)
    fetchRequests(filterHaichi)
    if (importRef.current) importRef.current.value = ""
  }

  const HAICHI_COLORS: Record<string, string> = {
    "未手配": "bg-yellow-100 text-yellow-700",
    "社内作成": "bg-blue-100 text-blue-700",
    "外注手配": "bg-purple-100 text-purple-700",
    "手配不要": "bg-gray-100 text-gray-500",
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">抜き型手配依頼書管理</h1>
          <p className="text-sm text-gray-500 mt-1">抜き型手配依頼書の管理</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} className="flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />CSVエクスポート
          </Button>
          <label className={`flex items-center gap-2 text-sm px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer transition-colors ${importing ? "opacity-50 pointer-events-none" : ""}`}>
            <Upload className="w-4 h-4" />
            {importing ? "インポート中..." : "CSVインポート"}
            <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile} />
          </label>
          <Button onClick={openCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />新規作成
          </Button>
        </div>
      </div>

      {importResult && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm border ${importResult.errors.length > 0 ? "bg-yellow-50 border-yellow-200 text-yellow-800" : "bg-green-50 border-green-200 text-green-800"}`}>
          <p className="font-medium">{importResult.count}件をインポートしました。</p>
          {importResult.errors.length > 0 && (
            <ul className="mt-1 list-disc list-inside space-y-0.5">
              {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
          <button onClick={() => setImportResult(null)} className="mt-1 underline text-xs">閉じる</button>
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <Label className="text-sm text-gray-600">手配確認：</Label>
        <select value={filterHaichi}
          onChange={e => { setFilterHaichi(e.target.value); fetchRequests(e.target.value) }}
          className="border rounded px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">すべて</option>
          {HAICHI_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">読み込み中...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-gray-400">依頼書がありません</div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">No.</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">手配確認</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">依頼者</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">手配者</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">型番号-枝番</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">使用品番</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">型使用予定日</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">完成予定日</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map(r => (
                <tr key={r.id}
                  onClick={() => router.push(`/dashboard/dlms/requests/${r.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-700">{r.request_no}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${HAICHI_COLORS[r.haichi_kakunin] ?? "bg-gray-100 text-gray-700"}`}>
                      {r.haichi_kakunin}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.seisan_tanto ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{r.haichi_kakunin_by ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{r.parent.uid_ntemp}{r.child ? `-${r.child.edaban}` : ""}</td>
                  <td className="px-4 py-3 text-gray-600">{r.shohin_no ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {r.use_date ? new Date(r.use_date).toLocaleDateString("ja-JP") : "—"} {r.use_time ?? ""}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {r.kansei_date ? new Date(r.kansei_date).toLocaleDateString("ja-JP") : "—"} {r.kansei_time ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-800">抜き型手配依頼書を新規作成</h2>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 mb-3">手配依頼内容</h3>
                <div className="space-y-3">
                  <div><Label className="text-xs">生産管理担当者</Label>
                    <Input value={form.seisan_tanto} onChange={e => setForm(f => ({ ...f, seisan_tanto: e.target.value }))}
                      className="mt-1 h-8 text-sm" autoComplete="off" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">型番号</Label>
                      <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value, childId: "" }))}
                        className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                        <option value="">選択してください</option>
                        {parentOptions.map(p => <option key={p.id} value={p.id}>{p.uid_ntemp}</option>)}
                      </select>
                    </div>
                    <div><Label className="text-xs">枝番</Label>
                      <select value={form.childId} onChange={e => setForm(f => ({ ...f, childId: e.target.value }))}
                        className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white" disabled={!selectedParentOption}>
                        <option value="">—</option>
                        {selectedParentOption?.children.map(c => <option key={c.id} value={c.id}>{c.edaban}</option>)}
                      </select>
                    </div>
                  </div>
                  <div><Label className="text-xs">使用品番</Label>
                    <Input value={form.shohin_no} onChange={e => setForm(f => ({ ...f, shohin_no: e.target.value }))}
                      className="mt-1 h-8 text-sm" autoComplete="off" /></div>
                  <div><Label className="text-xs">所在</Label>
                    <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                      <option value="">—</option>
                      {LOCATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">型使用予定日</Label>
                      <Input type="date" value={form.use_date} onChange={e => setForm(f => ({ ...f, use_date: e.target.value }))}
                        className="mt-1 h-8 text-sm" /></div>
                    <div><Label className="text-xs">AM/PM</Label>
                      <select value={form.use_time} onChange={e => setForm(f => ({ ...f, use_time: e.target.value }))}
                        className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                        {TIME_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div><Label className="text-xs">備考</Label>
                    <Textarea value={form.request_note} onChange={e => setForm(f => ({ ...f, request_note: e.target.value }))}
                      className="mt-1 text-sm" rows={3} /></div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 mb-3">チェック欄</h3>
                <div className="space-y-3">
                  <div><Label className="text-xs">手配確認者</Label>
                    <Input value={form.haichi_kakunin_by} onChange={e => setForm(f => ({ ...f, haichi_kakunin_by: e.target.value }))}
                      className="mt-1 h-8 text-sm" autoComplete="off" /></div>
                  <div><Label className="text-xs">手配確認</Label>
                    <select value={form.haichi_kakunin} onChange={e => setForm(f => ({ ...f, haichi_kakunin: e.target.value }))}
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                      {HAICHI_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">完成予定日</Label>
                      <Input type="date" value={form.kansei_date} onChange={e => setForm(f => ({ ...f, kansei_date: e.target.value }))}
                        className="mt-1 h-8 text-sm" /></div>
                    <div><Label className="text-xs">AM/PM</Label>
                      <select value={form.kansei_time} onChange={e => setForm(f => ({ ...f, kansei_time: e.target.value }))}
                        className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                        {TIME_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div><Label className="text-xs">備考</Label>
                    <Textarea value={form.haichi_note} onChange={e => setForm(f => ({ ...f, haichi_note: e.target.value }))}
                      className="mt-1 text-sm" rows={3} /></div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2 flex-shrink-0">
              <Button variant="outline" onClick={() => setModalOpen(false)}>キャンセル</Button>
              <Button onClick={handleSave} disabled={saving || !form.parentId}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">削除の確認</h2>
            <p className="text-sm text-gray-600">抜き型手配依頼書 No.{deleteTarget.request_no} を削除しますか？</p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>キャンセル</Button>
              <Button variant="destructive" onClick={handleDelete}>削除</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DielineRequestsPage() {
  return (
    <Suspense>
      <RequestsPageInner />
    </Suspense>
  )
}
