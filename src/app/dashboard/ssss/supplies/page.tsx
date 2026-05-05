"use client"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Search, Plus, Mail, AlertCircle, X, ChevronDown, Trash2 } from "lucide-react"
import MailModal from "@/components/ssss/MailModal"

type Staff = { id: string; name: string }
type Company = { id: number; name: string }
type Part = { id: number; name: string }
type SealSupply = {
  id: number
  serialCode: string
  isHold: boolean
  holdDeadline: string | null
  issueDate: string
  productCode: string
  orderNo: string
  partName: string
  qtyShizuokaToTokyo: number
  qtyTokyoToOutsource: number
  qtyTokyoStock: number
  company: Company | null
  companyName: string | null
  issuer: Staff | null
  issuerName: string | null
  supplier: Staff | null
  supplierName: string | null
  shipDateFromJS: string | null
  receiver: Staff | null
  receiverName: string | null
  receiptDateAtSupplier: string | null
  outsourceReceiver: Staff | null
  outsourceReceiverName: string | null
  salesDepartment: string | null
  salesPerson: Staff | null
  salesPersonName: string | null
  mailSentFlag: string
  notes: string | null
}

type FormData = {
  productCode: string
  orderNo: string
  partName: string
  qtyShizuokaToTokyo: string
  qtyTokyoToOutsource: string
  qtyTokyoStock: string
  companyId: string
  companyName: string
  issuerId: string
  issuerName: string
  supplierId: string
  supplierName: string
  shipDateFromJS: string
  receiverId: string
  receiverName: string
  receiptDateAtSupplier: string
  outsourceReceiverId: string
  outsourceReceiverName: string
  issueDate: string
  isHold: boolean
  holdDeadline: string
  mailSentFlag: string
  notes: string
}

const initialForm: FormData = {
  productCode: "", orderNo: "", partName: "",
  qtyShizuokaToTokyo: "", qtyTokyoToOutsource: "", qtyTokyoStock: "",
  companyId: "", companyName: "",
  issuerId: "", issuerName: "",
  supplierId: "", supplierName: "", shipDateFromJS: "",
  receiverId: "", receiverName: "", receiptDateAtSupplier: "",
  outsourceReceiverId: "", outsourceReceiverName: "",
  issueDate: new Date().toISOString().split("T")[0],
  isHold: false, holdDeadline: "", mailSentFlag: "未", notes: "",
}

function toDateInput(d: string | null) {
  if (!d) return ""
  return new Date(d).toISOString().split("T")[0]
}
function fmtDate(d: string | null) {
  if (!d) return ""
  return new Date(d).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })
}
function getCompanyDisplay(s: SealSupply) { return s.company?.name ?? s.companyName ?? "" }
function getIssuerDisplay(s: SealSupply) { return s.issuer?.name ?? s.issuerName ?? "" }
function getSupplierDisplay(s: SealSupply) { return s.supplier?.name ?? s.supplierName ?? "" }
function getReceiverDisplay(s: SealSupply) { return s.receiver?.name ?? s.receiverName ?? "" }
function getOutsourceReceiverDisplay(s: SealSupply) { return s.outsourceReceiver?.name ?? s.outsourceReceiverName ?? "" }

function ComboField({ label, required, masterId, masterName, onChangeId, onChangeName, options, placeholder }: {
  label: string; required?: boolean; masterId: string; masterName: string
  onChangeId: (v: string) => void; onChangeName: (v: string) => void
  options: { id: string | number; name: string }[]; placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => String(o.id) === masterId)
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <button type="button" onClick={() => setOpen(v => !v)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <span className={selected ? "text-gray-900 text-xs" : "text-gray-400 text-xs"}>
            {selected ? selected.name : "選択..."}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        </button>
        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {options.length === 0
              ? <div className="px-3 py-2 text-xs text-gray-400">該当なし</div>
              : options.map(o => (
                <button key={o.id} type="button"
                  onClick={() => { onChangeId(String(o.id)); onChangeName(o.name as string); setOpen(false) }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 hover:text-blue-700">
                  {o.name}
                </button>
              ))}
          </div>
        )}
      </div>
      <div className="mt-1 flex items-center gap-1">
        <input type="text" value={masterName}
          onChange={e => { onChangeName(e.target.value); onChangeId("") }}
          placeholder={placeholder ?? "直接入力"}
          className="flex-1 px-2.5 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {(masterId || masterName) && (
          <button type="button" onClick={() => { onChangeId(""); onChangeName("") }} className="text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

function InputField({ label, required, value, onChange, placeholder, type = "text" }: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  )
}

