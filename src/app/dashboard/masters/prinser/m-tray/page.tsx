"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Trash2, RefreshCw, Search, ChevronLeft, ChevronRight, Database } from "lucide-react"
import { useRouter } from "next/navigation"
const PAGE_SIZE = 50
type Record_ = {
  tray_cd: string; t_shop: string; t_maker: string; t_type: string; tray_nm: string
  t_atumi: number; t_logo: string; t_foot: string; t_col: string; bikou: string
  tray_nm2: string; t_wide: string | null; tray_tanka: string | null
  rendo_tray_cd: string; t_sort: number; del_flg: number
  dtindt: string; dtintm: string; dtinuid: string
  dtupdt: string; dtuptm: string; dtupuid: string
  tray_ryaku_nm: string | null; tray_warimashi: string | null
}
function Pagination({ page, totalPages, totalCount, onPageChange }: {
  page: number; totalPages: number; totalCount: number; onPageChange: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between px-1 py-2">
      <p className="text-xs text-gray-400">
        {totalCount}件中 {(page - 1) * PAGE_SIZE + 1}〜{Math.min(page * PAGE_SIZE, totalCount)}件
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-600 px-2">{page} / {totalPages}</span>
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
export default function MTrayPage() {
  const router = useRouter()
  const [records, setRecords] = useState<Record_[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [delFlg, setDelFlg] = useState("")
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const fetchRecords = async (p = page) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (keyword) params.set("keyword", keyword)
    if (delFlg) params.set("delFlg", delFlg)
    params.set("page", String(p))
    const res = await fetch(`/api/prinser/m-tray?${params.toString()}`)
    const data = await res.json()
    setRecords(data.records ?? [])
    setTotalCount(data.total ?? 0)
    setLoading(false)
  }
  useEffect(() => { fetchRecords(1) }, [])
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const handleSearch = () => { setPage(1); fetchRecords(1) }
  const handlePageChange = (p: number) => { setPage(p); fetchRecords(p) }
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportProgress("S3にアップロード中...")
    try {
      const putRes = await fetch("/api/prinser/m-tray", { method: "PUT" })
      const { url, key } = await putRes.json()
      await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": "text/csv" } })
      setImportProgress("インポート中...")
      let offset = 0; let total = 0
      while (true) {
        const res = await fetch("/api/prinser/m-tray/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, offset }),
        })
        const result = await res.json()
        total = result.total
        offset += result.count
        setImportProgress(`インポート中... ${offset} / ${total}`)
        if (result.done) break
      }
      setImportProgress(`完了: ${total}件`)
      setPage(1); fetchRecords(1)
    } catch (err: any) {
      setImportProgress("エラー: " + err.message)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }
  const handleDelete = async () => {
    if (!confirm("全データを削除しますか？")) return
    await fetch("/api/prinser/m-tray", { method: "DELETE" })
    setPage(1); fetchRecords(1)
  }
  const toStr = (v: string | null | undefined) => v ?? ""
  return (
    <div className="min-w-0 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">m_tray</h1>
            <p className="text-sm text-gray-500 mt-1">トレイマスタ（{totalCount}件）</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm"
              onClick={() => router.push("/dashboard/masters/prinser/m-tray/definition")}
              className="flex items-center gap-1">
              <Database className="w-4 h-4" />DB定義
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete}
              className="flex items-center gap-1 text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" />全削除
            </Button>
            <Button size="sm" onClick={() => fileRef.current?.click()} disabled={importing}
              className="flex items-center gap-1">
              <Upload className="w-4 h-4" />CSVインポート
            </Button>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </div>
        </div>
        {importProgress && (
          <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
            {importProgress}
          </div>
        )}
        <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-40">
              <Input placeholder="トレイCD・トレイ名・略称・メーカーで検索" value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSearch() }}
                autoComplete="off" />
            </div>
            <select value={delFlg} onChange={e => setDelFlg(e.target.value)}
              className="h-10 border rounded px-3 text-sm bg-white">
              <option value="">削除フラグ：全て</option>
              <option value="0">0：有効</option>
              <option value="1">1：削除</option>
            </select>
            <Button onClick={handleSearch} size="sm" className="flex items-center gap-1">
              <Search className="w-4 h-4" />検索
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setKeyword(""); setDelFlg(""); setPage(1); setTimeout(() => fetchRecords(1), 0) }}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {loading ? (
          <p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p>
        ) : records.length === 0 ? (
          <p className="text-center text-gray-500 py-8">データがありません。CSVをインポートしてください。</p>
        ) : (
          <>
            <Pagination page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={handlePageChange} />
            <div className="border rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="text-xs bg-white" style={{ minWidth: "max-content" }}>
                  <thead className="bg-gray-50 border-b sticky top-0 z-10">
                    <tr>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">トレイCD</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">店舗</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">メーカー</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">タイプ</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">トレイ名</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">トレイ名2</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">略称</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">厚み</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">幅</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">ロゴ</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">脚</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">色</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">単価</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">割増</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">連動トレイCD</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">ソート</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">備考</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">登録日付</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">登録時間</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">登録者</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">更新日付</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">更新時間</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">更新者</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">削除FLG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map(r => (
                      <tr key={r.tray_cd} className={`hover:bg-blue-50 ${r.del_flg === 1 ? "opacity-50 bg-red-50" : ""}`}>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r font-mono">{r.tray_cd}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{r.t_shop}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{r.t_maker}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{r.t_type}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{r.tray_nm}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{r.tray_nm2}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{toStr(r.tray_ryaku_nm)}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r text-right">{r.t_atumi}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{toStr(r.t_wide)}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{r.t_logo}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{r.t_foot}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{r.t_col}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r text-right">{toStr(r.tray_tanka)}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r text-right">{toStr(r.tray_warimashi)}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r font-mono">{r.rendo_tray_cd}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r text-right">{r.t_sort}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{r.bikou}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{r.dtindt}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{r.dtintm}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{r.dtinuid}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{r.dtupdt}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{r.dtuptm}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{r.dtupuid}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          {r.del_flg === 1
                            ? <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-xs">削除</span>
                            : <span className="bg-green-100 text-green-600 px-1.5 py-0.5 rounded text-xs">有効</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={handlePageChange} />
          </>
        )}
      </div>
    </div>
  )
}
