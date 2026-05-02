"use client"
import { useEffect, useState, useCallback } from "react"
import { Search, Plus, Mail, AlertCircle, X, ChevronDown } from "lucide-react"

type Staff = { id: string; name: string }
type Company = { id: number; name: string }
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
  receiverId: string
  receiverName: string
  outsourceReceiverId: string
  outsourceReceiverName: string
  issueDate: string
  isHold: boolean
  holdDeadline: string
  notes: string
}

const initialForm: FormData = {
  productCode: "",
  orderNo: "",
  partName: "",
  qtyShizuokaToTokyo: "",
  qtyTokyoToOutsource: "",
  qtyTokyoStock: "",
  companyId: "",
  companyName: "",
  issuerId: "",
  issuerName: "",
  supplierId: "",
  supplierName: "",
  receiverId: "",
  receiverName: "",
  outsourceReceiverId: "",
  outsourceReceiverName: "",
  issueDate: new Date().toISOString().split("T")[0],
  isHold: false,
  holdDeadline: "",
  notes: "",
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

function ComboField({
  label,
  required,
  masterId,
  masterName,
  onChangeId,
  onChangeName,
  options,
  placeholder,
}: {
  label: string
  required?: boolean
  masterId: string
  masterName: string
  onChangeId: (v: string) => void
  onChangeName: (v: string) => void
  options: { id: string | number; name: string }[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => String(o.id) === masterId)

  const handleSelect = (o: { id: string | number; name: string }) => {
    onChangeId(String(o.id))
    onChangeName(o.name)
    setOpen(false)
  }

  const handleClear = () => {
    onChangeId("")
    onChangeName("")
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-200 rounded-lg hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <span className={selected ? "text-gray-900" : "text-gray-400"}>
            {selected ? selected.name : "マスタから選択..."}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400">該当するユーザーがいません</div>
            ) : (
              options.map(o => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => handleSelect(o)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700"
                >
                  {o.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <div className="mt-1 flex items-center gap-1">
        <input
          type="text"
          value={masterName}
          onChange={e => { onChangeName(e.target.value); onChangeId("") }}
          placeholder={placeholder ?? "または直接入力"}
          className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {(masterId || masterName) && (
          <button type="button" onClick={handleClear} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

type MasterData = {
  companies: Company[]
  issuers: Staff[]
  suppliers: Staff[]
  receivers: Staff[]
  outsourceReceivers: Staff[]
}

function NewSupplyModal({
  onClose,
  onCreated,
  masters,
}: {
  onClose: () => void
  onCreated: () => void
  masters: MasterData
}) {
  const [form, setForm] = useState<FormData>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const set = (key: keyof FormData, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    if (!form.productCode || !form.orderNo || !form.partName) {
      setError("品番・受注No・貼り付けパーツは必須です")
      return
    }
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/ssss/supplies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productCode: form.productCode,
          orderNo: form.orderNo,
          partName: form.partName,
          qtyShizuokaToTokyo: parseInt(form.qtyShizuokaToTokyo) || 0,
          qtyTokyoToOutsource: parseInt(form.qtyTokyoToOutsource) || 0,
          qtyTokyoStock: parseInt(form.qtyTokyoStock) || 0,
          companyId: form.companyId ? parseInt(form.companyId) : null,
          companyName: form.companyName || null,
          issuerId: form.issuerId || null,
          issuerName: form.issuerName || null,
          supplierId: form.supplierId || null,
          supplierName: form.supplierName || null,
          receiverId: form.receiverId || null,
          receiverName: form.receiverName || null,
          outsourceReceiverId: form.outsourceReceiverId || null,
          outsourceReceiverName: form.outsourceReceiverName || null,
          issueDate: form.issueDate || null,
          isHold: form.isHold,
          holdDeadline: form.holdDeadline || null,
          notes: form.notes || null,
        }),
      })
      if (!res.ok) throw new Error("作成に失敗しました")
      onCreated()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-bold text-gray-900">新規支給登録</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                品番<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={form.productCode}
                onChange={e => set("productCode", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: TKCA91701"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                受注No<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={form.orderNo}
                onChange={e => set("orderNo", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 0742809-00"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              貼り付けパーツ<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={form.partName}
              onChange={e => set("partName", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: ラベル"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">支給枚数</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "qtyShizuokaToTokyo" as keyof FormData, label: "静岡→東京" },
                { key: "qtyTokyoToOutsource" as keyof FormData, label: "東京→外注" },
                { key: "qtyTokyoStock" as keyof FormData, label: "東京保管" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <div className="text-xs text-gray-500 mb-1 text-center">{label}</div>
                  <input
                    type="number"
                    min="0"
                    value={form[key] as string}
                    onChange={e => set(key, e.target.value)}
                    className="w-full px-3 py-2 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>

          <ComboField
            label="支給先会社"
            masterId={form.companyId}
            masterName={form.companyName}
            onChangeId={v => set("companyId", v)}
            onChangeName={v => set("companyName", v)}
            options={masters.companies}
            placeholder="または直接入力"
          />

          <div className="grid grid-cols-2 gap-4">
            <ComboField
              label="JS起票者"
              masterId={form.issuerId}
              masterName={form.issuerName}
              onChangeId={v => set("issuerId", v)}
              onChangeName={v => set("issuerName", v)}
              options={masters.issuers}
            />
            <ComboField
              label="JS支給者"
              masterId={form.supplierId}
              masterName={form.supplierName}
              onChangeId={v => set("supplierId", v)}
              onChangeName={v => set("supplierName", v)}
              options={masters.suppliers}
            />
            <ComboField
              label="JS受領者"
              masterId={form.receiverId}
              masterName={form.receiverName}
              onChangeId={v => set("receiverId", v)}
              onChangeName={v => set("receiverName", v)}
              options={masters.receivers}
            />
            <ComboField
              label="外注受領担当"
              masterId={form.outsourceReceiverId}
              masterName={form.outsourceReceiverName}
              onChangeId={v => set("outsourceReceiverId", v)}
              onChangeName={v => set("outsourceReceiverName", v)}
              options={masters.outsourceReceivers}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">発行日</label>
            <input
              type="date"
              value={form.issueDate}
              onChange={e => set("issueDate", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isHold}
                onChange={e => set("isHold", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">保留</span>
            </label>
            {form.isHold && (
              <div className="flex items-center gap-2 flex-1">
                <label className="text-xs text-gray-500 whitespace-nowrap">保留期限</label>
                <input
                  type="date"
                  value={form.holdDeadline}
                  onChange={e => set("holdDeadline", e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">備考</label>
            <textarea
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="メモがあれば入力..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors shadow-sm"
          >
            {saving ? "登録中..." : "登録する"}
          </button>
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
  const [showModal, setShowModal] = useState(false)
  const [masters, setMasters] = useState<MasterData>({ companies: [], issuers: [], suppliers: [], receivers: [], outsourceReceivers: [] })

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

  const openModal = async () => {
    const [companies, issuers, suppliers, receivers, outsourceReceivers] = await Promise.all([
      fetch("/api/ssss/companies").then(r => r.json()),
      fetch("/api/ssss/staffs?role=issuer").then(r => r.json()),
      fetch("/api/ssss/staffs?role=supplier").then(r => r.json()),
      fetch("/api/ssss/staffs?role=receiver").then(r => r.json()),
      fetch("/api/ssss/staffs?role=outsourceReceiver").then(r => r.json()),
    ])
    setMasters({ companies, issuers, suppliers, receivers, outsourceReceivers })
    setShowModal(true)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">支給管理一覧</h1>
            <p className="text-xs text-gray-400 mt-0.5">全 {total.toLocaleString()} 件</p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            新規作成
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="品番・受注No・パーツ・支給先..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(["all", "normal", "hold"] as const).map(f => (
              <button
                key={f}
                onClick={() => setHoldFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  holdFilter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f === "all" ? "すべて" : f === "hold" ? "保留のみ" : "通常のみ"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {fetching ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-lg animate-pulse border border-gray-100" />
            ))}
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
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 w-8">保留</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 w-28">No / 発行日</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">品番 / 受注No</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">貼り付けパーツ</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 w-20">静岡→東京</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 w-20">東京→外注</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 w-20">東京保管</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">支給先</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">JS起票者</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">支給者</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">受領者</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">外注受領担当</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 w-24">メール</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 w-20">送り状</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map(item => (
                    <tr key={item.id} className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${item.isHold ? "bg-amber-50/60" : ""}`}>
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
                      <td className="px-3 py-3 text-center">
                        <span className="text-sm font-semibold text-gray-800">
                          {item.qtyShizuokaToTokyo > 0 ? item.qtyShizuokaToTokyo : <span className="text-gray-300">—</span>}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-sm font-semibold text-gray-800">
                          {item.qtyTokyoToOutsource > 0 ? item.qtyTokyoToOutsource : <span className="text-gray-300">—</span>}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
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
                        <div className="flex items-center justify-center gap-1">
                          <Mail className={`w-3.5 h-3.5 ${item.mailSentFlag === "済" ? "text-blue-500" : "text-gray-300"}`} />
                          <span className={`text-xs font-medium ${item.mailSentFlag === "済" ? "text-blue-600" : "text-gray-400"}`}>
                            {item.mailSentFlag}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={e => e.stopPropagation()}
                          className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 rounded-md px-2 py-1 transition-colors whitespace-nowrap"
                        >
                          送り状
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <NewSupplyModal
          onClose={() => setShowModal(false)}
          onCreated={fetchItems}
          masters={masters}
        />
      )}
    </div>
  )
}
