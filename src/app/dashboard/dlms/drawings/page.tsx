"use client"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, FileImage, AlertCircle } from "lucide-react"

type Drawing = {
  id: number
  drawing_no: string | null
  title: string | null
  product_no: string | null
  paper_size: string | null
  blade_size: string | null
  storage_location: string | null
  created_date: string | null
  legacy_file_path: string | null
  legacy_file_type: string | null
  new_file_path: string | null
  new_file_type: string | null
  dieline: { id: string; uid_ntemp: string; kyugataban: string | null } | null
}

type Filter = "all" | "legacy_only" | "new_only" | "both"

export default function DrawingsPage() {
  const router = useRouter()
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [fetching, setFetching] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [filter, setFilter] = useState<Filter>("all")

  const fetchDrawings = useCallback(async () => {
    setFetching(true)
    const params = new URLSearchParams()
    if (keyword) params.set("keyword", keyword)
    if (filter === "legacy_only") params.set("has_legacy", "1")
    if (filter === "new_only") params.set("has_new", "1")
    if (filter === "both") { params.set("has_legacy", "1"); params.set("has_new", "1") }
    const res = await fetch(`/api/dlms/drawings?${params}`)
    const data = await res.json()
    setDrawings(Array.isArray(data) ? data : [])
    setFetching(false)
  }, [keyword, filter])

  useEffect(() => { fetchDrawings() }, [fetchDrawings])

  const filterTabs: [Filter, string][] = [
    ["all", "すべて"],
    ["legacy_only", "旧図面のみ"],
    ["new_only", "新図面のみ"],
    ["both", "両方あり"],
  ]

  const getFileBadge = (drawing: Drawing) => {
    const hasLegacy = !!drawing.legacy_file_path
    const hasNew = !!drawing.new_file_path
    if (hasLegacy && hasNew) return <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">旧＋新</span>
    if (hasLegacy) return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">旧図面</span>
    if (hasNew) return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">新図面</span>
    return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium">ファイルなし</span>
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">図面管理</h1>
            <p className="text-xs text-gray-400 mt-0.5">旧図面・新図面の一元管理</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/dlms/drawings/new")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm">
            <Plus className="w-4 h-4" />図面を追加
          </button>
        </div>
      </div>

      {/* フィルターバー */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-6">
          {filterTabs.map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                filter === key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>{label}</button>
          ))}
        </div>
      </div>

      <div className="px-6 py-4 max-w-5xl w-full">
        {/* 検索 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="図面番号・型名・品番で検索"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* 一覧 */}
        {fetching ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white rounded-lg animate-pulse border border-gray-100" />)}
          </div>
        ) : drawings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <FileImage className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">図面が登録されていません</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm divide-y divide-gray-100">
            {drawings.map(d => (
              <div key={d.id}
                onClick={() => router.push(`/dashboard/dlms/drawings/${d.id}`)}
                className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900 truncate">{d.title ?? "（タイトルなし）"}</span>
                    {getFileBadge(d)}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {d.drawing_no && <span>図面番号：{d.drawing_no}</span>}
                    {d.product_no && <span>品番：{d.product_no}</span>}
                    {d.storage_location && <span>保管：{d.storage_location}</span>}
                    {d.dieline && <span className="text-blue-500">抜き型：{d.dieline.uid_ntemp}</span>}
                  </div>
                </div>
                <div className="text-xs text-gray-400 shrink-0">{d.created_date ?? ""}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
