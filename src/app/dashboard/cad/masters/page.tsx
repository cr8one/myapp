"use client"
import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Users, FileText, ClipboardList } from "lucide-react"

type CadClient = {
  id: string
  name: string
  short_name: string | null
  sort_order: number
}
type CadPaper = {
  id: string
  name: string
  width: number | null
  height: number | null
  sort_order: number
}
type CadContent = {
  id: string
  name: string
  sort_order: number
}

export default function CadMastersPage() {
  const [activeTab, setActiveTab] = useState<"clients" | "papers" | "contents">("clients")
  const [clients, setClients] = useState<CadClient[]>([])
  const [papers, setPapers] = useState<CadPaper[]>([])
  const [contents, setContents] = useState<CadContent[]>([])
  const [loading, setLoading] = useState(true)

  // クライアントフォーム
  const [showClientForm, setShowClientForm] = useState(false)
  const [editClient, setEditClient] = useState<CadClient | null>(null)
  const [clientName, setClientName] = useState("")
  const [clientShortName, setClientShortName] = useState("")
  const [clientOrder, setClientOrder] = useState(0)

  // 用紙フォーム
  const [showPaperForm, setShowPaperForm] = useState(false)
  const [editPaper, setEditPaper] = useState<CadPaper | null>(null)
  const [paperName, setPaperName] = useState("")
  const [paperWidth, setPaperWidth] = useState("")
  const [paperHeight, setPaperHeight] = useState("")
  const [paperOrder, setPaperOrder] = useState(0)

  // 依頼内容フォーム
  const [showContentForm, setShowContentForm] = useState(false)
  const [editContent, setEditContent] = useState<CadContent | null>(null)
  const [contentName, setContentName] = useState("")
  const [contentOrder, setContentOrder] = useState(0)

  const fetchAll = async () => {
    setLoading(true)
    const [cRes, pRes, ctRes] = await Promise.all([
      fetch("/api/cad/masters/clients"),
      fetch("/api/cad/masters/papers"),
      fetch("/api/cad/masters/contents"),
    ])
    setClients(await cRes.json())
    setPapers(await pRes.json())
    setContents(await ctRes.json())
    setLoading(false)
  }
  useEffect(() => { fetchAll() }, [])

  // クライアント保存
  const saveClient = async () => {
    if (!clientName.trim()) return
    if (editClient) {
      await fetch(`/api/cad/masters/clients/${editClient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clientName, short_name: clientShortName || null, sort_order: clientOrder }),
      })
    } else {
      await fetch("/api/cad/masters/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clientName, short_name: clientShortName || null, sort_order: clientOrder }),
      })
    }
    setShowClientForm(false); setEditClient(null)
    setClientName(""); setClientShortName(""); setClientOrder(0)
    fetchAll()
  }
  const deleteClient = async (id: string) => {
    if (!confirm("このクライアントを削除しますか？")) return
    await fetch(`/api/cad/masters/clients/${id}`, { method: "DELETE" })
    fetchAll()
  }
  const startEditClient = (c: CadClient) => {
    setEditClient(c); setClientName(c.name)
    setClientShortName(c.short_name ?? ""); setClientOrder(c.sort_order)
    setShowClientForm(true)
  }

  // 用紙保存
  const savePaper = async () => {
    if (!paperName.trim()) return
    const data = {
      name: paperName,
      width: paperWidth ? Number(paperWidth) : null,
      height: paperHeight ? Number(paperHeight) : null,
      sort_order: paperOrder,
    }
    if (editPaper) {
      await fetch(`/api/cad/masters/papers/${editPaper.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    } else {
      await fetch("/api/cad/masters/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    }
    setShowPaperForm(false); setEditPaper(null)
    setPaperName(""); setPaperWidth(""); setPaperHeight(""); setPaperOrder(0)
    fetchAll()
  }
  const deletePaper = async (id: string) => {
    if (!confirm("この用紙を削除しますか？")) return
    await fetch(`/api/cad/masters/papers/${id}`, { method: "DELETE" })
    fetchAll()
  }
  const startEditPaper = (p: CadPaper) => {
    setEditPaper(p); setPaperName(p.name)
    setPaperWidth(p.width?.toString() ?? ""); setPaperHeight(p.height?.toString() ?? "")
    setPaperOrder(p.sort_order); setShowPaperForm(true)
  }

  // 依頼内容保存
  const saveContent = async () => {
    if (!contentName.trim()) return
    if (editContent) {
      await fetch(`/api/cad/masters/contents/${editContent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: contentName, sort_order: contentOrder }),
      })
    } else {
      await fetch("/api/cad/masters/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: contentName, sort_order: contentOrder }),
      })
    }
    setShowContentForm(false); setEditContent(null)
    setContentName(""); setContentOrder(0)
    fetchAll()
  }
  const deleteContent = async (id: string) => {
    if (!confirm("この依頼内容を削除しますか？")) return
    await fetch(`/api/cad/masters/contents/${id}`, { method: "DELETE" })
    fetchAll()
  }
  const startEditContent = (c: CadContent) => {
    setEditContent(c); setContentName(c.name)
    setContentOrder(c.sort_order); setShowContentForm(true)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-xl font-bold text-gray-900">CAD/台紙マスタ管理</h1>
      </div>
      {/* タブ */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("clients")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${activeTab === "clients" ? "border-lime-600 text-lime-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          <Users className="w-4 h-4" /> クライアント
        </button>
        <button
          onClick={() => setActiveTab("papers")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${activeTab === "papers" ? "border-lime-600 text-lime-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          <FileText className="w-4 h-4" /> 用紙
        </button>
        <button
          onClick={() => setActiveTab("contents")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${activeTab === "contents" ? "border-lime-600 text-lime-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          <ClipboardList className="w-4 h-4" /> 依頼内容
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : activeTab === "clients" ? (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { setShowClientForm(true); setEditClient(null); setClientName(""); setClientShortName(""); setClientOrder(0) }}
              className="flex items-center gap-1 px-3 py-2 bg-lime-700 text-white text-sm rounded-lg hover:bg-lime-800"
            >
              <Plus className="w-4 h-4" /> クライアント追加
            </button>
          </div>
          {showClientForm && (
            <div className="mb-4 p-4 bg-lime-50 border border-lime-200 rounded-xl">
              <p className="text-sm font-medium text-lime-800 mb-3">{editClient ? "クライアントを編集" : "クライアントを追加"}</p>
              <div className="flex gap-2 flex-wrap">
                <input autoComplete="off" className="flex-1 min-w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="クライアント名" value={clientName} onChange={e => setClientName(e.target.value)} />
                <input autoComplete="off" className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="略称" value={clientShortName} onChange={e => setClientShortName(e.target.value)} />
                <input autoComplete="off" type="number" className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="順序" value={clientOrder} onChange={e => setClientOrder(Number(e.target.value))} />
                <button onClick={saveClient} className="px-4 py-2 bg-lime-700 text-white text-sm rounded-lg hover:bg-lime-800">保存</button>
                <button onClick={() => { setShowClientForm(false); setEditClient(null) }} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">キャンセル</button>
              </div>
            </div>
          )}
          {clients.length === 0 ? (
            <p className="text-sm text-gray-400">クライアントがまだ登録されていません。</p>
          ) : (
            <div className="space-y-2">
              {clients.map(c => (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm">
                  <Users className="w-4 h-4 text-lime-500 flex-shrink-0" />
                  <span className="flex-1 font-medium text-gray-900">{c.name}</span>
                  {c.short_name && <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{c.short_name}</span>}
                  <span className="text-xs text-gray-300">#{c.sort_order}</span>
                  <button onClick={() => startEditClient(c)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => deleteClient(c.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "papers" ? (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { setShowPaperForm(true); setEditPaper(null); setPaperName(""); setPaperWidth(""); setPaperHeight(""); setPaperOrder(0) }}
              className="flex items-center gap-1 px-3 py-2 bg-lime-700 text-white text-sm rounded-lg hover:bg-lime-800"
            >
              <Plus className="w-4 h-4" /> 用紙追加
            </button>
          </div>
          {showPaperForm && (
            <div className="mb-4 p-4 bg-lime-50 border border-lime-200 rounded-xl">
              <p className="text-sm font-medium text-lime-800 mb-3">{editPaper ? "用紙を編集" : "用紙を追加"}</p>
              <div className="flex gap-2 flex-wrap">
                <input autoComplete="off" className="flex-1 min-w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="用紙名（例: A4, B5）" value={paperName} onChange={e => setPaperName(e.target.value)} />
                <input autoComplete="off" type="number" className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="幅(mm)" value={paperWidth} onChange={e => setPaperWidth(e.target.value)} />
                <input autoComplete="off" type="number" className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="高さ(mm)" value={paperHeight} onChange={e => setPaperHeight(e.target.value)} />
                <input autoComplete="off" type="number" className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="順序" value={paperOrder} onChange={e => setPaperOrder(Number(e.target.value))} />
                <button onClick={savePaper} className="px-4 py-2 bg-lime-700 text-white text-sm rounded-lg hover:bg-lime-800">保存</button>
                <button onClick={() => { setShowPaperForm(false); setEditPaper(null) }} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">キャンセル</button>
              </div>
            </div>
          )}
          {papers.length === 0 ? (
            <p className="text-sm text-gray-400">用紙がまだ登録されていません。</p>
          ) : (
            <div className="space-y-2">
              {papers.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm">
                  <FileText className="w-4 h-4 text-lime-500 flex-shrink-0" />
                  <span className="flex-1 font-medium text-gray-900">{p.name}</span>
                  {(p.width || p.height) && (
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                      {p.width ?? "?"}×{p.height ?? "?"}mm
                    </span>
                  )}
                  <span className="text-xs text-gray-300">#{p.sort_order}</span>
                  <button onClick={() => startEditPaper(p)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => deletePaper(p.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { setShowContentForm(true); setEditContent(null); setContentName(""); setContentOrder(0) }}
              className="flex items-center gap-1 px-3 py-2 bg-lime-700 text-white text-sm rounded-lg hover:bg-lime-800"
            >
              <Plus className="w-4 h-4" /> 依頼内容追加
            </button>
          </div>
          {showContentForm && (
            <div className="mb-4 p-4 bg-lime-50 border border-lime-200 rounded-xl">
              <p className="text-sm font-medium text-lime-800 mb-3">{editContent ? "依頼内容を編集" : "依頼内容を追加"}</p>
              <div className="flex gap-2 flex-wrap">
                <input autoComplete="off" className="flex-1 min-w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="依頼内容（例: 校正カット）" value={contentName} onChange={e => setContentName(e.target.value)} />
                <input autoComplete="off" type="number" className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="順序" value={contentOrder} onChange={e => setContentOrder(Number(e.target.value))} />
                <button onClick={saveContent} className="px-4 py-2 bg-lime-700 text-white text-sm rounded-lg hover:bg-lime-800">保存</button>
                <button onClick={() => { setShowContentForm(false); setEditContent(null) }} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">キャンセル</button>
              </div>
            </div>
          )}
          {contents.length === 0 ? (
            <p className="text-sm text-gray-400">依頼内容がまだ登録されていません。</p>
          ) : (
            <div className="space-y-2">
              {contents.map(c => (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm">
                  <ClipboardList className="w-4 h-4 text-lime-500 flex-shrink-0" />
                  <span className="flex-1 font-medium text-gray-900">{c.name}</span>
                  <span className="text-xs text-gray-300">#{c.sort_order}</span>
                  <button onClick={() => startEditContent(c)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => deleteContent(c.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
