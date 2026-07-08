"use client"
import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Users, FileText, ClipboardList, ListChecks, Mail } from "lucide-react"

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
type CadOption = {
  id: string
  category: string
  value: string
  sort_order: number
}
type MailRecipient = {
  id: string
  email: string
  sort_order: number
}

const OPTION_CATEGORIES = [
  { key: "hinmoku", label: "品目名" },
  { key: "tray", label: "使用トレイ" },
  { key: "degi_spec", label: "デジ仕様" },
  { key: "tray_count", label: "トレイ枚数" },
  { key: "pocket", label: "ポケット" },
]

export default function CadMastersPage() {
  const [activeTab, setActiveTab] = useState<"clients" | "papers" | "contents" | "options" | "mail">("clients")
  const [clients, setClients] = useState<CadClient[]>([])
  const [papers, setPapers] = useState<CadPaper[]>([])
  const [contents, setContents] = useState<CadContent[]>([])
  const [options, setOptions] = useState<CadOption[]>([])
  const [optionCategory, setOptionCategory] = useState(OPTION_CATEGORIES[0].key)
  const [mailRecipients, setMailRecipients] = useState<MailRecipient[]>([])
  const [mailTemplateBody, setMailTemplateBody] = useState("")
  const [mailTemplateSaving, setMailTemplateSaving] = useState(false)
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

  // 入力候補フォーム
  const [showOptionForm, setShowOptionForm] = useState(false)
  const [editOption, setEditOption] = useState<CadOption | null>(null)
  const [optionValue, setOptionValue] = useState("")
  const [optionOrder, setOptionOrder] = useState(0)

  // メール宛先フォーム
  const [showMailRecipientForm, setShowMailRecipientForm] = useState(false)
  const [editMailRecipient, setEditMailRecipient] = useState<MailRecipient | null>(null)
  const [mailRecipientEmail, setMailRecipientEmail] = useState("")
  const [mailRecipientOrder, setMailRecipientOrder] = useState(0)

  const fetchAll = async () => {
    setLoading(true)
    const [cRes, pRes, ctRes, opRes, mrRes, mtRes] = await Promise.all([
      fetch("/api/cad/masters/clients"),
      fetch("/api/cad/masters/papers"),
      fetch("/api/cad/masters/contents"),
      fetch("/api/cad/masters/options"),
      fetch("/api/cad/masters/mail-recipients"),
      fetch("/api/cad/masters/mail-template"),
    ])
    setClients(await cRes.json())
    setPapers(await pRes.json())
    setContents(await ctRes.json())
    setOptions(await opRes.json())
    setMailRecipients(await mrRes.json())
    const template = await mtRes.json()
    setMailTemplateBody(template.body ?? "")
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

  // 入力候補保存
  const saveOption = async () => {
    if (!optionValue.trim()) return
    if (editOption) {
      await fetch(`/api/cad/masters/options/${editOption.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: optionCategory, value: optionValue, sort_order: optionOrder }),
      })
    } else {
      await fetch("/api/cad/masters/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: optionCategory, value: optionValue, sort_order: optionOrder }),
      })
    }
    setShowOptionForm(false); setEditOption(null)
    setOptionValue(""); setOptionOrder(0)
    fetchAll()
  }
  const deleteOption = async (id: string) => {
    if (!confirm("この入力候補を削除しますか？")) return
    await fetch(`/api/cad/masters/options/${id}`, { method: "DELETE" })
    fetchAll()
  }
  const startEditOption = (o: CadOption) => {
    setEditOption(o); setOptionValue(o.value)
    setOptionOrder(o.sort_order); setShowOptionForm(true)
  }

  // メール宛先保存
  const saveMailRecipient = async () => {
    if (!mailRecipientEmail.trim()) return
    if (editMailRecipient) {
      await fetch(`/api/cad/masters/mail-recipients/${editMailRecipient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mailRecipientEmail, sort_order: mailRecipientOrder }),
      })
    } else {
      await fetch("/api/cad/masters/mail-recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mailRecipientEmail, sort_order: mailRecipientOrder }),
      })
    }
    setShowMailRecipientForm(false); setEditMailRecipient(null)
    setMailRecipientEmail(""); setMailRecipientOrder(0)
    fetchAll()
  }
  const deleteMailRecipient = async (id: string) => {
    if (!confirm("この宛先を削除しますか？")) return
    await fetch(`/api/cad/masters/mail-recipients/${id}`, { method: "DELETE" })
    fetchAll()
  }
  const startEditMailRecipient = (r: MailRecipient) => {
    setEditMailRecipient(r); setMailRecipientEmail(r.email)
    setMailRecipientOrder(r.sort_order); setShowMailRecipientForm(true)
  }
  const saveMailTemplate = async () => {
    setMailTemplateSaving(true)
    await fetch("/api/cad/masters/mail-template", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: mailTemplateBody }),
    })
    setMailTemplateSaving(false)
  }

  const filteredOptions = options.filter(o => o.category === optionCategory)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-xl font-bold text-gray-900">CAD/台紙マスタ管理</h1>
      </div>
      {/* タブ */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 flex-wrap">
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
        <button
          onClick={() => setActiveTab("options")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${activeTab === "options" ? "border-lime-600 text-lime-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          <ListChecks className="w-4 h-4" /> 入力候補
        </button>
        <button
          onClick={() => setActiveTab("mail")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${activeTab === "mail" ? "border-lime-600 text-lime-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          <Mail className="w-4 h-4" /> メール設定
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
      ) : activeTab === "contents" ? (
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
      ) : activeTab === "options" ? (
        <div>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {OPTION_CATEGORIES.map(oc => (
              <button
                key={oc.key}
                onClick={() => { setOptionCategory(oc.key); setShowOptionForm(false); setEditOption(null) }}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  optionCategory === oc.key ? "bg-lime-700 text-white border-transparent font-semibold" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                {oc.label}
              </button>
            ))}
          </div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { setShowOptionForm(true); setEditOption(null); setOptionValue(""); setOptionOrder(0) }}
              className="flex items-center gap-1 px-3 py-2 bg-lime-700 text-white text-sm rounded-lg hover:bg-lime-800"
            >
              <Plus className="w-4 h-4" /> 候補を追加
            </button>
          </div>
          {showOptionForm && (
            <div className="mb-4 p-4 bg-lime-50 border border-lime-200 rounded-xl">
              <p className="text-sm font-medium text-lime-800 mb-3">
                {editOption ? "候補を編集" : "候補を追加"}（{OPTION_CATEGORIES.find(o => o.key === optionCategory)?.label}）
              </p>
              <div className="flex gap-2 flex-wrap">
                <input autoComplete="off" className="flex-1 min-w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="値" value={optionValue} onChange={e => setOptionValue(e.target.value)} />
                <input autoComplete="off" type="number" className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="順序" value={optionOrder} onChange={e => setOptionOrder(Number(e.target.value))} />
                <button onClick={saveOption} className="px-4 py-2 bg-lime-700 text-white text-sm rounded-lg hover:bg-lime-800">保存</button>
                <button onClick={() => { setShowOptionForm(false); setEditOption(null) }} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">キャンセル</button>
              </div>
            </div>
          )}
          {filteredOptions.length === 0 ? (
            <p className="text-sm text-gray-400">候補がまだ登録されていません。</p>
          ) : (
            <div className="space-y-2">
              {filteredOptions.map(o => (
                <div key={o.id} className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm">
                  <ListChecks className="w-4 h-4 text-lime-500 flex-shrink-0" />
                  <span className="flex-1 font-medium text-gray-900">{o.value}</span>
                  <span className="text-xs text-gray-300">#{o.sort_order}</span>
                  <button onClick={() => startEditOption(o)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => deleteOption(o.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-1">依頼メール送信先（To）</h2>
            <p className="text-xs text-gray-400 mb-3">CAD依頼のメール送信時、固定の宛先として使用されます。</p>
            <div className="flex justify-end mb-3">
              <button
                onClick={() => { setShowMailRecipientForm(true); setEditMailRecipient(null); setMailRecipientEmail(""); setMailRecipientOrder(0) }}
                className="flex items-center gap-1 px-3 py-2 bg-lime-700 text-white text-sm rounded-lg hover:bg-lime-800"
              >
                <Plus className="w-4 h-4" /> 宛先を追加
              </button>
            </div>
            {showMailRecipientForm && (
              <div className="mb-3 p-4 bg-lime-50 border border-lime-200 rounded-xl">
                <p className="text-sm font-medium text-lime-800 mb-3">{editMailRecipient ? "宛先を編集" : "宛先を追加"}</p>
                <div className="flex gap-2 flex-wrap">
                  <input autoComplete="off" className="flex-1 min-w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="メールアドレス" value={mailRecipientEmail} onChange={e => setMailRecipientEmail(e.target.value)} />
                  <input autoComplete="off" type="number" className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="順序" value={mailRecipientOrder} onChange={e => setMailRecipientOrder(Number(e.target.value))} />
                  <button onClick={saveMailRecipient} className="px-4 py-2 bg-lime-700 text-white text-sm rounded-lg hover:bg-lime-800">保存</button>
                  <button onClick={() => { setShowMailRecipientForm(false); setEditMailRecipient(null) }} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">キャンセル</button>
                </div>
              </div>
            )}
            {mailRecipients.length === 0 ? (
              <p className="text-sm text-gray-400">宛先がまだ登録されていません。</p>
            ) : (
              <div className="space-y-2">
                {mailRecipients.map(r => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm">
                    <Mail className="w-4 h-4 text-lime-500 flex-shrink-0" />
                    <span className="flex-1 font-medium text-gray-900">{r.email}</span>
                    <span className="text-xs text-gray-300">#{r.sort_order}</span>
                    <button onClick={() => startEditMailRecipient(r)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteMailRecipient(r.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-1">本文テンプレート</h2>
            <p className="text-xs text-gray-400 mb-3">依頼メール送信時、初期値として入力されます（送信前に編集可能）。</p>
            <textarea
              value={mailTemplateBody}
              onChange={e => setMailTemplateBody(e.target.value)}
              rows={12}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono resize-none"
              placeholder="本文テンプレートを入力してください"
            />
            <div className="flex justify-end mt-2">
              <button onClick={saveMailTemplate} disabled={mailTemplateSaving} className="px-4 py-2 bg-lime-700 text-white text-sm rounded-lg hover:bg-lime-800 disabled:opacity-50">
                {mailTemplateSaving ? "保存中..." : "テンプレートを保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
