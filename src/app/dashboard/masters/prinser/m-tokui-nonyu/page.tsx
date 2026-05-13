"use client"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Search, Trash2 } from "lucide-react"

const CSV_COLUMNS = [
  "nonyu_cd","tokuicd","tokuinm","tantou_nm","nonyu_nm1","nonyu_nm2",
  "nonyu_kana","nonyu_kigou","sy_shoyou_nissu","yubin_no","address1","address2",
  "tel_no","fax_no","tekiyou","dtindt","dtintm","dtinuid","dtupdt","dtuptm",
  "dtupuid","del_flg","mitsumonavi_nohinsaki_name"
]

type MTokuiNonyu = {
  nonyu_cd: string
  del_flg: number
  rawData: string | null
  importedAt: string
}

export default function PrinserMTokuiNonyuPage() {
  const [records, setRecords] = useState<MTokuiNonyu[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [delFlg, setDelFlg] = useState("")
  const [importing, setImporting] = useState(false)
  const [importMessage, setImportMessage] = useState("")
  const [totalCount, setTotalCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchRecords = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (keyword) params.set("keyword", keyword)
    if (delFlg) params.set("delFlg", delFlg)
    const res = await fetch(`/api/prinser/m-tokui-nonyu?${params.toString()}`)
    const data = await res.json()
    setRecords(data)
    setTotalCount(data.length)
    setLoading(false)
  }

  useEffect(() => { fetchRecords() }, [])

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportMessage("S3にアップロード中...")
    try {
      const putRes = await fetch("/api/prinser/m-tokui-nonyu", { method: "PUT" })
      if (!putRes.ok) throw new Error("presigned URL取得失敗")
      const { url, key } = await putRes.json()
      const uploadRes = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": "text/csv" } })
      if (!uploadRes.ok) throw new Error("S3アップロード失敗")
      let offset = 0
      let total = 0
      let imported = 0
      while (true) {
        setImportMessage(`インポート中... ${imported}${total ? "/" + total : ""}件`)
        const res = await fetch("/api/prinser/m-tokui-nonyu/bulk", {
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
      fetchRecords()
    } catch (err: any) {
      setImportMessage(`エラー：${err.message}`)
    }
    setImporting(false)
    e.target.value = ""
  }

  const handleDeleteAll = async () => {
    if (!confirm("全レコードを削除しますか？")) return
    await fetch("/api/prinser/m-tokui-nonyu", { method: "DELETE" })
    setRecords([])
    setTotalCount(0)
    setImportMessage("全レコードを削除しました")
  }

  const getVal = (record: MTokuiNonyu, col: string): string => {
    if (col === "nonyu_cd") return record.nonyu_cd
    if (col === "del_flg") return record.del_flg?.toString() ?? ""
    if (!record.rawData) return ""
    try {
      const raw = JSON.parse(record.rawData)
      return raw[col] ?? ""
    } catch { return "" }
  }

  return (
    <div className="min-w-0 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">m_tokui_nonyu</h1>
            <p className="text-sm text-gray-500 mt-1">PRINSER納品先マスタ（得意先別）（{totalCount}件）</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
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
                placeholder="納入先CD・名称・カナ・得意先CDで検索"
                onKeyDown={e => { if (e.key === "Enter") fetchRecords() }}
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
            <Button onClick={fetchRecords} className="flex items-center gap-1">
              <Search className="w-4 h-4" />検索
            </Button>
          </div>
        </div>
        {loading ? (
          <p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p>
        ) : records.length === 0 ? (
          <p className="text-center text-gray-500 py-8">データがありません。CSVをインポートしてください。</p>
        ) : (
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
                    <tr key={r.nonyu_cd}
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
        )}
      </div>
    </div>
  )
}
