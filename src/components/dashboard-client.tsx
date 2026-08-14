"use client"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Gauge, ScrollText, JapaneseYen, Handshake, Settings, ShieldCheck,
  Plus, Pencil, Trash2, Megaphone, Wrench, Tag,
  Train, BookOpen, FileText, CalendarDays, PenTool, Monitor, BookUser, ClipboardList
} from "lucide-react"

type Announcement = {
  id: string; title: string; content: string; category: string
  publishedAt: string; createdBy: { name: string | null; email: string }
}
type Permission = {
  specView: boolean; estimateView: boolean; eappView: boolean; travelView: boolean
  sopView: boolean; reportView: boolean; bpmsView: boolean; dlmsView: boolean
  dppView: boolean; ssssView: boolean; mastersView: boolean; cadView: boolean; terminalView: boolean
  manufacturingView: boolean; trayView: boolean; addressBookView: boolean
} | null
type Props = {
  userName: string; isAdmin: boolean
  announcements: Announcement[]; permission: Permission
}

const CATEGORIES = ["メンテナンス", "リリース", "お知らせ"]
const CATEGORY_STYLES: Record<string, { color: string; icon: React.ReactNode }> = {
  "メンテナンス": { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: <Wrench className="w-3 h-3" /> },
  "リリース":     { color: "bg-blue-100 text-blue-700 border-blue-200",   icon: <Tag className="w-3 h-3" /> },
  "お知らせ":     { color: "bg-green-100 text-green-700 border-green-200", icon: <Megaphone className="w-3 h-3" /> },
}

function SsssIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="5" width="14" height="9" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M16 11 L16 14 Q16 14 13.5 14 L16 11Z" fill="white" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
      <line x1="5" y1="8.5" x2="12" y2="8.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="5" y1="11" x2="10" y2="11" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  )
}
function DlmsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.1"/>
      <rect x="6" y="9" width="12" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.1" fill="currentColor" fillOpacity="0.22"/>
      <line x1="12" y1="7" x2="12" y2="20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M10.5 19 L12 21.5 L13.5 19" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.3"/>
    </svg>
  )
}
function EApplicationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="13" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.07"/>
      <line x1="6" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="6" y1="11" x2="13" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="6" y1="14" x2="10" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M16 14 L21 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M17 9 L21 9 L21 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function TrayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 14 L6 6 Q6.4 5 7.5 5 L16.5 5 Q17.6 5 18 6 L21 14" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="currentColor" fillOpacity="0.08"/>
      <rect x="2.5" y="14" width="19" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.15"/>
      <line x1="9" y1="16.5" x2="15" y2="16.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

const VIEW_FLAG_MAP: Record<string, keyof NonNullable<Permission>> = {
  spec: "specView", estimate: "estimateView", eapp: "eappView", addressbook: "addressBookView",
  travel: "travelView", sop: "sopView", report: "reportView",
  bpms: "bpmsView", dlms: "dlmsView", dpp: "dppView",
  ssss: "ssssView", terminal: "terminalView", masters: "mastersView", cad: "cadView",
  manufacturing: "manufacturingView", tray: "trayView",
}