type MasterData = {
  companies: Company[]
  parts: Part[]
  issuers: Staff[]
  suppliers: Staff[]
  receivers: Staff[]
  outsourceReceivers: Staff[]
}

function SupplyModal({ mode, supply, onClose, onSaved, onDeleted, masters }: {
  mode: "new" | "edit"; supply?: SealSupply
  onClose: () => void; onSaved: () => void; onDeleted?: () => void; masters: MasterData
}) {
  const [form, setForm] = useState<FormData>(() => {
    if (mode === "edit" && supply) {
      return {
        productCode: supply.productCode, orderNo: supply.orderNo, partName: supply.partName,
        qtyShizuokaToTokyo: String(supply.qtyShizuokaToTokyo),
        qtyTokyoToOutsource: String(supply.qtyTokyoToOutsource),
        qtyTokyoStock: String(supply.qtyTokyoStock),
        companyId: supply.company ? String(supply.company.id) : "",
        companyName: supply.company?.name ?? supply.companyName ?? "",
        issuerId: supply.issuer?.id ?? "", issuerName: supply.issuer?.name ?? supply.issuerName ?? "",
        supplierId: supply.supplier?.id ?? "", supplierName: supply.supplier?.name ?? supply.supplierName ?? "",
        shipDateFromJS: toDateInput(supply.shipDateFromJS),
        receiverId: supply.receiver?.id ?? "", receiverName: supply.receiver?.name ?? supply.receiverName ?? "",
        receiptDateAtSupplier: toDateInput(supply.receiptDateAtSupplier),
        outsourceReceiverId: supply.outsourceReceiver?.id ?? "",
        outsourceReceiverName: supply.outsourceReceiver?.name ?? supply.outsourceReceiverName ?? "",
        issueDate: toDateInput(supply.issueDate),
        isHold: supply.isHold, holdDeadline: toDateInput(supply.holdDeadline),
        mailSentFlag: supply.mailSentFlag, notes: supply.notes ?? "",
      }
    }
    return initialForm
  })

  // パーツのマスタID管理（partNameはテキストで保持、IDは選択時のみ使用）
  const [partMasterId, setPartMasterId] = useState(() => {
    if (mode === "edit" && supply) {
      const matched = masters.parts.find(p => p.name === supply.partName)
      return matched ? String(matched.id) : ""
    }
    return ""
  })

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  const set = (key: keyof FormData, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    if (!form.productCode || !form.orderNo || !form.partName) {
      setError("品番・受注No・貼り付けパーツは必須です")
      return
    }
    setSaving(true); setError("")
    try {
      const body = {
        productCode: form.productCode, orderNo: form.orderNo, partName: form.partName,
        qtyShizuokaToTokyo: parseInt(form.qtyShizuokaToTokyo) || 0,
        qtyTokyoToOutsource: parseInt(form.qtyTokyoToOutsource) || 0,
        qtyTokyoStock: parseInt(form.qtyTokyoStock) || 0,
        companyId: form.companyId ? parseInt(form.companyId) : null,
        companyName: form.companyName || null,
        issuerId: form.issuerId || null, issuerName: form.issuerName || null,
        supplierId: form.supplierId || null, supplierName: form.supplierName || null,
        shipDateFromJS: form.shipDateFromJS || null,
        receiverId: form.receiverId || null, receiverName: form.receiverName || null,
        receiptDateAtSupplier: form.receiptDateAtSupplier || null,
        outsourceReceiverId: form.outsourceReceiverId || null,
        outsourceReceiverName: form.outsourceReceiverName || null,
        issueDate: form.issueDate || null,
        isHold: form.isHold,
        holdDeadline: form.isHold ? (form.holdDeadline || null) : null,
        mailSentFlag: form.mailSentFlag, notes: form.notes || null,
      }
      const res = mode === "new"
        ? await fetch("/api/ssss/supplies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch(`/api/ssss/supplies/${supply!.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error("保存に失敗しました")
      onSaved(); onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました")
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirm(`No.${supply!.serialCode} を削除しますか？`)) return
    setDeleting(true)
    await fetch(`/api/ssss/supplies/${supply!.id}`, { method: "DELETE" })
    onDeleted?.(); onClose(); setDeleting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-gray-900">
              {mode === "new" ? "新規支給登録" : `編集 — ${supply?.serialCode}`}
            </h2>
            {mode === "edit" && supply && (
              <span className="text-xs text-gray-400">発行日: {fmtDate(supply.issueDate)}</span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4">
          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2 rounded-lg">{error}</div>}

          {/* 行1: 品番 / 受注No / パーツ / 発行日 */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <InputField label="品番 *" required value={form.productCode} onChange={v => set("productCode", v)} placeholder="例: TKCA91701" />
            <InputField label="受注No *" required value={form.orderNo} onChange={v => set("orderNo", v)} placeholder="例: 0742809-00" />
            <ComboField
              label="貼り付けパーツ *" required
              masterId={partMasterId}
              masterName={form.partName}
              onChangeId={v => setPartMasterId(v)}
              onChangeName={v => set("partName", v)}
              options={masters.parts}
              placeholder="直接入力可"
            />
            <InputField label="発行日" type="date" value={form.issueDate} onChange={v => set("issueDate", v)} />
          </div>

          {/* 行2: 支給枚数3列 / 支給先 / メール */}
          <div className="grid grid-cols-6 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">静岡→東京</label>
              <input type="number" min="0" value={form.qtyShizuokaToTokyo} onChange={e => set("qtyShizuokaToTokyo", e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">東京→外注</label>
              <input type="number" min="0" value={form.qtyTokyoToOutsource} onChange={e => set("qtyTokyoToOutsource", e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">東京保管</label>
              <input type="number" min="0" value={form.qtyTokyoStock} onChange={e => set("qtyTokyoStock", e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
            </div>
            <div className="col-span-2">
              <ComboField label="支給先会社" masterId={form.companyId} masterName={form.companyName}
                onChangeId={v => set("companyId", v)} onChangeName={v => set("companyName", v)}
                options={masters.companies} placeholder="直接入力可" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">メール送信</label>
              <div className="flex gap-1 mt-0.5">
                {["未", "済"].map(v => (
                  <button key={v} type="button" onClick={() => set("mailSentFlag", v)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      form.mailSentFlag === v
                        ? v === "済" ? "bg-blue-600 text-white border-blue-600" : "bg-gray-200 text-gray-700 border-gray-300"
                        : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                    }`}>{v}</button>
                ))}
              </div>
            </div>
          </div>

          {/* 行3: 担当者4列 */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <ComboField label="JS起票者" masterId={form.issuerId} masterName={form.issuerName}
              onChangeId={v => set("issuerId", v)} onChangeName={v => set("issuerName", v)} options={masters.issuers} />
            <ComboField label="JS支給者" masterId={form.supplierId} masterName={form.supplierName}
              onChangeId={v => set("supplierId", v)} onChangeName={v => set("supplierName", v)} options={masters.suppliers} />
            <ComboField label="JS受領者" masterId={form.receiverId} masterName={form.receiverName}
              onChangeId={v => set("receiverId", v)} onChangeName={v => set("receiverName", v)} options={masters.receivers} />
            <ComboField label="外注受領担当" masterId={form.outsourceReceiverId} masterName={form.outsourceReceiverName}
              onChangeId={v => set("outsourceReceiverId", v)} onChangeName={v => set("outsourceReceiverName", v)} options={masters.outsourceReceivers} />
          </div>

          {/* 行4: 出荷日 / 受領日 / 保留 */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <InputField label="JS支給出荷日" type="date" value={form.shipDateFromJS} onChange={v => set("shipDateFromJS", v)} />
            <InputField label="支給先受領日" type="date" value={form.receiptDateAtSupplier} onChange={v => set("receiptDateAtSupplier", v)} />
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">保留</label>
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input type="checkbox" checked={form.isHold} onChange={e => set("isHold", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">保留中にする</span>
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">保留期限</label>
              <input type="date" value={form.holdDeadline} onChange={e => set("holdDeadline", e.target.value)}
                disabled={!form.isHold}
                className={`w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${!form.isHold ? "opacity-40 cursor-not-allowed bg-gray-50" : ""}`} />
            </div>
          </div>

          {/* 行5: 備考 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">備考</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="メモがあれば入力..." />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-t bg-gray-50 rounded-b-2xl">
          <div>
            {mode === "edit" && (
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-50">
                <Trash2 className="w-4 h-4" />削除
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">キャンセル</button>
            <button onClick={handleSubmit} disabled={saving}
              className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors shadow-sm">
              {saving ? "保存中..." : mode === "new" ? "登録する" : "保存する"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SealSupplyListPage() {
  const [items, setItems] = useState<SealSupply[]>([])
  const [total, setTotal] = useState(0)
  const [fetching, setFetching] = useState(true)
  const [search, setSearch] = useState("")
  const [holdFilter, setHoldFilter] = useState<"all" | "hold" | "normal">("all")
  const [modalMode, setModalMode] = useState<"new" | "edit" | null>(null)
  const [selectedSupply, setSelectedSupply] = useState<SealSupply | null>(null)
  const [mailSupply, setMailSupply] = useState<SealSupply | null>(null)
  const [masters, setMasters] = useState<MasterData>({
    companies: [], parts: [], issuers: [], suppliers: [], receivers: [], outsourceReceivers: []
  })

  const fetchItems = useCallback(async () => {
    setFetching(true)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (holdFilter === "hold") params.set("isHold", "true")
    if (holdFilter === "normal") params.set("isHold", "false")
    params.set("limit", "50")
    const res = await fetch(`/api/ssss/supplies?${params}`)
    const data = await res.json()
    setItems(data.items ?? [])
    setTotal(data.total ?? 0)
    setFetching(false)
  }, [search, holdFilter])

  useEffect(() => { fetchItems() }, [fetchItems])

  const loadMasters = async () => {
    const [companies, parts, issuers, suppliers, receivers, outsourceReceivers] = await Promise.all([
      fetch("/api/ssss/companies").then(r => r.json()),
      fetch("/api/ssss/parts").then(r => r.json()),
      fetch("/api/ssss/staffs?role=issuer").then(r => r.json()),
      fetch("/api/ssss/staffs?role=supplier").then(r => r.json()),
      fetch("/api/ssss/staffs?role=receiver").then(r => r.json()),
      fetch("/api/ssss/staffs?role=outsourceReceiver").then(r => r.json()),
    ])
    setMasters({ companies, parts, issuers, suppliers, receivers, outsourceReceivers })
  }

  const openNew = async () => { await loadMasters(); setSelectedSupply(null); setModalMode("new") }
  const openEdit = async (item: SealSupply) => { await loadMasters(); setSelectedSupply(item); setModalMode("edit") }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">支給管理一覧</h1>
            <p className="text-xs text-gray-400 mt-0.5">全 {total.toLocaleString()} 件</p>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm">
            <Plus className="w-4 h-4" />新規作成
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="品番・受注No・パーツ・支給先..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(["all", "normal", "hold"] as const).map(f => (
              <button key={f} onClick={() => setHoldFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  holdFilter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>
                {f === "all" ? "すべて" : f === "hold" ? "保留のみ" : "通常のみ"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {fetching ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => <div key={i} className="h-16 bg-white rounded-lg animate-pulse border border-gray-100" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <AlertCircle className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">データがありません</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 w-8">保留</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 w-28">No / 発行日</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">品番 / 受注No</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">貼り付けパーツ</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500" colSpan={3}>
                      <div>支給枚数</div>
                      <div className="flex justify-around mt-0.5">
                        <span className="text-gray-400 font-normal" style={{fontSize:"10px"}}>静岡→東京</span>
                        <span className="text-gray-400 font-normal" style={{fontSize:"10px"}}>東京→外注</span>
                        <span className="text-gray-400 font-normal" style={{fontSize:"10px"}}>東京保管</span>
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">支給先</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">JS起票者</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">支給者</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">受領者</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">外注受領担当</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 w-16">メール</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 w-16">送り状</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map(item => (
                    <tr key={item.id} onClick={() => openEdit(item)}
                      className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${item.isHold ? "bg-amber-50/60" : ""}`}>
                      <td className="px-3 py-3 text-center">
                        {item.isHold && (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-mono text-xs font-semibold text-gray-700">{item.serialCode}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{fmtDate(item.issueDate)}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-xs text-gray-900">{item.productCode}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{item.orderNo}</div>
                      </td>
                      <td className="px-3 py-3"><span className="text-xs text-gray-700">{item.partName}</span></td>
                      <td className="px-3 py-3 text-center w-16">
                        <span className="text-sm font-semibold text-gray-800">
                          {item.qtyShizuokaToTokyo > 0 ? item.qtyShizuokaToTokyo : <span className="text-gray-300">—</span>}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center w-16">
                        <span className="text-sm font-semibold text-gray-800">
                          {item.qtyTokyoToOutsource > 0 ? item.qtyTokyoToOutsource : <span className="text-gray-300">—</span>}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center w-16">
                        <span className="text-sm font-semibold text-gray-800">
                          {item.qtyTokyoStock > 0 ? item.qtyTokyoStock : <span className="text-gray-300">—</span>}
                        </span>
                      </td>
                      <td className="px-3 py-3"><span className="text-xs text-gray-700">{getCompanyDisplay(item)}</span></td>
                      <td className="px-3 py-3"><span className="text-xs text-gray-700">{getIssuerDisplay(item)}</span></td>
                      <td className="px-3 py-3">
                        <div className="text-xs text-gray-700">{getSupplierDisplay(item)}</div>
                        {item.shipDateFromJS && <div className="text-xs text-gray-400 mt-0.5">{fmtDate(item.shipDateFromJS)}</div>}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs text-gray-700">{getReceiverDisplay(item)}</div>
                        {item.receiptDateAtSupplier && <div className="text-xs text-gray-400 mt-0.5">{fmtDate(item.receiptDateAtSupplier)}</div>}
                      </td>
                      <td className="px-3 py-3"><span className="text-xs text-gray-700">{getOutsourceReceiverDisplay(item)}</span></td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={e => { e.stopPropagation(); setMailSupply(item) }}
                          className={`flex items-center justify-center gap-1 mx-auto px-2 py-1 rounded-md transition-colors ${
                            item.mailSentFlag === "済"
                              ? "text-blue-600 hover:bg-blue-50"
                              : "text-gray-400 hover:bg-gray-50"
                          }`}>
                          <Mail className={`w-3.5 h-3.5 ${item.mailSentFlag === "済" ? "text-blue-500" : "text-gray-300"}`} />
                          <span className="text-xs font-medium">{item.mailSentFlag}</span>
                        </button>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Link href={`/dashboard/ssss/supplies/${item.id}`} onClick={e => e.stopPropagation()}
                          className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 rounded-md px-2 py-1 transition-colors whitespace-nowrap">
                          送り状
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {mailSupply && (
        <MailModal
          supply={mailSupply}
          onClose={() => setMailSupply(null)}
          onSent={fetchItems}
        />
      )}

      {modalMode && (
        <SupplyModal
          mode={modalMode}
          supply={selectedSupply ?? undefined}
          onClose={() => { setModalMode(null); setSelectedSupply(null) }}
          onSaved={fetchItems}
          onDeleted={fetchItems}
          masters={masters}
        />
      )}
    </div>
  )
}
