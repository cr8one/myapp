"use client"
import { useEffect, useState, useCallback, useRef } from "react"
import { Plus, Pencil, Trash2, X, Check, AlertCircle, Download, Upload, ChevronLeft, ChevronRight } from "lucide-react"

type Format = { id: number; name: string; width: number; height: number; unit: string; note?: string; sortOrder: number }
type Part = { id: number; name: string; width: number; height: number; shape: string; note?: string; sortOrder: number }
type Note = { id: number; name: string; content: string; fontSize: number; color: string; fontWeight: string; sortOrder: number }
type TypeCondition = {
  id: number; genre: string | null; spec: string | null; hinmoku: string | null
  tag1: string | null; tag2: string | null
  genre_sort: number; spec_sort: number; hinmoku_sort: number; tag1_sort: number; tag2_sort: number
}
type Tab = "formats" | "parts" | "notes" | "type-conditions"

const COLORS = ["#1a1a1a", "#e24b4a", "#378add", "#639922", "#ba7517", "#888780"]
const PAGE_SIZE = 50
const emptyFormat = { name: "", width: 0, height: 0, unit: "mm", note: "", sortOrder: 0 }
const emptyPart = { name: "", width: 0, height: 0, shape: "rect", note: "", sortOrder: 0 }
const emptyNote = { name: "", content: "", fontSize: 12, color: "#1a1a1a", fontWeight: "normal", sortOrder: 0 }
const emptyTypeCondition = { genre: "", spec: "", hinmoku: "", tag1: "", tag2: "", genre_sort: 0, spec_sort: 0, hinmoku_sort: 0, tag1_sort: 0, tag2_sort: 0 }

function SortOrderInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input type="number" value={value} onChange={e => onChange(parseInt(e.target.value) || 0)}
      className="w-16 px-2 py-1 text-xs text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="0" />
  )
}

