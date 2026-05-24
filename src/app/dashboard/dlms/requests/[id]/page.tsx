"use client"
import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, Pencil, Trash2, X } from "lucide-react"
import { usePDF, Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer"

Font.register({ family: "NotoSansJP", src: "/NotoSansJP.otf" })

const S = StyleSheet.create({
  page: { fontFamily: "NotoSansJP", paddingTop: "20mm", paddingBottom: "20mm", paddingLeft: "20mm", paddingRight: "20mm", fontSize: 10 },
  title: { fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 16 },
  no: { fontSize: 10, textAlign: "right", marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", borderBottomWidth: 1, borderBottomColor: "#000", borderBottomStyle: "solid", paddingBottom: 4, marginBottom: 8 },
  table: { borderTopWidth: 1, borderTopColor: "#888", borderTopStyle: "solid", borderLeftWidth: 1, borderLeftColor: "#888", borderLeftStyle: "solid", borderRightWidth: 1, borderRightColor: "#888", borderRightStyle: "solid" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#888", borderBottomStyle: "solid" },
  label: { width: 100, backgroundColor: "#f3f3f3", borderRightWidth: 1, borderRightColor: "#888", borderRightStyle: "solid", padding: 6, fontSize: 9 },
  value: { flex: 1, padding: 6 },
  signArea: { flexDirection: "row", justifyContent: "flex-end", marginTop: 24 },
  signTable: { borderTopWidth: 1, borderTopColor: "#888", borderTopStyle: "solid", borderLeftWidth: 1, borderLeftColor: "#888", borderLeftStyle: "solid", borderRightWidth: 1, borderRightColor: "#888", borderRightStyle: "solid" },
  signRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#888", borderBottomStyle: "solid" },
  signLabel: { width: 60, backgroundColor: "#f3f3f3", borderRightWidth: 1, borderRightColor: "#888", borderRightStyle: "solid", padding: 6, fontSize: 9 },
  signValue: { width: 120, padding: 6 },
})

type Child = { edaban: string; han: string | null; me: string | null; kiri: string | null; men: string | null; sizey: number | null; sizex: number | null }
type Parent = { uid_ntemp: string }
type Request = {
  id: string; request_no: string; parentId: string; childId: string | null
  shohin_no: string | null; location: string | null; seisan_tanto: string | null
  use_date: string | null; use_time: string | null; request_note: string | null
  haichi_kakunin_by: string | null; haichi_kakunin: string
  kansei_date: string | null; kansei_time: string | null; haichi_note: string | null
  parent: Parent; child: Child | null
}

const HAICHI_OPTIONS = ["未手配", "社内作成", "外注手配", "手配不要"]
const LOCATION_OPTIONS = ["J 1", "島田PC", "島田ダイマト", "本社", "東京ユニオン", "イシイ埼玉", "パックウェル"]
const TIME_OPTIONS = ["AM", "PM"]

type FormData = {
  parentId: string; childId: string; shohin_no: string; location: string
  seisan_tanto: string; use_date: string; use_time: string; request_note: string
  haichi_kakunin_by: string; haichi_kakunin: string
  kansei_date: string; kansei_time: string; haichi_note: string
}

function RequestPdfDocument({ r }: { r: Request }) {
  return (
    <Document>
      <Page size="A4" style={S.page}>
        <Text style={S.title}>抜き型手配依頼書</Text>
        <Text style={S.no}>No. {r.request_no}</Text>
        <View style={S.section}>
          <Text style={S.sectionTitle}>手配依頼内容</Text>
          <View style={S.table}>
            <View style={S.row}><Text style={S.label}>生産管理担当者</Text><Text style={S.value}>{r.seisan_tanto ?? ""}</Text></View>
            <View style={S.row}><Text style={S.label}>型番号</Text><Text style={S.value}>{r.parent.uid_ntemp}{r.child ? ` - ${r.child.edaban}` : ""}</Text></View>
            <View style={S.row}><Text style={S.label}>使用品番</Text><Text style={S.value}>{r.shohin_no ?? ""}</Text></View>
            <View style={S.row}><Text style={S.label}>所在</Text><Text style={S.value}>{r.location ?? ""}</Text></View>
            {r.child && (
              <View style={S.row}>
                <Text style={S.label}>面付</Text>
                <Text style={S.value}>{[r.child.han, r.child.me, r.child.kiri, r.child.men].filter(Boolean).join(" / ")}</Text>
              </View>
            )}
            <View style={S.row}>
              <Text style={S.label}>型使用予定日</Text>
              <Text style={S.value}>{r.use_date ? new Date(r.use_date).toLocaleDateString("ja-JP") : ""} {r.use_time ?? ""}</Text>
            </View>
            <View style={S.row}><Text style={S.label}>備考</Text><Text style={S.value}>{r.request_note ?? ""}</Text></View>
          </View>
        </View>
        <View style={S.section}>
          <Text style={S.sectionTitle}>チェック欄</Text>
          <View style={S.table}>
            <View style={S.row}><Text style={S.label}>手配確認者</Text><Text style={S.value}>{r.haichi_kakunin_by ?? ""}</Text></View>
            <View style={S.row}><Text style={S.label}>手配確認</Text><Text style={S.value}>{r.haichi_kakunin}</Text></View>
            <View style={S.row}>
              <Text style={S.label}>完成予定日</Text>
              <Text style={S.value}>{r.kansei_date ? new Date(r.kansei_date).toLocaleDateString("ja-JP") : ""} {r.kansei_time ?? ""}</Text>
            </View>
            <View style={S.row}><Text style={S.label}>備考</Text><Text style={S.value}>{r.haichi_note ?? ""}</Text></View>
          </View>
        </View>
        <View style={S.signArea}>
          <View style={S.signTable}>
            <View style={S.signRow}><Text style={S.signLabel}>確認日</Text><Text style={S.signValue}></Text></View>
            <View style={S.signRow}><Text style={S.signLabel}>サイン</Text><Text style={S.signValue}></Text></View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

function PdfButton({ r }: { r: Request }) {
  const [instance, updateInstance] = usePDF({ document: <RequestPdfDocument r={r} /> })
  const [clicking, setClicking] = useState(false)
  useEffect(() => { updateInstance(<RequestPdfDocument r={r} />) }, [r])
  const handleClick = async () => {
    if (clicking) return
    setClicking(true)
    let url = instance.url
    if (!url) {
      await new Promise<void>(resolve => {
        const interval = setInterval(() => {
          if (instance.url) { url = instance.url; clearInterval(interval); resolve() }
        }, 100)
      })
    }
    if (!url) { setClicking(false); return }
    const link = document.createElement("a")
    link.href = url
    link.download = `依頼書_${r.request_no}.pdf`
    link.click()
    setClicking(false)
  }
  return (
    <button onClick={handleClick} disabled={clicking}
      className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg shadow transition-colors disabled:opacity-50">
      {clicking ? "出力中..." : "📄 PDF出力"}
    </button>
  )
}

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [request, setRequest] = useState<Request | null>(null)
  const [fetching, setFetching] = useState(true)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [form, setForm] = useState<FormData | null>(null)
  const [saving, setSaving] = useState(false)
  const [parentOptions, setParentOptions] = useState<{ id: string; uid_ntemp: string; children: { id: string; edaban: string }[] }[]>([])

  const fetchRequest = async () => {
    const res = await fetch(`/api/dlms/requests/${id}`)
    const data = await res.json()
    setRequest(data)
    setFetching(false)
  }

  useEffect(() => {
    fetchRequest()
    fetch("/api/dlms/dielines").then(r => r.json()).then(data =>
      setParentOptions(data.map((p: any) => ({
        id: p.id, uid_ntemp: p.uid_ntemp,
        children: p.children.map((c: any) => ({ id: c.id, edaban: c.edaban })),
      })))
    )
  }, [id])

  const openEdit = () => {
    if (!request) return
    setForm({
      parentId: request.parentId, childId: request.childId ?? "",
      shohin_no: request.shohin_no ?? "", location: request.location ?? "",
      seisan_tanto: request.seisan_tanto ?? "",
      use_date: request.use_date ? request.use_date.split("T")[0] : "",
      use_time: request.use_time ?? "PM", request_note: request.request_note ?? "",
      haichi_kakunin_by: request.haichi_kakunin_by ?? "",
      haichi_kakunin: request.haichi_kakunin,
      kansei_date: request.kansei_date ? request.kansei_date.split("T")[0] : "",
      kansei_time: request.kansei_time ?? "PM", haichi_note: request.haichi_note ?? "",
    })
    setEditModalOpen(true)
  }

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    await fetch(`/api/dlms/requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentId: form.parentId, childId: form.childId || null,
        shohin_no: form.shohin_no || null, location: form.location || null,
        seisan_tanto: form.seisan_tanto || null,
        use_date: form.use_date || null, use_time: form.use_time || null,
        request_note: form.request_note || null,
        haichi_kakunin_by: form.haichi_kakunin_by || null,
        haichi_kakunin: form.haichi_kakunin,
        kansei_date: form.kansei_date || null, kansei_time: form.kansei_time || null,
        haichi_note: form.haichi_note || null,
      }),
    })
    setSaving(false)
    setEditModalOpen(false)
    fetchRequest()
  }

  const handleDelete = async () => {
    if (!confirm("この依頼書を削除しますか？")) return
    await fetch(`/api/dlms/requests/${id}`, { method: "DELETE" })
    router.push("/dashboard/dlms/requests")
  }

  const selectedParentOption = parentOptions.find(p => p.id === form?.parentId)

  const HAICHI_COLORS: Record<string, string> = {
    "未手配": "bg-yellow-100 text-yellow-700",
    "社内作成": "bg-blue-100 text-blue-700",
    "外注手配": "bg-purple-100 text-purple-700",
    "手配不要": "bg-gray-100 text-gray-500",
  }

  if (fetching) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">読み込み中...</div>
  if (!request) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">依頼書が見つかりません</div>

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard/dlms/requests")} className="text-gray-400 hover:text-gray-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">抜き型手配依頼書 No.{request.request_no}</h1>
              <p className="text-xs text-gray-400 mt-0.5">{request.parent.uid_ntemp}{request.child ? ` - ${request.child.edaban}` : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PdfButton r={request} />
            <button onClick={openEdit}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 px-3 py-2 rounded-lg hover:bg-blue-50">
              <Pencil className="w-4 h-4" />編集
            </button>
            <button onClick={handleDelete}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50">
              <Trash2 className="w-4 h-4" />削除
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-2xl w-full space-y-6">
        {/* 手配依頼内容 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 border-b pb-2">手配依頼内容</h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div><dt className="text-xs text-gray-400">生産管理担当者</dt><dd className="mt-0.5">{request.seisan_tanto ?? "—"}</dd></div>
            <div><dt className="text-xs text-gray-400">型番号-枝番</dt><dd className="mt-0.5">{request.parent.uid_ntemp}{request.child ? ` - ${request.child.edaban}` : ""}</dd></div>
            <div><dt className="text-xs text-gray-400">使用品番</dt><dd className="mt-0.5">{request.shohin_no ?? "—"}</dd></div>
            <div><dt className="text-xs text-gray-400">所在</dt><dd className="mt-0.5">{request.location ?? "—"}</dd></div>
            {request.child && (
              <div className="col-span-2">
                <dt className="text-xs text-gray-400">面付</dt>
                <dd className="mt-0.5">{[request.child.han, request.child.me, request.child.kiri, request.child.men].filter(Boolean).join(" / ") || "—"}</dd>
              </div>
            )}
            <div><dt className="text-xs text-gray-400">型使用予定日</dt><dd className="mt-0.5">{request.use_date ? new Date(request.use_date).toLocaleDateString("ja-JP") : "—"} {request.use_time ?? ""}</dd></div>
            {request.request_note && (
              <div className="col-span-2"><dt className="text-xs text-gray-400">備考</dt><dd className="mt-0.5 whitespace-pre-wrap">{request.request_note}</dd></div>
            )}
          </dl>
        </div>

        {/* チェック欄 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 border-b pb-2">チェック欄</h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div><dt className="text-xs text-gray-400">手配確認者</dt><dd className="mt-0.5">{request.haichi_kakunin_by ?? "—"}</dd></div>
            <div>
              <dt className="text-xs text-gray-400">手配確認</dt>
              <dd className="mt-0.5">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${HAICHI_COLORS[request.haichi_kakunin] ?? "bg-gray-100 text-gray-700"}`}>
                  {request.haichi_kakunin}
                </span>
              </dd>
            </div>
            <div><dt className="text-xs text-gray-400">完成予定日</dt><dd className="mt-0.5">{request.kansei_date ? new Date(request.kansei_date).toLocaleDateString("ja-JP") : "—"} {request.kansei_time ?? ""}</dd></div>
            {request.haichi_note && (
              <div className="col-span-2"><dt className="text-xs text-gray-400">備考</dt><dd className="mt-0.5 whitespace-pre-wrap">{request.haichi_note}</dd></div>
            )}
          </dl>
        </div>
      </div>

      {/* 編集モーダル */}
      {editModalOpen && form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
              <h2 className="text-base font-bold text-gray-900">抜き型手配依頼書を編集</h2>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 mb-3">手配依頼内容</h3>
                <div className="space-y-3">
                  <div><Label className="text-xs">生産管理担当者</Label>
                    <Input value={form.seisan_tanto} onChange={e => setForm(f => f ? ({ ...f, seisan_tanto: e.target.value }) : f)}
                      className="mt-1 h-8 text-sm" autoComplete="off" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">型番号</Label>
                      <select value={form.parentId} onChange={e => setForm(f => f ? ({ ...f, parentId: e.target.value, childId: "" }) : f)}
                        className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                        <option value="">選択してください</option>
                        {parentOptions.map(p => <option key={p.id} value={p.id}>{p.uid_ntemp}</option>)}
                      </select>
                    </div>
                    <div><Label className="text-xs">枝番</Label>
                      <select value={form.childId} onChange={e => setForm(f => f ? ({ ...f, childId: e.target.value }) : f)}
                        className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white" disabled={!selectedParentOption}>
                        <option value="">—</option>
                        {selectedParentOption?.children.map(c => <option key={c.id} value={c.id}>{c.edaban}</option>)}
                      </select>
                    </div>
                  </div>
                  <div><Label className="text-xs">使用品番</Label>
                    <Input value={form.shohin_no} onChange={e => setForm(f => f ? ({ ...f, shohin_no: e.target.value }) : f)}
                      className="mt-1 h-8 text-sm" autoComplete="off" /></div>
                  <div><Label className="text-xs">所在</Label>
                    <select value={form.location} onChange={e => setForm(f => f ? ({ ...f, location: e.target.value }) : f)}
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                      <option value="">—</option>
                      {LOCATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">型使用予定日</Label>
                      <Input type="date" value={form.use_date} onChange={e => setForm(f => f ? ({ ...f, use_date: e.target.value }) : f)}
                        className="mt-1 h-8 text-sm" /></div>
                    <div><Label className="text-xs">AM/PM</Label>
                      <select value={form.use_time} onChange={e => setForm(f => f ? ({ ...f, use_time: e.target.value }) : f)}
                        className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                        {TIME_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div><Label className="text-xs">備考</Label>
                    <Textarea value={form.request_note} onChange={e => setForm(f => f ? ({ ...f, request_note: e.target.value }) : f)}
                      className="mt-1 text-sm" rows={3} /></div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 mb-3">チェック欄</h3>
                <div className="space-y-3">
                  <div><Label className="text-xs">手配確認者</Label>
                    <Input value={form.haichi_kakunin_by} onChange={e => setForm(f => f ? ({ ...f, haichi_kakunin_by: e.target.value }) : f)}
                      className="mt-1 h-8 text-sm" autoComplete="off" /></div>
                  <div><Label className="text-xs">手配確認</Label>
                    <select value={form.haichi_kakunin} onChange={e => setForm(f => f ? ({ ...f, haichi_kakunin: e.target.value }) : f)}
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                      {HAICHI_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">完成予定日</Label>
                      <Input type="date" value={form.kansei_date} onChange={e => setForm(f => f ? ({ ...f, kansei_date: e.target.value }) : f)}
                        className="mt-1 h-8 text-sm" /></div>
                    <div><Label className="text-xs">AM/PM</Label>
                      <select value={form.kansei_time} onChange={e => setForm(f => f ? ({ ...f, kansei_time: e.target.value }) : f)}
                        className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                        {TIME_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div><Label className="text-xs">備考</Label>
                    <Textarea value={form.haichi_note} onChange={e => setForm(f => f ? ({ ...f, haichi_note: e.target.value }) : f)}
                      className="mt-1 text-sm" rows={3} /></div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2 flex-shrink-0">
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>キャンセル</Button>
              <Button onClick={handleSave} disabled={saving || !form.parentId}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
