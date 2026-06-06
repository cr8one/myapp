"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"

type CadRequest = {
  id: string
  uid: string
  request_date: string
  request_time: string
  requester_name: string
  department: string | null
  client: string | null
  title: string | null
  genre: string | null
  hinmoku: string | null
  hinban: string | null
  desired_date: string | null
  desired_time: string | null
  requester: { id: string; name: string | null; department: string | null } | null
}

const PAGE_SIZE = 50

export default function CadRequestsPage() {
  const router = useRouter()
  const [records, setRecords] = useState<CadRequest[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const fetchRecords = async (p = page, kw = keyword) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (kw) params.set("keyword", kw)
    params.set("page", String(p))
    const res = await fetch(`/api/cad/requests?${params.toString()}`)
    const data = await res.json()
    setRecords(data.records)
    setTotal(data.total)
    setLoading(false)
  }

  useEffect(() => { fetchRecords(1) }, [])

  const handleSearch = () => {
    setPage(1)
    fetchRecords(1, keyword)
  }

  const handlePage = (next: number) => {
    setPage(next)
    fetchRecords(next, keyword)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("このCAD依頼を削除しますか？")) return
    await fetch(`/api/cad/requests/${id}`, { method: "DELETE" })
    fetchRecords(page, keyword)
  }

  const formatDate = (str: string | null) => {
    if (!str) return ""
    return new Date(str).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })
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
        <h1 className="text-2xl font-bold">CAD依頼書</h1>
        <Button onClick={() => router.push("/dashboard/cad/requests/new")}>新規登録</Button>
      </div>

      {/* 検索 */}
      <div className="bg-white border rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex gap-3">
          <Input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="依頼番号・営業名・クライアント・タイトル・品番"
            className="h-8 text-sm"
            autoComplete="off"
          />
          <Button size="sm" onClick={handleSearch} className="flex items-center gap-1">
            <Search className="w-3 h-3" />検索
          </Button>
        </div>
      </div>

      {/* 一覧 */}
      {loading ? (
        <p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p>
      ) : records.length === 0 ? (
        <p className="text-center text-gray-500 py-8">データがありません</p>
      ) : (
        <>
          <Pagination />
          <div className="space-y-3">
            {records.map(r => (
              <Card key={r.id} className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/dashboard/cad/requests/${r.id}`)}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="font-bold text-lg text-gray-800">No.{r.uid}</span>
                        <span className="text-sm text-gray-500">{formatDate(r.request_date)}</span>
                        {r.department && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{r.department}</span>
                        )}
                        <span className="text-sm text-gray-700">{r.requester_name}</span>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600 flex-wrap">
                        {r.client && <span>クライアント：{r.client}</span>}
                        {r.title && <span>タイトル：{r.title}</span>}
                        {r.hinban && <span>品番：{r.hinban}</span>}
                      </div>
                      <div className="flex gap-3 mt-1 flex-wrap">
                        {r.genre && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{r.genre}</span>}
                        {r.hinmoku && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{r.hinmoku}</span>}
                        {r.desired_date && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                            希望納期：{formatDate(r.desired_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4" onClick={e => e.stopPropagation()}>
                      <Button variant="outline" size="sm"
                        onClick={() => router.push(`/dashboard/cad/requests/${r.id}`)}>詳細</Button>
                      <Button variant="destructive" size="sm"
                        onClick={e => handleDelete(r.id, e)}>削除</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination />
        </>
      )}
    </div>
  )
}
