"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronLeft, ChevronRight, Download } from "lucide-react"

type TokuiCreditRequest = {
  id: string
  uid: string
  request_type: string
  status: string
  company_name: string | null
  sales_rep_name: string | null
  requested_credit_limit: string | null
  requested_date: string | null
  created_at: string
}

const PAGE_SIZE = 50
const STATUS_OPTIONS = ["下書き", "申請済み"] as const
const STATUS_STYLE: Record<string, string> = {
  "下書き": "bg-gray-100 text-gray-600",
  "申請済み": "bg-blue-100 text-blue-700",
}
const REQUEST_TYPE_LABEL: Record<string, string> = {
  NEW: "登録依頼",
  UPDATE: "修正依頼",
}
const REQUEST_TYPE_STYLE: Record<string, string> = {
  NEW: "bg-emerald-100 text-emerald-700",
  UPDATE: "bg-amber-100 text-amber-700",
}

export default function EAppCustomersPage() {
  const router = useRouter()
  const [records, setRecords] = useState<TokuiCreditRequest[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const fetchRecords = async (p = page, kw = keyword, st = statusFilter) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (kw) params.set("keyword", kw)
    if (st) params.set("status", st)
    params.set("page", String(p))
    const res = await fetch(`/api/eapp/customers?${params.toString()}`)
    const data = await res.json()
    setRecords(data.records)
    setTotal(data.total)
    setLoading(false)
  }

  useEffect(() => { fetchRecords(1) }, [])

  const handleSearch = () => {
    setPage(1)
    fetchRecords(1, keyword, statusFilter)
  }
  const handleStatusFilter = (st: string) => {
    const next = statusFilter === st ? "" : st
    setStatusFilter(next)
    setPage(1)
    fetchRecords(1, keyword, next)
  }
  const handlePage = (next: number) => {
    setPage(next)
    fetchRecords(next, keyword, statusFilter)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  const formatDate = (str: string | null) => {
    if (!str) return ""
    const d = new Date(str)
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
  }

  const Pagination = () => (
    <div className="flex items-center justify-between py-3 px-1">
      <p className="text-sm text-gray-500">
        全 {total} 件中 {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}〜{Math.min(page * PAGE_SIZE, total)} 件表示
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => handlePage(page - 1)} disabled={page <= 1}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm px-3">{page} / {Math.max(1, totalPages)}</span>
        <Button variant="outline" size="sm" onClick={() => handlePage(page + 1)} disabled={page >= totalPages}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">得意先申請</h1>
        <div className="flex gap-2">
          <a href="/templates/お得意様先状況.pdf" download="お得意様先状況.pdf">
            <Button variant="outline" className="flex items-center gap-1">
              <Download className="w-4 h-4" />お得意先状況(PDF)
            </Button>
          </a>
          <a href="/templates/お得意様先状況.xls" download="お得意様先状況.xls">
            <Button variant="outline" className="flex items-center gap-1">
              <Download className="w-4 h-4" />お得意先状況(Excel)
            </Button>
          </a>
          <Button onClick={() => router.push("/dashboard/eapp/customers/new")}>新規登録</Button>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4 mb-6 shadow-sm space-y-3">
        <div className="flex gap-3">
          <Input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="申請番号・会社名・営業担当者"
            className="h-8 text-sm"
            autoComplete="off"
          />
          <Button size="sm" onClick={handleSearch} className="flex items-center gap-1">
            <Search className="w-3 h-3" />検索
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400">ステータス絞り込み：</span>
          {STATUS_OPTIONS.map(st => (
            <button
              key={st}
              onClick={() => handleStatusFilter(st)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                statusFilter === st
                  ? `${STATUS_STYLE[st]} border-transparent font-semibold`
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p>
      ) : records.length === 0 ? (
        <p className="text-center text-gray-500 py-8">データがありません</p>
      ) : (
        <>
          <Pagination />
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-24" />
                <col className="w-24" />
                <col className="w-24" />
                <col />
                <col className="w-28" />
                <col className="w-32" />
                <col className="w-24" />
                <col className="w-20" />
              </colgroup>
              <thead>
                <tr className="border-b bg-gray-50 text-xs text-gray-500">
                  <th className="text-left font-medium px-3 py-3">申請番号</th>
                  <th className="text-left font-medium px-3 py-3">種別</th>
                  <th className="text-left font-medium px-3 py-3">ステータス</th>
                  <th className="text-left font-medium px-3 py-3">会社名</th>
                  <th className="text-left font-medium px-3 py-3">営業担当者</th>
                  <th className="text-left font-medium px-3 py-3">取引限度申請額</th>
                  <th className="text-left font-medium px-3 py-3">申請日</th>
                  <th className="text-left font-medium px-3 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr
                    key={r.id}
                    className="border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors align-top"
                    onClick={() => router.push(`/dashboard/eapp/customers/${r.id}`)}
                  >
                    <td className="px-3 py-4 text-xs text-gray-400">{r.uid}</td>
                    <td className="px-3 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${REQUEST_TYPE_STYLE[r.request_type] ?? "bg-gray-100 text-gray-600"}`}>
                        {REQUEST_TYPE_LABEL[r.request_type] ?? r.request_type}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_STYLE[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <span className="text-sm text-gray-700 break-words leading-snug">{r.company_name ?? ""}</span>
                    </td>
                    <td className="px-3 py-4">
                      <span className="text-sm text-gray-600 break-words leading-snug">{r.sales_rep_name ?? ""}</span>
                    </td>
                    <td className="px-3 py-4">
                      <span className="text-sm text-gray-600 whitespace-nowrap">{r.requested_credit_limit ?? ""}</span>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-600">{formatDate(r.requested_date)}</td>
                    <td className="px-3 py-4" onClick={e => e.stopPropagation()}>
                      <Button variant="outline" size="sm"
                        onClick={() => router.push(`/dashboard/eapp/customers/${r.id}`)}>詳細</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination />
        </>
      )}
    </div>
  )
}