const SERVICE_CARDS = [
  { label: "仕様書",      href: "/dashboard/products",  icon: "spec",     desc: "仕様一覧・パーツ一覧",          color: "text-indigo-600 bg-indigo-50" },
  { label: "見積書",      href: "/dashboard/estimates", icon: "estimate", desc: "見積一覧",                      color: "text-emerald-600 bg-emerald-50" },
  { label: "電子申請",    href: "/dashboard/eapp",      icon: "eapp",     desc: "得意先・納品先・仕入先・用紙",   color: "text-sky-600 bg-sky-50" },
  { label: "交通費精算",  href: "/dashboard/travel",    icon: "travel",   desc: "交通費の申請・精算",              color: "text-teal-600 bg-teal-50" },
  { label: "作業標準書",  href: "/dashboard/sop",       icon: "sop",      desc: "作業手順・標準書管理",            color: "text-cyan-600 bg-cyan-50" },
  { label: "業務報告書",  href: "/dashboard/report",    icon: "report",   desc: "日報・業務報告管理",              color: "text-purple-600 bg-purple-50" },
  { label: "住所録",      href: "/dashboard/address-book", icon: "addressbook", desc: "取引先・連絡先管理",          color: "text-amber-600 bg-amber-50" },
  { label: "製造依頼書",  href: "/dashboard/manufacturing-request", icon: "manufacturing", desc: "製造依頼の作成・管理",     color: "text-fuchsia-600 bg-fuchsia-50" },
  { label: "トレイ管理",  href: "/dashboard/tray",      icon: "tray",     desc: "トレイの在庫・使用管理",          color: "text-emerald-600 bg-emerald-50" },
  { label: "BPMS",        href: "/dashboard/bpms",      icon: "bpms",     desc: "会社・案件・展示会管理",          color: "text-violet-600 bg-violet-50" },
  { label: "CAD/台紙",    href: "/dashboard/cad",       icon: "cad",      desc: "CAD・DXF・台紙データ管理",        color: "text-lime-600 bg-lime-50" },
  { label: "抜き型/図面", href: "/dashboard/dlms",      icon: "dlms",     desc: "抜き型・図面管理",                color: "text-orange-600 bg-orange-50" },
  { label: "DPP進行管理", href: "/dashboard/dpp",       icon: "dpp",      desc: "DPP スケジュール管理",            color: "text-pink-600 bg-pink-50" },
  { label: "サンプルシール", href: "/dashboard/ssss",   icon: "ssss",     desc: "支給管理・送り状",                color: "text-yellow-600 bg-yellow-50" },
  { label: "端末管理",    href: "/dashboard/terminal",  icon: "terminal", desc: "端末・IP・ソフトウェア管理",      color: "text-slate-600 bg-slate-50" },
  { label: "マスタ管理",  href: "/dashboard/masters",   icon: "masters",  desc: "ユーザー・PRINSERマスタ",         color: "text-gray-600 bg-gray-100" },
  { label: "システム管理", href: "/dashboard/system",   icon: "system",   desc: "開発記録・ログ管理",              color: "text-rose-600 bg-rose-50" },
]

function ServiceIcon({ icon, className }: { icon: string; className?: string }) {
  if (icon === "spec")     return <ScrollText className={className} />
  if (icon === "estimate") return <JapaneseYen className={className} />
  if (icon === "eapp")     return <EApplicationIcon className={className} />
  if (icon === "travel")   return <Train className={className} />
  if (icon === "sop")      return <BookOpen className={className} />
  if (icon === "report")   return <FileText className={className} />
  if (icon === "bpms")     return <Handshake className={className} />
  if (icon === "addressbook") return <BookUser className={className} />
  if (icon === "cad")      return <PenTool className={className} />
  if (icon === "manufacturing") return <ClipboardList className={className} />
  if (icon === "tray")     return <TrayIcon className={className} />
  if (icon === "dlms")     return <DlmsIcon className={className} />
  if (icon === "dpp")      return <CalendarDays className={className} />
  if (icon === "ssss")     return <SsssIcon className={className} />
  if (icon === "terminal") return <Monitor className={className} />
  if (icon === "masters")  return <Settings className={className} />
  if (icon === "system")   return <ShieldCheck className={className} />
  return null
}

type FormData = { title: string; content: string; category: string; publishedAt: string }
const emptyForm: FormData = { title: "", content: "", category: "", publishedAt: "" }

