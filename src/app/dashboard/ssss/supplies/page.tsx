"use client"
import { useEffect, useState, useCallback } from "react"
import { Search, Plus, Mail, AlertCircle } from "lucide-react"

type Staff = { id: number; name: string }
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

function fmtDate(d: string | null) {
  if (!d) return ""
  return new Date(d).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })
}

function getCompanyDisplay(s: SealSupply) { return s.company?.name ?? s.companyName ?? "" }
function getIssuerDisplay(s: SealSupply) { return s.issuer?.name ?? s.issuerName ?? "" }
function getSupplierDisplay(s: SealSupply) { return s.supplier?.name ?? s.supplierName ?? "" }
function getReceiverDisplay(s: SealSupply) { return s.receiver?.name ?? s.receiverName ?? "" }
function getOutsourceReceiverDisplay(s: SealSupply) { return s.outsourceReceiver?.name ?? s.outsourceReceiverName ?? "" }

export default function SealSupplyListPage() {
  const [items, setItems] = useState<SealSupply[]>([])
  const [total, setTotal] = useState(0)
  const [fetching, setFetching] = useState(true)
  const [search, setSearch] = useState("")
  const [holdFilter, setHoldFilter] = useState<"all" | "hold" | "normal">("all")

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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">支給管理一覧</h1>
            <p className="text-xs text-gray-400 mt-0.5">全 {total.toLocaleString()} 件</p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm">
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

      {/* テーブル */}
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
                    <tr
                      key={item.id}
                      className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${item.isHold ? "bg-amber-50/60" : ""}`}
                    >
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
                      <td className="px-3 py-3">
                        <span className="text-xs text-gray-700">{item.partName}</span>
                      </td>
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
                      <td className="px-3 py-3">
                        <span className="text-xs text-gray-700">{getCompanyDisplay(item)}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs text-gray-700">{getIssuerDisplay(item)}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs text-gray-700">{getSupplierDisplay(item)}</div>
                        {item.shipDateFromJS && (
                          <div className="text-xs text-gray-400 mt-0.5">{fmtDate(item.shipDateFromJS)}</div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs text-gray-700">{getReceiverDisplay(item)}</div>
                        {item.receiptDateAtSupplier && (
                          <div className="text-xs text-gray-400 mt-0.5">{fmtDate(item.receiptDateAtSupplier)}</div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs text-gray-700">{getOutsourceReceiverDisplay(item)}</span>
                      </td>
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
    </div>
  )
}
