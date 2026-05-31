"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Trash2, RefreshCw, Search, ChevronLeft, ChevronRight } from "lucide-react"
const PAGE_SIZE = 50
type Record_ = {
  nonyu_cd: string; tokuicd: string | null; tokuinm: string | null; tantou_nm: string | null
  nonyu_nm1: string | null; nonyu_nm2: string | null; nonyu_kana: string | null
  nonyu_kigou: string | null; sy_shoyou_nissu: number; yubin_no: string | null
  address1: string | null; address2: string | null; tel_no: string | null; fax_no: string | null
  tekiyou: string | null; dtindt: string; dtintm: string; dtinuid: string
  dtupdt: string; dtuptm: string; dtupuid: string; del_flg: number
  mitsumonavi_nohinsaki_name: string
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
export default function MTokuiNonyuPage() {
  const [records, setRecords] = useState<Record_[]>([])
  const [loading, setLoading] = useState(false)
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
    const res = await fetch(`/api/prinser/m-tokui-nonyu?${params.toString()}`)
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
      const putRes = await fetch("/api/prinser/m-tokui-nonyu", { method: "PUT" })
      const { url, key } = await putRes.json()
      await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": "text/csv" } })
      setImportProgress("インポート中...")
      let offset = 0; let total = 0
      while (true) {
        const res = await fetch("/api/prinser/m-tokui-nonyu/bulk", {
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
    await fetch("/api/prinser/m-tokui-nonyu", { method: "DELETE" })
    setPage(1); fetchRecords(1)
  }
  const toStr = (v: string | null | undefined) => v ?? ""
  return (
    <div className="min-w-0 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">m_tokui_nonyu</h1>
            <p className="text-sm text-gray-500 mt-1">納品先マスタ（得意先別）（{totalCount}件）</p>
          </div>
          <div className="flex items-center gap-2">
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
              <Input placeholder="納入先CD・名称・カナ・得意先で検索" value={keyword}
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
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">納入先CD</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">得意先CD</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">得意先名</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">担当者名</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">納入先名1</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">納入先名2</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">納入先名カナ</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">略記号</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">出荷所要日数</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">郵便番号</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">住所1</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">住所2</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">電話番号</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">FAX番号</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">摘要</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">登録日付</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">登録時間</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">登録者</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">更新日付</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">更新時間</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">更新者</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r">削除FLG</th>
                      <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">納品先名(みつもりナビ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map(r => (
                      <tr key={r.nonyu_cd} className={`hover:bg-blue-50 ${r.del_flg === 1 ? "opacity-50 bg-red-50" : ""}`}>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r font-mono">{r.nonyu_cd}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r font-mono">{toStr(r.tokuicd)}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{toStr(r.tokuinm)}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{toStr(r.tantou_nm)}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{toStr(r.nonyu_nm1)}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{toStr(r.nonyu_nm2)}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{toStr(r.nonyu_kana)}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{toStr(r.nonyu_kigou)}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r text-right">{r.sy_shoyou_nissu}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{toStr(r.yubin_no)}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{toStr(r.address1)}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{toStr(r.address2)}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{toStr(r.tel_no)}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{toStr(r.fax_no)}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{toStr(r.tekiyou)}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{r.dtindt}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{r.dtintm}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{r.dtinuid}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{r.dtupdt}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{r.dtuptm}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r">{r.dtupuid}</td>
                        <td className="px-3 py-2 whitespace-nowrap border-r text-center">
                          {r.del_flg === 1
                            ? <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-xs">削除</span>
                            : <span className="bg-green-100 text-green-600 px-1.5 py-0.5 rounded text-xs">有効</span>}
                        </td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{r.mitsumonavi_nohinsaki_name}</td>
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