export default function DashboardClient({ userName, isAdmin, announcements: initial, permission }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initial)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Announcement | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null)

  const canView = (icon: string): boolean => {
    if (isAdmin) return true
    if (icon === "system") return false
    const key = VIEW_FLAG_MAP[icon]
    if (!key) return true
    if (!permission) return true
    return permission[key]
  }

  const fetchAnnouncements = async () => {
    const res = await fetch("/api/announcements")
    setAnnouncements((await res.json()).slice(0, 5))
  }
  const openCreate = () => {
    setEditTarget(null)
    setForm({ ...emptyForm, publishedAt: new Date().toISOString().split("T")[0] })
    setDialogOpen(true)
  }
  const openEdit = (a: Announcement) => {
    setEditTarget(a)
    setForm({ title: a.title, content: a.content, category: a.category, publishedAt: a.publishedAt.split("T")[0] })
    setDialogOpen(true)
  }
  const handleSave = async () => {
    if (!form.title || !form.content || !form.category || !form.publishedAt) return
    setSaving(true)
    if (editTarget) {
      await fetch(`/api/announcements/${editTarget.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    } else {
      await fetch("/api/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    }
    setSaving(false); setDialogOpen(false); fetchAnnouncements()
  }
  const handleDelete = async () => {
    if (!deleteTarget) return
    await fetch(`/api/announcements/${deleteTarget.id}`, { method: "DELETE" })
    setDeleteTarget(null); fetchAnnouncements()
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Gauge className="w-6 h-6 text-gray-600" />ダッシュボード
          </h1>
          <p className="mt-1 text-gray-500">ようこそ、{userName}さん！</p>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-gray-500" />お知らせ
          </h2>
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={openCreate} className="flex items-center gap-1 text-xs">
              <Plus className="w-3 h-3" />追加
            </Button>
          )}
        </div>
        {announcements.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-400 text-center">お知らせはありません</div>
        ) : (
          <div className="space-y-2">
            {announcements.map(a => {
              const style = CATEGORY_STYLES[a.category] ?? { color: "bg-gray-100 text-gray-700 border-gray-200", icon: null }
              return (
                <div key={a.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-start gap-3 shadow-sm">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${style.color}`}>
                        {style.icon}{a.category}
                      </span>
                      <span className="text-xs text-gray-400">{new Date(a.publishedAt).toLocaleDateString("ja-JP")}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{a.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-wrap">{a.content}</p>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(a)} className="p-1 text-gray-400 hover:text-blue-600 rounded"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteTarget(a)} className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-base font-semibold text-gray-700 mb-3">サービス</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SERVICE_CARDS.map(m => {
            if (m.icon === "system" && !isAdmin) return null
            const viewable = canView(m.icon)
            if (!viewable) {
              return (
                <div key={m.href} className="bg-gray-50 border border-gray-200 rounded-xl p-4 opacity-40 cursor-not-allowed select-none">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-gray-100">
                    <ServiceIcon icon={m.icon} className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-400">{m.label}</p>
                  <p className="text-xs text-gray-300 mt-0.5">{m.desc}</p>
                </div>
              )
            }
            return (
              <Link key={m.href} href={m.href} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${m.color}`}>
                  <ServiceIcon icon={m.icon} className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{m.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{m.desc}</p>
              </Link>
            )
          })}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editTarget ? "お知らせを編集" : "お知らせを作成"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>公開日</Label>
              <Input type="date" value={form.publishedAt} onChange={e => setForm(f => ({ ...f, publishedAt: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>カテゴリ</Label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">選択してください</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>タイトル</Label>
              <Input autoComplete="off" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="例：定期メンテナンスのお知らせ" />
            </div>
            <div className="space-y-1">
              <Label>内容</Label>
              <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="詳細内容を入力" rows={4} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
              <Button onClick={handleSave} disabled={saving || !form.title || !form.content || !form.category || !form.publishedAt}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>削除の確認</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-2">「{deleteTarget?.title}」を削除しますか？この操作は取り消せません。</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>キャンセル</Button>
            <Button variant="destructive" onClick={handleDelete}>削除</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