export default function DlmsMastersPage() {
  const [tab, setTab] = useState<Tab>("formats")
  const [formats, setFormats] = useState<Format[]>([])
  const [parts, setParts] = useState<Part[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [typeConditions, setTypeConditions] = useState<TypeCondition[]>([])
  const [tcTotal, setTcTotal] = useState(0)
  const [tcPage, setTcPage] = useState(1)
  const [fetching, setFetching] = useState(true)
  const [editingFormat, setEditingFormat] = useState<Format | null>(null)
  const [addingFormat, setAddingFormat] = useState(false)
  const [newFormat, setNewFormat] = useState(emptyFormat)
  const [editingPart, setEditingPart] = useState<Part | null>(null)
  const [addingPart, setAddingPart] = useState(false)
  const [newPart, setNewPart] = useState(emptyPart)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [addingNote, setAddingNote] = useState(false)
  const [newNote, setNewNote] = useState(emptyNote)
  const [editingTypeCondition, setEditingTypeCondition] = useState<TypeCondition | null>(null)
  const [addingTypeCondition, setAddingTypeCondition] = useState(false)
  const [newTypeCondition, setNewTypeCondition] = useState(emptyTypeCondition)
  const [tcImporting, setTcImporting] = useState(false)
  const [tcImportResult, setTcImportResult] = useState<{ count: number } | null>(null)
  const [tcFilterGenre, setTcFilterGenre] = useState("")
  const [tcFilterSpec, setTcFilterSpec] = useState("")
  const [tcFilterHinmoku, setTcFilterHinmoku] = useState("")
  const tcImportRef = useRef<HTMLInputElement>(null)

  const fetchAll = useCallback(async () => {
    setFetching(true)
    const [f, p, n, tc] = await Promise.all([
      fetch("/api/dlms/formats").then(r => r.json()),
      fetch("/api/dlms/parts").then(r => r.json()),
      fetch("/api/dlms/notes").then(r => r.json()),
      fetch("/api/dlms/type-conditions?count=true").then(r => r.json()),
    ])
    setFormats(f); setParts(p); setNotes(n)
    setTcTotal(tc.total ?? 0)
    setFetching(false)
  }, [])

  const fetchTypeConditions = useCallback(async (genre = "", spec = "", hinmoku = "", page = 1) => {
    const params = new URLSearchParams()
    if (genre) params.set("genre", genre)
    if (spec) params.set("spec", spec)
    if (hinmoku) params.set("hinmoku", hinmoku)
    params.set("page", String(page))
    const res = await fetch(`/api/dlms/type-conditions?${params.toString()}`)
    const data = await res.json()
    setTypeConditions(data.records ?? [])
    setTcTotal(data.total ?? 0)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])
  useEffect(() => {
    if (tab === "type-conditions") fetchTypeConditions(tcFilterGenre, tcFilterSpec, tcFilterHinmoku, 1)
  }, [tab])

  const tcTotalPages = Math.ceil(tcTotal / PAGE_SIZE)

  // ジャンル・仕様・品目のユニークリスト
  const genreOptions = [...new Set(typeConditions.map(r => r.genre).filter(Boolean))] as string[]
  const specOptions = [...new Set(typeConditions.filter(r => !tcFilterGenre || r.genre === tcFilterGenre).map(r => r.spec).filter(Boolean))] as string[]
  const hinmokuOptions = [...new Set(typeConditions.filter(r => (!tcFilterGenre || r.genre === tcFilterGenre) && (!tcFilterSpec || r.spec === tcFilterSpec)).map(r => r.hinmoku).filter(Boolean))] as string[]

  // Format handlers
  const saveFormat = async () => {
    await fetch("/api/dlms/formats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newFormat) })
    setAddingFormat(false); setNewFormat(emptyFormat); fetchAll()
  }
  const updateFormat = async (f: Format) => {
    await fetch(`/api/dlms/formats/${f.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) })
    setEditingFormat(null); fetchAll()
  }
  const deleteFormat = async (id: number) => {
    if (!confirm("削除しますか？")) return
    await fetch(`/api/dlms/formats/${id}`, { method: "DELETE" }); fetchAll()
  }

  // Part handlers
  const savePart = async () => {
    await fetch("/api/dlms/parts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newPart) })
    setAddingPart(false); setNewPart(emptyPart); fetchAll()
  }
  const updatePart = async (p: Part) => {
    await fetch(`/api/dlms/parts/${p.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) })
    setEditingPart(null); fetchAll()
  }
  const deletePart = async (id: number) => {
    if (!confirm("削除しますか？")) return
    await fetch(`/api/dlms/parts/${id}`, { method: "DELETE" }); fetchAll()
  }

  // Note handlers
  const saveNote = async () => {
    await fetch("/api/dlms/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newNote) })
    setAddingNote(false); setNewNote(emptyNote); fetchAll()
  }
  const updateNote = async (n: Note) => {
    await fetch(`/api/dlms/notes/${n.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(n) })
    setEditingNote(null); fetchAll()
  }
  const deleteNote = async (id: number) => {
    if (!confirm("削除しますか？")) return
    await fetch(`/api/dlms/notes/${id}`, { method: "DELETE" }); fetchAll()
  }

  // TypeCondition handlers
  const saveTypeCondition = async () => {
    await fetch("/api/dlms/type-conditions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newTypeCondition) })
    setAddingTypeCondition(false); setNewTypeCondition(emptyTypeCondition)
    fetchTypeConditions(tcFilterGenre, tcFilterSpec, tcFilterHinmoku, tcPage)
  }
  const updateTypeCondition = async (tc: TypeCondition) => {
    await fetch("/api/dlms/type-conditions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(tc) })
    setEditingTypeCondition(null)
    fetchTypeConditions(tcFilterGenre, tcFilterSpec, tcFilterHinmoku, tcPage)
  }
  const deleteTypeCondition = async (id: number) => {
    if (!confirm("削除しますか？")) return
    await fetch("/api/dlms/type-conditions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    fetchTypeConditions(tcFilterGenre, tcFilterSpec, tcFilterHinmoku, tcPage)
  }
  const handleTcExport = () => { window.location.href = "/api/dlms/type-conditions/export" }
  const handleTcDeleteAll = async () => {
    if (!confirm("型条件マスタを全件削除しますか？この操作は取り消せません。")) return
    await fetch("/api/dlms/type-conditions", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteAll" }),
    })
    setTcPage(1)
    fetchTypeConditions("", "", "", 1)
  }
  const handleTcImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setTcImporting(true); setTcImportResult(null)
    const presignRes = await fetch("/api/dlms/type-conditions/presign", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name }),
    })
    const { url, key } = await presignRes.json()
    await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": "text/csv" } })
    let offset = 0; let totalCount = 0
    while (true) {
      const res = await fetch("/api/dlms/type-conditions/import", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, offset }),
      })
      const data = await res.json()
      totalCount += data.count ?? 0
      offset = data.offset
      if (data.done) break
    }
    setTcImportResult({ count: totalCount })
    setTcImporting(false)
    setTcPage(1)
    fetchTypeConditions(tcFilterGenre, tcFilterSpec, tcFilterHinmoku, 1)
    if (tcImportRef.current) tcImportRef.current.value = ""
  }

  const tabs: [Tab, string, number][] = [
    ["formats", "判型マスタ", formats.length],
    ["parts", "パーツマスタ", parts.length],
    ["notes", "注記マスタ", notes.length],
    ["type-conditions", "型条件マスタ", tcTotal],
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">DLMSマスタ管理</h1>
        <p className="text-xs text-gray-400 mt-0.5">判型・パーツ・注記・型条件の管理</p>
      </div>
      <div className="flex border-b mb-6 gap-1">
        {tabs.map(([key, label, count]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === key ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>{count}</span>
          </button>
        ))}
      </div>
      {fetching && tab !== "type-conditions" ? (
        <div className="text-center py-12 text-gray-400 animate-pulse">読み込み中...</div>
      ) : (
        <>
          {/* 判型マスタ */}
          {tab === "formats" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button onClick={() => setAddingFormat(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm">
                  <Plus className="w-4 h-4" />判型を追加
                </button>
              </div>
              {addingFormat && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={newFormat.name} onChange={e => setNewFormat({ ...newFormat, name: e.target.value })} placeholder="判型名" autoFocus autoComplete="off"
                      className="col-span-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="number" value={newFormat.width} onChange={e => setNewFormat({ ...newFormat, width: Number(e.target.value) })} placeholder="幅" autoComplete="off"
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="number" value={newFormat.height} onChange={e => setNewFormat({ ...newFormat, height: Number(e.target.value) })} placeholder="高さ" autoComplete="off"
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="text" value={newFormat.unit} onChange={e => setNewFormat({ ...newFormat, unit: e.target.value })} placeholder="単位" autoComplete="off"
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="text" value={newFormat.note} onChange={e => setNewFormat({ ...newFormat, note: e.target.value })} placeholder="備考" autoComplete="off"
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">順序</span>
                    <SortOrderInput value={newFormat.sortOrder} onChange={v => setNewFormat({ ...newFormat, sortOrder: v })} />
                    <button onClick={saveFormat} className="text-blue-600 hover:text-blue-800"><Check className="w-5 h-5" /></button>
                    <button onClick={() => { setAddingFormat(false); setNewFormat(emptyFormat) }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                  </div>
                </div>
              )}
              {formats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <AlertCircle className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">判型が登録されていません</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm divide-y divide-gray-100">
                  {formats.map(f => (
                    <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                      {editingFormat?.id === f.id ? (
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input type="text" value={editingFormat.name} onChange={e => setEditingFormat({ ...editingFormat, name: e.target.value })} autoComplete="off"
                              className="col-span-2 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <input type="number" value={editingFormat.width} onChange={e => setEditingFormat({ ...editingFormat, width: Number(e.target.value) })} placeholder="幅" autoComplete="off"
                              className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <input type="number" value={editingFormat.height} onChange={e => setEditingFormat({ ...editingFormat, height: Number(e.target.value) })} placeholder="高さ" autoComplete="off"
                              className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <input type="text" value={editingFormat.unit} onChange={e => setEditingFormat({ ...editingFormat, unit: e.target.value })} placeholder="単位" autoComplete="off"
                              className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <input type="text" value={editingFormat.note ?? ""} onChange={e => setEditingFormat({ ...editingFormat, note: e.target.value })} placeholder="備考" autoComplete="off"
                              className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">順序</span>
                            <SortOrderInput value={editingFormat.sortOrder} onChange={v => setEditingFormat({ ...editingFormat, sortOrder: v })} />
                            <button onClick={() => updateFormat(editingFormat)} className="text-blue-600 hover:text-blue-800"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingFormat(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="w-6 text-xs text-gray-400 text-right">{f.sortOrder}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{f.name}</p>
                            <p className="text-xs text-gray-400">{f.width} × {f.height} {f.unit}{f.note ? ` / ${f.note}` : ""}</p>
                          </div>
                          <button onClick={() => setEditingFormat(f)} className="text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deleteFormat(f.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* パーツマスタ */}
          {tab === "parts" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button onClick={() => setAddingPart(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm">
                  <Plus className="w-4 h-4" />パーツを追加
                </button>
              </div>
              {addingPart && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={newPart.name} onChange={e => setNewPart({ ...newPart, name: e.target.value })} placeholder="パーツ名" autoFocus autoComplete="off"
                      className="col-span-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="number" value={newPart.width} onChange={e => setNewPart({ ...newPart, width: Number(e.target.value) })} placeholder="幅" autoComplete="off"
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="number" value={newPart.height} onChange={e => setNewPart({ ...newPart, height: Number(e.target.value) })} placeholder="高さ" autoComplete="off"
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="text" value={newPart.shape} onChange={e => setNewPart({ ...newPart, shape: e.target.value })} placeholder="形状" autoComplete="off"
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="text" value={newPart.note} onChange={e => setNewPart({ ...newPart, note: e.target.value })} placeholder="備考" autoComplete="off"
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">順序</span>
                    <SortOrderInput value={newPart.sortOrder} onChange={v => setNewPart({ ...newPart, sortOrder: v })} />
                    <button onClick={savePart} className="text-blue-600 hover:text-blue-800"><Check className="w-5 h-5" /></button>
                    <button onClick={() => { setAddingPart(false); setNewPart(emptyPart) }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                  </div>
                </div>
              )}
              {parts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <AlertCircle className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">パーツが登録されていません</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm divide-y divide-gray-100">
                  {parts.map(p => (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                      {editingPart?.id === p.id ? (
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input type="text" value={editingPart.name} onChange={e => setEditingPart({ ...editingPart, name: e.target.value })} autoComplete="off"
                              className="col-span-2 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <input type="number" value={editingPart.width} onChange={e => setEditingPart({ ...editingPart, width: Number(e.target.value) })} autoComplete="off"
                              className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <input type="number" value={editingPart.height} onChange={e => setEditingPart({ ...editingPart, height: Number(e.target.value) })} autoComplete="off"
                              className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <input type="text" value={editingPart.shape} onChange={e => setEditingPart({ ...editingPart, shape: e.target.value })} autoComplete="off"
                              className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <input type="text" value={editingPart.note ?? ""} onChange={e => setEditingPart({ ...editingPart, note: e.target.value })} autoComplete="off"
                              className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">順序</span>
                            <SortOrderInput value={editingPart.sortOrder} onChange={v => setEditingPart({ ...editingPart, sortOrder: v })} />
                            <button onClick={() => updatePart(editingPart)} className="text-blue-600 hover:text-blue-800"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingPart(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="w-6 text-xs text-gray-400 text-right">{p.sortOrder}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.width} × {p.height}{p.shape ? ` / ${p.shape}` : ""}{p.note ? ` / ${p.note}` : ""}</p>
                          </div>
                          <button onClick={() => setEditingPart(p)} className="text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deletePart(p.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 注記マスタ */}
          {tab === "notes" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button onClick={() => setAddingNote(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm">
                  <Plus className="w-4 h-4" />注記を追加
                </button>
              </div>
              {addingNote && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 space-y-2">
                  <input type="text" value={newNote.name} onChange={e => setNewNote({ ...newNote, name: e.target.value })} placeholder="注記名" autoFocus autoComplete="off"
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <textarea value={newNote.content} onChange={e => setNewNote({ ...newNote, content: e.target.value })} placeholder="内容" rows={3} autoComplete="off"
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">サイズ</span>
                      <input type="number" value={newNote.fontSize} onChange={e => setNewNote({ ...newNote, fontSize: Number(e.target.value) })}
                        className="w-16 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">色</span>
                      <div className="flex gap-1">
                        {COLORS.map(c => (
                          <button key={c} onClick={() => setNewNote({ ...newNote, color: c })}
                            className={`w-5 h-5 rounded-full border-2 ${newNote.color === c ? "border-blue-500 scale-110" : "border-transparent"}`}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">太さ</span>
                      <select value={newNote.fontWeight} onChange={e => setNewNote({ ...newNote, fontWeight: e.target.value })}
                        className="px-2 py-1 text-xs border border-gray-200 rounded-lg">
                        <option value="normal">normal</option>
                        <option value="bold">bold</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                      <span className="text-xs text-gray-500">順序</span>
                      <SortOrderInput value={newNote.sortOrder} onChange={v => setNewNote({ ...newNote, sortOrder: v })} />
                      <button onClick={saveNote} className="text-blue-600 hover:text-blue-800"><Check className="w-5 h-5" /></button>
                      <button onClick={() => { setAddingNote(false); setNewNote(emptyNote) }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                    </div>
                  </div>
                </div>
              )}
              {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <AlertCircle className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">注記が登録されていません</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm divide-y divide-gray-100">
                  {notes.map(n => (
                    <div key={n.id} className="flex items-start gap-3 px-4 py-3">
                      {editingNote?.id === n.id ? (
                        <div className="flex-1 space-y-2">
                          <input type="text" value={editingNote.name} onChange={e => setEditingNote({ ...editingNote, name: e.target.value })} autoComplete="off"
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          <textarea value={editingNote.content} onChange={e => setEditingNote({ ...editingNote, content: e.target.value })} rows={3} autoComplete="off"
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">サイズ</span>
                              <input type="number" value={editingNote.fontSize} onChange={e => setEditingNote({ ...editingNote, fontSize: Number(e.target.value) })}
                                className="w-16 px-2 py-1 text-xs border border-gray-200 rounded-lg" />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">色</span>
                              <div className="flex gap-1">
                                {COLORS.map(c => (
                                  <button key={c} onClick={() => setEditingNote({ ...editingNote, color: c })}
                                    className={`w-5 h-5 rounded-full border-2 ${editingNote.color === c ? "border-blue-500 scale-110" : "border-transparent"}`}
                                    style={{ backgroundColor: c }} />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">太さ</span>
                              <select value={editingNote.fontWeight} onChange={e => setEditingNote({ ...editingNote, fontWeight: e.target.value })}
                                className="px-2 py-1 text-xs border border-gray-200 rounded-lg">
                                <option value="normal">normal</option>
                                <option value="bold">bold</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-1 ml-auto">
                              <span className="text-xs text-gray-500">順序</span>
                              <SortOrderInput value={editingNote.sortOrder} onChange={v => setEditingNote({ ...editingNote, sortOrder: v })} />
                              <button onClick={() => updateNote(editingNote)} className="text-blue-600 hover:text-blue-800"><Check className="w-4 h-4" /></button>
                              <button onClick={() => setEditingNote(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="w-6 text-xs text-gray-400 text-right mt-1">{n.sortOrder}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium" style={{ color: n.color, fontWeight: n.fontWeight }}>{n.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-wrap">{n.content}</p>
                            <p className="text-xs text-gray-300 mt-0.5">{n.fontSize}pt</p>
                          </div>
                          <button onClick={() => setEditingNote(n)} className="text-gray-400 hover:text-blue-600 mt-1"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deleteNote(n.id)} className="text-gray-400 hover:text-red-600 mt-1"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 型条件マスタ */}
          {tab === "type-conditions" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <select value={tcFilterGenre} onChange={e => { setTcFilterGenre(e.target.value); setTcFilterSpec(""); setTcFilterHinmoku(""); setTcPage(1); fetchTypeConditions(e.target.value, "", "", 1) }}
                    className="h-8 border rounded px-2 text-sm bg-white">
                    <option value="">ジャンル：すべて</option>
                    {genreOptions.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <select value={tcFilterSpec} onChange={e => { setTcFilterSpec(e.target.value); setTcFilterHinmoku(""); setTcPage(1); fetchTypeConditions(tcFilterGenre, e.target.value, "", 1) }}
                    className="h-8 border rounded px-2 text-sm bg-white">
                    <option value="">仕様：すべて</option>
                    {specOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={tcFilterHinmoku} onChange={e => { setTcFilterHinmoku(e.target.value); setTcPage(1); fetchTypeConditions(tcFilterGenre, tcFilterSpec, e.target.value, 1) }}
                    className="h-8 border rounded px-2 text-sm bg-white">
                    <option value="">品目：すべて</option>
                    {hinmokuOptions.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleTcExport}
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 border rounded-lg bg-white hover:bg-gray-50">
                    <Download className="w-4 h-4" />エクスポート
                  </button>
                  <button onClick={handleTcDeleteAll}
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-red-200 rounded-lg bg-white hover:bg-red-50 text-red-600">
                    <Trash2 className="w-4 h-4" />全削除
                  </button>
                  <label className={`flex items-center gap-1.5 text-sm px-3 py-1.5 border rounded-lg bg-white hover:bg-gray-50 cursor-pointer ${tcImporting ? "opacity-50 pointer-events-none" : ""}`}>
                    <Upload className="w-4 h-4" />{tcImporting ? "インポート中..." : "インポート"}
                    <input ref={tcImportRef} type="file" accept=".csv" className="hidden" onChange={handleTcImport} />
                  </label>
                  <button onClick={() => { setAddingTypeCondition(true); setNewTypeCondition(emptyTypeCondition) }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm">
                    <Plus className="w-4 h-4" />追加
                  </button>
                </div>
              </div>

              {tcImportResult && (
                <div className="px-4 py-2 rounded-lg text-sm bg-green-50 border border-green-200 text-green-800">
                  {tcImportResult.count}件をインポートしました。
                  <button onClick={() => setTcImportResult(null)} className="ml-2 underline text-xs">閉じる</button>
                </div>
              )}

              {addingTypeCondition && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 space-y-2">
                  <div className="grid grid-cols-5 gap-2 text-xs text-gray-500 font-medium">
                    <span>ジャンル</span><span>仕様</span><span>品目</span><span>条件タグ1</span><span>条件タグ2</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {(["genre", "spec", "hinmoku", "tag1", "tag2"] as const).map(key => (
                      <input key={key} type="text" value={newTypeCondition[key]} onChange={e => setNewTypeCondition(f => ({ ...f, [key]: e.target.value }))}
                        autoComplete="off" className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    ))}
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-xs text-gray-500 font-medium mt-1">
                    <span>ジャンル順</span><span>仕様順</span><span>品目順</span><span>タグ1順</span><span>タグ2順</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {(["genre_sort", "spec_sort", "hinmoku_sort", "tag1_sort", "tag2_sort"] as const).map(key => (
                      <input key={key} type="number" value={newTypeCondition[key]} onChange={e => setNewTypeCondition(f => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
                        className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={saveTypeCondition} className="text-blue-600 hover:text-blue-800"><Check className="w-5 h-5" /></button>
                    <button onClick={() => setAddingTypeCondition(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                  </div>
                </div>
              )}

              {typeConditions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <AlertCircle className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">型条件が登録されていません</p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left px-3 py-2 text-gray-500 font-medium">ジャンル</th>
                          <th className="text-left px-3 py-2 text-gray-500 font-medium">仕様</th>
                          <th className="text-left px-3 py-2 text-gray-500 font-medium">品目</th>
                          <th className="text-left px-3 py-2 text-gray-500 font-medium">条件タグ1</th>
                          <th className="text-left px-3 py-2 text-gray-500 font-medium">条件タグ2</th>
                          <th className="px-3 py-2 w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {typeConditions.map(tc => (
                          <tr key={tc.id} className="hover:bg-gray-50">
                            {editingTypeCondition?.id === tc.id ? (
                              <td colSpan={6} className="px-3 py-2">
                                <div className="space-y-2">
                                  <div className="grid grid-cols-5 gap-2">
                                    {(["genre", "spec", "hinmoku", "tag1", "tag2"] as const).map(key => (
                                      <input key={key} type="text" value={editingTypeCondition[key] ?? ""} onChange={e => setEditingTypeCondition(f => f ? ({ ...f, [key]: e.target.value }) : f)}
                                        autoComplete="off" className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    ))}
                                  </div>
                                  <div className="grid grid-cols-5 gap-2">
                                    {(["genre_sort", "spec_sort", "hinmoku_sort", "tag1_sort", "tag2_sort"] as const).map(key => (
                                      <input key={key} type="number" value={editingTypeCondition[key]} onChange={e => setEditingTypeCondition(f => f ? ({ ...f, [key]: parseInt(e.target.value) || 0 }) : f)}
                                        className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    ))}
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => updateTypeCondition(editingTypeCondition)} className="text-blue-600 hover:text-blue-800"><Check className="w-4 h-4" /></button>
                                    <button onClick={() => setEditingTypeCondition(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                                  </div>
                                </div>
                              </td>
                            ) : (
                              <>
                                <td className="px-3 py-2 text-gray-700">{tc.genre ?? <span className="text-gray-300">—</span>}</td>
                                <td className="px-3 py-2 text-gray-700">{tc.spec ?? <span className="text-gray-300">—</span>}</td>
                                <td className="px-3 py-2 text-gray-700">{tc.hinmoku ?? <span className="text-gray-300">—</span>}</td>
                                <td className="px-3 py-2 text-gray-600">{tc.tag1 ?? <span className="text-gray-300">—</span>}</td>
                                <td className="px-3 py-2 text-gray-600">{tc.tag2 ?? <span className="text-gray-300">—</span>}</td>
                                <td className="px-3 py-2">
                                  <div className="flex gap-1">
                                    <button onClick={() => setEditingTypeCondition(tc)} className="p-1 text-gray-400 hover:text-blue-600 rounded"><Pencil className="w-4 h-4" /></button>
                                    <button onClick={() => deleteTypeCondition(tc.id)} className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* ページネーション */}
                  {tcTotalPages > 1 && (
                    <div className="flex items-center justify-between px-1">
                      <p className="text-xs text-gray-400">
                        {tcTotal}件中 {(tcPage - 1) * PAGE_SIZE + 1}〜{Math.min(tcPage * PAGE_SIZE, tcTotal)}件
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { const p = tcPage - 1; setTcPage(p); fetchTypeConditions(tcFilterGenre, tcFilterSpec, tcFilterHinmoku, p) }}
                          disabled={tcPage === 1}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-gray-600 px-2">{tcPage} / {tcTotalPages}</span>
                        <button
                          onClick={() => { const p = tcPage + 1; setTcPage(p); fetchTypeConditions(tcFilterGenre, tcFilterSpec, tcFilterHinmoku, p) }}
                          disabled={tcPage === tcTotalPages}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
