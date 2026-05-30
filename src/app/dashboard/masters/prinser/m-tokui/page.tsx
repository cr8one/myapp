"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Search, Database, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
const CSV_COLUMNS = [
  "tokuicd","tokuinm","tokuinm2","tokuinm3","ryk_nm","tokuikana","del_flg",
  "dtindt","dtintm","dtupdt","dtuptm","aitesaki_bumon_kanji","aitesaki_tantosya",
  "aitesaki_address1","aitesaki_address2","aitesaki_address3","aitesaki_yubin_no",
  "aitesaki_tel_no","tantosya_cd","tiiki_cd","gyosyu_cd","best_juni","kyakusaki_bunrui",
  "gaityu_bunrui","nokyo_kbn","sime_date","zei_kbn","aitesaki_kbn","hon_kari_kbn",
  "president","kabu","oya_tokui_cd","aitesaki_fax_no","group_tokui_cd","seikyum_cd",
  "furikomis_cd","tmail","kagami_flg","ky_mon","ky_dt","zzan_sei_flg","ny_houhou",
  "ny_kamoku_cd","nykoza_cd","fx4_tokui_cd","hasu_kbn","shohizei_kbn","tokuisaki_cd",
  "siten_cd","syk_yobi_flg","mitsumorisho_id","mitsumori_calc_id","syukin_syubetu1",
  "syukin_koza1","syukin_syubetu2","syukin_koza2","syukin_tani","syukin_kingaku",
  "kin_hasu_kbn","zei_marume_tani","mototyo_vis_flg","sony_flg","nohon_kensa_kikaku_id",
  "seikyu_kbn","non_entertainment_flg","smc_online_flg"
]
const PAGE_SIZE = 50
type MTokui = { tokuisaki_cd: string; siten_cd: string; del_flg: number | null; rawData: string | null; importedAt: string }
export default function PrinserMTokuiPage() {
  const router = useRouter()
  const [records, setRecords] = useState<MTokui[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [delFlg, setDelFlg] = useState("")
  const [importing, setImporting] = useState(false)
  const [importMessage, setImportMessage] = useState("")
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fetchRecords = async (p = page) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (keyword) params.set("keyword", keyword)
    if (delFlg) params.set("delFlg", delFlg)
    params.set("page", String(p))
    const res = await fetch(`/api/prinser/m-tokui?${params.toString()}`)
    const data = await res.json()
    setRecords(data.records ?? [])
    setTotalCount(data.total ?? 0)
    setLoading(false)
  }
  useEffect(() => { fetchRecords(1) }, [])
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const handleSearch = () => { setPage(1); fetchRecords(1) }
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportMessage("S3にアップロード中...")
    try {
      const putRes = await fetch("/api/prinser/m-tokui", { method: "PUT" })
      if (!putRes.ok) throw new Error("presigned URL取得失敗")
      const { url, key } = await putRes.json()
      const uploadRes = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": "text/csv" } })
      if (!uploadRes.ok) throw new Error("S3アップロード失敗")
      let offset = 0; let total = 0; let imported = 0
      while (true) {
        setImportMessage(`インポート中... ${imported}${total ? "/" + total : ""}件`)
        const res = await fetch("/api/prinser/m-tokui/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, offset }),
        })
        if (!res.ok) throw new Error(`インポート失敗 (offset: ${offset})`)
        const result = await res.json()
        imported += result.count
        total = result.total ?? total
        if (result.done) break
        offset += result.count
      }
      setImportMessage(`インポート完了：${imported}件`)
      setPage(1); fetchRecords(1)
    } catch (err: any) {
      setImportMessage(`エラー：${err.message}`)
    }
    setImporting(false)
    e.target.value = ""
  }
  const handleDeleteAll = async () => {
    if (!confirm("全レコードを削除しますか？")) return
    await fetch("/api/prinser/m-tokui", { method: "DELETE" })
    setRecords([]); setTotalCount(0); setPage(1)
    setImportMessage("全レコードを削除しました")
  }
  const getVal = (record: MTokui, col: string): string => {
    if (col === "tokuisaki_cd") return record.tokuisaki_cd
    if (col === "siten_cd") return record.siten_cd
    if (col === "del_flg") return record.del_flg?.toString() ?? ""
    if (!record.rawData) return ""
    try { return JSON.parse(record.rawData)[col] ?? "" } catch { return "" }
  }
  return (
    <div className="min-w-0 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">m_tokui</h1>
            <p className="text-sm text-gray-500 mt-1">PRINSER得意先マスタ（{totalCount}件）</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button variant="outline" size="sm"
              onClick={() => router.push("/dashboard/masters/prinser/m-tokui/definition")}
              className="flex items-center gap-1">
              <Database className="w-4 h-4" />DB定義
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeleteAll}
              className="flex items-center gap-1 text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" />全削除
            </Button>
            <Button size="sm" onClick={() => fileInputRef.current?.click()}
              disabled={importing} className="flex items-center gap-1">
              <Upload className="w-4 h-4" />CSVインポート
            </Button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </div>
        </div>
        {importMessage && (
          <p className={`mb-4 text-sm px-4 py-2 rounded ${importMessage.startsWith("エラー") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
            {importMessage}
          </p>
        )}
        <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-40">
              <Input value={keyword} onChange={e => setKeyword(e.target.value)}
                placeholder="得意先CD・得意先名・カナ・メール・電話で検索"
                onKeyDown={e => { if (e.key === "Enter") handleSearch() }}
                autoComplete="off" />
            </div>
            <div>
              <select value={delFlg} onChange={e => setDelFlg(e.target.value)}
                className="h-10 border rounded px-3 text-sm bg-white">
                <option value="">削除フラグ：すべて</option>
                <option value="0">有効（0）</option>
                <option value="1">削除（1）</option>
              </select>
            </div>
            <Button onClick={handleSearch} className="flex items-center gap-1">
              <Search className="w-4 h-4" />検索
            </Button>
          </div>
        </div>
        {loading ? (
          <p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p>
        ) : records.length === 0 ? (
          <p className="text-center text-gray-500 py-8">データがありません。CSVをインポートしてください。</p>
        ) : (
          <>
            <div className="border rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="text-xs bg-white" style={{ minWidth: "max-content" }}>
                  <thead className="bg-gray-50 border-b sticky top-0 z-10">
                    <tr>
                      {CSV_COLUMNS.map(col => (
                        <th key={col} className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap border-r last:border-r-0">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map(r => (
                      <tr key={`${r.tokuisaki_cd}-${r.siten_cd}`}
                        className={`hover:bg-blue-50 ${r.del_flg === 1 ? "opacity-50 bg-red-50" : ""}`}>
                        {CSV_COLUMNS.map(col => {
                          const val = getVal(r, col)
                          if (col === "del_flg") {
                            return (
                              <td key={col} className="px-3 py-2 whitespace-nowrap text-center border-r last:border-r-0">
                                {val === "1"
                                  ? <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-xs">削除</span>
                                  : <span className="bg-green-100 text-green-600 px-1.5 py-0.5 rounded text-xs">有効</span>}
                              </td>
                            )
                          }
                          return (
                            <td key={col} className="px-3 py-2 text-gray-700 whitespace-nowrap border-r last:border-r-0 max-w-[200px] truncate">
                              {val || <span className="text-gray-300">—</span>}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-1 mt-3">
                <p className="text-xs text-gray-400">
                  {totalCount}件中 {(page - 1) * PAGE_SIZE + 1}〜{Math.min(page * PAGE_SIZE, totalCount)}件
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => { const p = page - 1; setPage(p); fetchRecords(p) }} disabled={page === 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-600 px-2">{page} / {totalPages}</span>
                  <button onClick={() => { const p = page + 1; setPage(p); fetchRecords(p) }} disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
