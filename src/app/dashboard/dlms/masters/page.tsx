"use client"
import { useEffect, useState, useCallback } from "react"
import { Plus, Pencil, Trash2, X, Check, AlertCircle } from "lucide-react"

type Format = { id: number; name: string; width: number; height: number; unit: string; note?: string }
type Part = { id: number; name: string; width: number; height: number; shape: string; note?: string }
type Note = { id: number; name: string; content: string; fontSize: number; color: string; fontWeight: string }
type Tab = "formats" | "parts" | "notes"

const COLORS = ["#1a1a1a", "#e24b4a", "#378add", "#639922", "#ba7517", "#888780"]
const emptyFormat = { name: "", width: 0, height: 0, unit: "mm", note: "" }
const emptyPart = { name: "", width: 0, height: 0, shape: "rect", note: "" }
const emptyNote = { name: "", content: "", fontSize: 12, color: "#1a1a1a", fontWeight: "normal" }

export default function DlmsMastersPage() {
  const [tab, setTab] = useState<Tab>("formats")
  const [formats, setFormats] = useState<Format[]>([])
  const [parts, setParts] = useState<Part[]>([])
  const [notes, setNotes] = useState<Note[]>([])
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

  const fetchAll = useCallback(async () => {
    setFetching(true)
    const [f, p, n] = await Promise.all([
      fetch("/api/dlms/formats").then(r => r.json()),
      fetch("/api/dlms/parts").then(r => r.json()),
      fetch("/api/dlms/notes").then(r => r.json()),
    ])
    setFormats(Array.isArray(f) ? f : [])
    setParts(Array.isArray(p) ? p : [])
    setNotes(Array.isArray(n) ? n : [])
    setFetching(false)
  }, [])
  useEffect(() => { fetchAll() }, [fetchAll])

  // 判型
  const saveFormat = async () => {
    if (!newFormat.name.trim()) return
    await fetch("/api/dlms/formats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newFormat) })
    setNewFormat(emptyFormat); setAddingFormat(false); fetchAll()
  }
  const updateFormat = async (f: Format) => {
    await fetch(`/api/dlms/formats/${f.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) })
    setEditingFormat(null); fetchAll()
  }
  const deleteFormat = async (id: number) => {
    if (!confirm("削除しますか？")) return
    await fetch(`/api/dlms/formats/${id}`, { method: "DELETE" }); fetchAll()
  }

  // パーツ
  const savePart = async () => {
    if (!newPart.name.trim()) return
    await fetch("/api/dlms/parts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newPart) })
    setNewPart(emptyPart); setAddingPart(false); fetchAll()
  }
  const updatePart = async (p: Part) => {
    await fetch(`/api/dlms/parts/${p.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) })
    setEditingPart(null); fetchAll()
  }
  const deletePart = async (id: number) => {
    if (!confirm("削除しますか？")) return
    await fetch(`/api/dlms/parts/${id}`, { method: "DELETE" }); fetchAll()
  }

  // 注記
  const saveNote = async () => {
    if (!newNote.name.trim()) return
    await fetch("/api/dlms/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newNote) })
    setNewNote(emptyNote); setAddingNote(false); fetchAll()
  }
  const updateNote = async (n: Note) => {
    await fetch(`/api/dlms/notes/${n.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(n) })
    setEditingNote(null); fetchAll()
  }
  const deleteNote = async (id: number) => {
    if (!confirm("削除しますか？")) return
    await fetch(`/api/dlms/notes/${id}`, { method: "DELETE" }); fetchAll()
  }

  const shapeLabel = (s: string) => ({ rect: "矩形", circle: "円", polygon: "多角形" }[s] ?? s)

  const tabs: [Tab, string, number][] = [
    ["formats", "判型マスタ", formats.length],
    ["parts", "パーツマスタ", parts.length],
    ["notes", "注記マスタ", notes.length],
  ]

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">DLMSマスタ管理</h1>
        <p className="text-xs text-gray-400 mt-0.5">判型・パーツ・注記の管理</p>
      </div>
      <div className="bg-white border-b px-6">
        <div className="flex gap-6">
          {tabs.map(([key, label, count]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              {label}
              <span className="ml-2 text-xs text-gray-400">{count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 py-6 max-w-3xl">
        {fetching ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white rounded-lg animate-pulse border border-gray-100" />)}
          </div>
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
                    <div className="flex items-center gap-2">
                      <input type="text" value={newFormat.name} onChange={e => setNewFormat(f => ({ ...f, name: e.target.value }))}
                        placeholder="判型名（例：A4タテ）" autoFocus
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <select value={newFormat.unit} onChange={e => setNewFormat(f => ({ ...f, unit: e.target.value }))}
                        className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="mm">mm</option>
                        <option value="px">px</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">幅</span>
                      <input type="number" value={newFormat.width} onChange={e => setNewFormat(f => ({ ...f, width: Number(e.target.value) }))}
                        className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <span className="text-xs text-gray-500">高さ</span>
                      <input type="number" value={newFormat.height} onChange={e => setNewFormat(f => ({ ...f, height: Number(e.target.value) }))}
                        className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="text" value={newFormat.note ?? ""} onChange={e => setNewFormat(f => ({ ...f, note: e.target.value }))}
                        placeholder="備考" className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                          <>
                            <input type="text" value={editingFormat.name} onChange={e => setEditingFormat({ ...editingFormat, name: e.target.value })}
                              autoFocus className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <select value={editingFormat.unit} onChange={e => setEditingFormat({ ...editingFormat, unit: e.target.value })}
                              className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none">
                              <option value="mm">mm</option>
                              <option value="px">px</option>
                            </select>
                            <input type="number" value={editingFormat.width} onChange={e => setEditingFormat({ ...editingFormat, width: Number(e.target.value) })}
                              className="w-20 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none" />
                            <input type="number" value={editingFormat.height} onChange={e => setEditingFormat({ ...editingFormat, height: Number(e.target.value) })}
                              className="w-20 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none" />
                            <button onClick={() => updateFormat(editingFormat)} className="text-blue-600 hover:text-blue-800"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingFormat(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm font-medium text-gray-800">{f.name}</span>
                            <span className="text-xs text-gray-500">{f.width} × {f.height} {f.unit}</span>
                            {f.note && <span className="text-xs text-gray-400">{f.note}</span>}
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
                    <div className="flex items-center gap-2">
                      <input type="text" value={newPart.name} onChange={e => setNewPart(p => ({ ...p, name: e.target.value }))}
                        placeholder="パーツ名（例：スリーブA）" autoFocus
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <select value={newPart.shape} onChange={e => setNewPart(p => ({ ...p, shape: e.target.value }))}
                        className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="rect">矩形</option>
                        <option value="circle">円</option>
                        <option value="polygon">多角形</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">幅(mm)</span>
                      <input type="number" value={newPart.width} onChange={e => setNewPart(p => ({ ...p, width: Number(e.target.value) }))}
                        className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <span className="text-xs text-gray-500">高さ(mm)</span>
                      <input type="number" value={newPart.height} onChange={e => setNewPart(p => ({ ...p, height: Number(e.target.value) }))}
                        className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="text" value={newPart.note ?? ""} onChange={e => setNewPart(p => ({ ...p, note: e.target.value }))}
                        placeholder="備考" className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                          <>
                            <input type="text" value={editingPart.name} onChange={e => setEditingPart({ ...editingPart, name: e.target.value })}
                              autoFocus className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <select value={editingPart.shape} onChange={e => setEditingPart({ ...editingPart, shape: e.target.value })}
                              className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none">
                              <option value="rect">矩形</option>
                              <option value="circle">円</option>
                              <option value="polygon">多角形</option>
                            </select>
                            <input type="number" value={editingPart.width} onChange={e => setEditingPart({ ...editingPart, width: Number(e.target.value) })}
                              className="w-20 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none" />
                            <input type="number" value={editingPart.height} onChange={e => setEditingPart({ ...editingPart, height: Number(e.target.value) })}
                              className="w-20 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none" />
                            <button onClick={() => updatePart(editingPart)} className="text-blue-600 hover:text-blue-800"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingPart(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm font-medium text-gray-800">{p.name}</span>
                            <span className="text-xs text-gray-500">{shapeLabel(p.shape)}</span>
                            <span className="text-xs text-gray-500">{p.width} × {p.height} mm</span>
                            {p.note && <span className="text-xs text-gray-400">{p.note}</span>}
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
                    <input type="text" value={newNote.name} onChange={e => setNewNote(n => ({ ...n, name: e.target.value }))}
                      placeholder="注記名（例：折り線注意書き）" autoFocus
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <textarea rows={2} value={newNote.content} onChange={e => setNewNote(n => ({ ...n, content: e.target.value }))}
                      placeholder="テキスト内容"
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">サイズ</span>
                        <input type="number" min="8" max="72" value={newNote.fontSize} onChange={e => setNewNote(n => ({ ...n, fontSize: Number(e.target.value) }))}
                          className="w-16 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none" />
                        <span className="text-xs text-gray-400">px</span>
                      </div>
                      <select value={newNote.fontWeight} onChange={e => setNewNote(n => ({ ...n, fontWeight: e.target.value }))}
                        className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none">
                        <option value="normal">標準</option>
                        <option value="bold">太字</option>
                      </select>
                      <div className="flex items-center gap-1.5">
                        {COLORS.map(c => (
                          <button key={c} onClick={() => setNewNote(n => ({ ...n, color: c }))}
                            style={{ background: c, width: 18, height: 18, borderRadius: "50%", border: newNote.color === c ? "2px solid #378add" : "2px solid transparent" }} />
                        ))}
                        <input type="color" value={newNote.color} onChange={e => setNewNote(n => ({ ...n, color: e.target.value }))}
                          className="w-7 h-7 rounded cursor-pointer border" />
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        <button onClick={saveNote} className="text-blue-600 hover:text-blue-800"><Check className="w-5 h-5" /></button>
                        <button onClick={() => { setAddingNote(false); setNewNote(emptyNote) }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                      </div>
                    </div>
                    {newNote.content && (
                      <div className="border rounded px-3 py-2 bg-white">
                        <span style={{ fontSize: newNote.fontSize, color: newNote.color, fontWeight: newNote.fontWeight, whiteSpace: "pre-wrap" }}>{newNote.content}</span>
                      </div>
                    )}
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
                      <div key={n.id} className="px-4 py-3">
                        {editingNote?.id === n.id ? (
                          <div className="space-y-2">
                            <input type="text" value={editingNote.name} onChange={e => setEditingNote({ ...editingNote, name: e.target.value })}
                              autoFocus className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <textarea rows={2} value={editingNote.content} onChange={e => setEditingNote({ ...editingNote, content: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <div className="flex items-center gap-3 flex-wrap">
                              <input type="number" min="8" max="72" value={editingNote.fontSize} onChange={e => setEditingNote({ ...editingNote, fontSize: Number(e.target.value) })}
                                className="w-16 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none" />
                              <select value={editingNote.fontWeight} onChange={e => setEditingNote({ ...editingNote, fontWeight: e.target.value })}
                                className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none">
                                <option value="normal">標準</option>
                                <option value="bold">太字</option>
                              </select>
                              <div className="flex items-center gap-1.5">
                                {COLORS.map(c => (
                                  <button key={c} onClick={() => setEditingNote({ ...editingNote, color: c })}
                                    style={{ background: c, width: 18, height: 18, borderRadius: "50%", border: editingNote.color === c ? "2px solid #378add" : "2px solid transparent" }} />
                                ))}
                                <input type="color" value={editingNote.color} onChange={e => setEditingNote({ ...editingNote, color: e.target.value })}
                                  className="w-7 h-7 rounded cursor-pointer border" />
                              </div>
                              <div className="flex gap-2 ml-auto">
                                <button onClick={() => setEditingNote(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                                <button onClick={() => updateNote(editingNote)} className="text-blue-600 hover:text-blue-800"><Check className="w-4 h-4" /></button>
                              </div>
                            </div>
                            {editingNote.content && (
                              <div className="border rounded px-3 py-2 bg-white">
                                <span style={{ fontSize: editingNote.fontSize, color: editingNote.color, fontWeight: editingNote.fontWeight, whiteSpace: "pre-wrap" }}>{editingNote.content}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{n.name}</p>
                              <p style={{ fontSize: Math.min(n.fontSize, 13), color: n.color, fontWeight: n.fontWeight, whiteSpace: "pre-wrap" }} className="mt-0.5 leading-tight">
                                {n.content.length > 40 ? n.content.slice(0, 40) + "…" : n.content}
                              </p>
                            </div>
                            <span className="text-xs text-gray-400">{n.fontSize}px</span>
                            <button onClick={() => setEditingNote(n)} className="text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => deleteNote(n.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
