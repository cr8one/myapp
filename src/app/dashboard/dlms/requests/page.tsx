"use client"
import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Printer, Pencil, Trash2, Search } from "lucide-react"

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

export default function DielineRequestsPage() {
  const [requests, setRequests] = useState<DielineRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filterHaichi, setFilterHaichi] = useState("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<DielineRequest | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DielineRequest | null>(null)
  const [parentOptions, setParentOptions] = useState<DilineParentOption[]>([])
  const [printTarget, setPrintTarget] = useState<DielineRequest | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

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

  const selectedParentOption = parentOptions.find(p => p.id === form.parentId)

  const openCreate = () => {
    setEditTarget(null)
    setForm({ ...emptyForm, use_date: new Date().toISOString().split("T")[0] })
    setModalOpen(true)
  }

  const openEdit = (r: DielineRequest) => {
    setEditTarget(r)
    setForm({
      parentId: r.parentId, childId: r.childId ?? "",
      shohin_no: r.shohin_no ?? "", location: r.location ?? "",
      seisan_tanto: r.seisan_tanto ?? "",
      use_date: r.use_date ? r.use_date.split("T")[0] : "",
      use_time: r.use_time ?? "PM", request_note: r.request_note ?? "",
      haichi_kakunin_by: r.haichi_kakunin_by ?? "",
      haichi_kakunin: r.haichi_kakunin,
      kansei_date: r.kansei_date ? r.kansei_date.split("T")[0] : "",
      kansei_time: r.kansei_time ?? "PM", haichi_note: r.haichi_note ?? "",
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.parentId) return
    setSaving(true)
    const payload = {
      parentId: form.parentId,
      childId: form.childId || null,
      shohin_no: form.shohin_no || null,
      location: form.location || null,
      seisan_tanto: form.seisan_tanto || null,
      use_date: form.use_date || null,
      use_time: form.use_time || null,
      request_note: form.request_note || null,
      haichi_kakunin_by: form.haichi_kakunin_by || null,
      haichi_kakunin: form.haichi_kakunin,
      kansei_date: form.kansei_date || null,
      kansei_time: form.kansei_time || null,
      haichi_note: form.haichi_note || null,
    }
    if (editTarget) {
      await fetch(`/api/dlms/requests/${editTarget.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch("/api/dlms/requests", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    }
    setSaving(false)
    setModalOpen(false)
    fetchRequests(filterHaichi)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await fetch(`/api/dlms/requests/${deleteTarget.id}`, { method: "DELETE" })
    setDeleteTarget(null)
    fetchRequests(filterHaichi)
  }

  const handlePrint = (r: DielineRequest) => {
    setPrintTarget(r)
    setTimeout(() => window.print(), 300)
  }

  const HAICHI_COLORS: Record<string, string> = {
    "未手配": "bg-yellow-100 text-yellow-700",
    "社内作成": "bg-blue-100 text-blue-700",
    "外注手配": "bg-purple-100 text-purple-700",
    "手配不要": "bg-gray-100 text-gray-500",
  }

  return (
    <div className="p-6 max-w-7xl mx-auto print:hidden">
      {/* 印刷エリア */}
      {printTarget && (
        <div ref={printRef} className="hidden print:block">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .print-area, .print-area * { visibility: visible; }
              .print-area { position: fixed; top: 0; left: 0; width: 100%; }
            }
          `}</style>
          <div className="print-area p-8 font-sans text-sm" style={{ width: "210mm", minHeight: "297mm" }}>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold">抜き型手配依頼書</h1>
              <div className="text-right">
                <p className="text-sm text-gray-500">No. {printTarget.request_no}</p>
              </div>
            </div>
            <div className="border-b pb-6 mb-6">
              <h2 className="font-bold text-base mb-4">手配依頼内容</h2>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-200">
                  <tr><td className="py-2 text-gray-500 w-40">生産管理担当者</td><td className="py-2 font-medium">{printTarget.seisan_tanto ?? "—"}</td></tr>
                  <tr><td className="py-2 text-gray-500">型番号</td><td className="py-2 font-medium">{printTarget.parent.uid_ntemp}{printTarget.child ? ` - ${printTarget.child.edaban}` : ""}</td></tr>
                  <tr><td className="py-2 text-gray-500">使用品番</td><td className="py-2 font-medium">{printTarget.shohin_no ?? "—"}</td></tr>
                  <tr><td className="py-2 text-gray-500">所在</td><td className="py-2 font-medium">{printTarget.location ?? "—"}</td></tr>
                  {printTarget.child && (
                    <tr>
                      <td className="py-2 text-gray-500">面付</td>
                      <td className="py-2 font-medium">
                        {[printTarget.child.han, printTarget.child.me, printTarget.child.kiri, printTarget.child.men].filter(Boolean).join(" / ")}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-2 text-gray-500">型使用予定日</td>
                    <td className="py-2 font-medium">
                      {printTarget.use_date ? new Date(printTarget.use_date).toLocaleDateString("ja-JP") : "—"} {printTarget.use_time ?? ""}
                    </td>
                  </tr>
                  <tr><td className="py-2 text-gray-500">備考</td><td className="py-2 whitespace-pre-wrap">{printTarget.request_note ?? ""}</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <h2 className="font-bold text-base mb-4">チェック欄</h2>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-200">
                  <tr><td className="py-2 text-gray-500 w-40">手配確認者</td><td className="py-2 font-medium">{printTarget.haichi_kakunin_by ?? "—"}</td></tr>
                  <tr><td className="py-2 text-gray-500">手配確認</td><td className="py-2 font-medium">{printTarget.haichi_kakunin}</td></tr>
                  <tr>
                    <td className="py-2 text-gray-500">完成予定日</td>
                    <td className="py-2 font-medium">
                      {printTarget.kansei_date ? new Date(printTarget.kansei_date).toLocaleDateString("ja-JP") : "—"} {printTarget.kansei_time ?? ""}
                    </td>
                  </tr>
                  <tr><td className="py-2 text-gray-500">備考</td><td className="py-2 whitespace-pre-wrap">{printTarget.haichi_note ?? ""}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">依頼書管理</h1>
          <p className="text-sm text-gray-500 mt-1">抜き型手配依頼書の管理</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />新規作成
        </Button>
      </div>

      {/* フィルター */}
      <div className="mb-4 flex items-center gap-3">
        <Label className="text-sm text-gray-600">手配確認：</Label>
        <select
          value={filterHaichi}
          onChange={e => { setFilterHaichi(e.target.value); fetchRequests(e.target.value) }}
          className="border rounded px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">すべて</option>
          {HAICHI_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {/* 一覧 */}
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
                <th className="text-left px-4 py-3 text-gray-600 font-medium">型番号-枝番</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">使用品番</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">担当者</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">型使用予定日</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">完成予定日</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">手配確認</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-700">{r.request_no}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.parent.uid_ntemp}{r.child ? `-${r.child.edaban}` : ""}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.shohin_no ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{r.seisan_tanto ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {r.use_date ? new Date(r.use_date).toLocaleDateString("ja-JP") : "—"} {r.use_time ?? ""}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {r.kansei_date ? new Date(r.kansei_date).toLocaleDateString("ja-JP") : "—"} {r.kansei_time ?? ""}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${HAICHI_COLORS[r.haichi_kakunin] ?? "bg-gray-100 text-gray-700"}`}>
                      {r.haichi_kakunin}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handlePrint(r)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded" title="PDF印刷">
                        <Printer className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(r)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 作成・編集モーダル */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">{editTarget ? "依頼書を編集" : "依頼書を新規作成"}</h2>
            </div>
            <div className="px-6 py-4 space-y-5">
              {/* 手配依頼内容 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 mb-3">手配依頼内容</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">生産管理担当者</Label>
                    <Input value={form.seisan_tanto} onChange={e => setForm(f => ({ ...f, seisan_tanto: e.target.value }))}
                      className="mt-1 h-8 text-sm" autoComplete="off" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">型番号</Label>
                      <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value, childId: "" }))}
                        className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                        <option value="">選択してください</option>
                        {parentOptions.map(p => <option key={p.id} value={p.id}>{p.uid_ntemp}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">枝番</Label>
                      <select value={form.childId} onChange={e => setForm(f => ({ ...f, childId: e.target.value }))}
                        className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white"
                        disabled={!selectedParentOption}>
                        <option value="">—</option>
                        {selectedParentOption?.children.map(c => (
                          <option key={c.id} value={c.id}>{c.edaban}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">使用品番</Label>
                    <Input value={form.shohin_no} onChange={e => setForm(f => ({ ...f, shohin_no: e.target.value }))}
                      className="mt-1 h-8 text-sm" autoComplete="off" />
                  </div>
                  <div>
                    <Label className="text-xs">所在</Label>
                    <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                      <option value="">—</option>
                      {LOCATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">型使用予定日</Label>
                      <Input type="date" value={form.use_date} onChange={e => setForm(f => ({ ...f, use_date: e.target.value }))}
                        className="mt-1 h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">AM/PM</Label>
                      <select value={form.use_time} onChange={e => setForm(f => ({ ...f, use_time: e.target.value }))}
                        className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                        {TIME_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">備考</Label>
                    <Textarea value={form.request_note} onChange={e => setForm(f => ({ ...f, request_note: e.target.value }))}
                      className="mt-1 text-sm" rows={3} />
                  </div>
                </div>
              </div>
              {/* チェック欄 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 mb-3">チェック欄</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">手配確認者</Label>
                    <Input value={form.haichi_kakunin_by} onChange={e => setForm(f => ({ ...f, haichi_kakunin_by: e.target.value }))}
                      className="mt-1 h-8 text-sm" autoComplete="off" />
                  </div>
                  <div>
                    <Label className="text-xs">手配確認</Label>
                    <select value={form.haichi_kakunin} onChange={e => setForm(f => ({ ...f, haichi_kakunin: e.target.value }))}
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                      {HAICHI_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">完成予定日</Label>
                      <Input type="date" value={form.kansei_date} onChange={e => setForm(f => ({ ...f, kansei_date: e.target.value }))}
                        className="mt-1 h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">AM/PM</Label>
                      <select value={form.kansei_time} onChange={e => setForm(f => ({ ...f, kansei_time: e.target.value }))}
                        className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                        {TIME_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">備考</Label>
                    <Textarea value={form.haichi_note} onChange={e => setForm(f => ({ ...f, haichi_note: e.target.value }))}
                      className="mt-1 text-sm" rows={3} />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>キャンセル</Button>
              <Button onClick={handleSave} disabled={saving || !form.parentId}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">削除の確認</h2>
            <p className="text-sm text-gray-600">依頼書 No.{deleteTarget.request_no} を削除しますか？</p>
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
