"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Tag, FileText, File } from "lucide-react"

type DaishiRecord = {
  id: string
  uid: string
  file_ai: string | null
  file_dxf: string | null
  file_pdf: string | null
  preview_image: string | null
  remarks: string | null
  created_at: string
  tags: { id: number; tag_name: string }[]
}

export default function DaishiDbPage() {
  const router = useRouter()
  const [records, setRecords] = useState<DaishiRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState("")
  const [loading, setLoading] = useState(true)
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})

  const fetchRecords = async (p = page) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), keyword })
    const res = await fetch(`/api/cad/daishi-db?${params}`)
    const data = await res.json()
    setRecords(data.records)
    setTotal(data.total)
    setLoading(false)
    // プレビュー画像の署名付きURL取得
    const urls: Record<string, string> = {}
    await Promise.all(data.records.map(async (r: DaishiRecord) => {
      if (r.preview_image) {
        const res = await fetch(`/api/cad/daishi-db/signed-url?key=${encodeURIComponent(r.preview_image)}`)
        const d = await res.json()
        urls[r.id] = d.url
      }
    }))
    setPreviewUrls(urls)
  }

  useEffect(() => { fetchRecords(1); setPage(1) }, [keyword])

  const totalPages = Math.ceil(total / 50)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">DXF・台紙DB</h1>
        <button
          onClick={() => router.push("/dashboard/cad/daishi-db/new")}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white text-sm rounded-lg hover:bg-emerald-800"
        >
          <Plus className="w-4 h-4" /> 新規登録
        </button>
      </div>

      {/* 検索 */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="No・備考・タグで検索..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
          autoComplete="off"
        />
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">読み込み中...</p>
      ) : records.length === 0 ? (
        <p className="text-gray-400 text-sm">データがありません</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {records.map(r => (
            <div
              key={r.id}
              onClick={() => router.push(`/dashboard/cad/daishi-db/${r.id}`)}
              className="border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 overflow-hidden"
            >
              {/* プレビュー */}
              <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                {previewUrls[r.id] ? (
                  <img src={previewUrls[r.id]} alt={r.uid} className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-gray-300">
                    <FileText className="w-10 h-10" />
                    <span className="text-xs">No Preview</span>
                  </div>
                )}
              </div>
              {/* 情報 */}
              <div className="p-3">
                <p className="font-mono font-medium text-sm text-gray-900 mb-1">{r.uid}</p>
                <div className="flex gap-1 mb-2">
                  {r.file_ai && <span className="text-xs bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded">AI</span>}
                  {r.file_dxf && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">DXF</span>}
                  {r.file_pdf && <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded">PDF</span>}
                </div>
                {r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {r.tags.slice(0, 3).map(t => (
                      <span key={t.id} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Tag className="w-2.5 h-2.5" />{t.tag_name}
                      </span>
                    ))}
                    {r.tags.length > 3 && <span className="text-xs text-gray-400">+{r.tags.length - 3}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">{total}件中 {(page - 1) * 50 + 1}〜{Math.min(page * 50, total)}件</p>
          <div className="flex gap-2">
            <button onClick={() => { setPage(p => p - 1); fetchRecords(page - 1) }} disabled={page === 1}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">← 前</button>
            <span className="px-3 py-1.5 text-sm">{page} / {totalPages}</span>
            <button onClick={() => { setPage(p => p + 1); fetchRecords(page + 1) }} disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">次 →</button>
          </div>
        </div>
      )}
    </div>
  )
}
