"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Search, Database, Trash2 } from "lucide-react"

type MUser = {
  uid: string
  unm: string | null
  ukana: string | null
  kencd: string | null
  bumon_cd: string | null
  umail: string | null
  utel: string | null
  ulevel: string | null
  ukbn: string | null
  del_flg: string | null
  kanribumon: string | null
  jimusyo: string | null
  importedAt: string
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r/g, "").split("\n").filter(Boolean)
  const headers = lines[0].replace(/^\uFEFF/, "").split(",").map(h => h.trim().replace(/^"|"$/g, ""))
  return lines.slice(1).map(line => {
    const values: string[] = []
    let current = ""
    let inQuotes = false
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes }
      else if (char === "," && !inQuotes) { values.push(current.trim()); current = "" }
      else { current += char }
    }
    values.push(current.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? "" })
    return row
  })
}

export default function PrinserMUserPage() {
  const router = useRouter()
  const [users, setUsers] = useState<MUser[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [delFlg, setDelFlg] = useState("")
  const [importing, setImporting] = useState(false)
  const [importMessage, setImportMessage] = useState("")
  const [totalCount, setTotalCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchUsers = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (keyword) params.set("keyword", keyword)
    if (delFlg) params.set("delFlg", delFlg)
    const res = await fetch(`/api/prinser/m-user?${params.toString()}`)
    const data = await res.json()
    setUsers(data)
    setTotalCount(data.length)
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportMessage("")
    try {
      const text = await file.text()
      const records = parseCsv(text)
      if (records.length === 0) {
        setImportMessage("エラー：レコードが見つかりません")
        setImporting(false)
        return
      }
      const chunkSize = 50
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize)
        const res = await fetch("/api/prinser/m-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records: chunk }),
        })
        if (!res.ok) {
          const data = await res.json()
          setImportMessage(`エラー：${data.error}`)
          setImporting(false)
          e.target.value = ""
          return
        }
        setImportMessage(`インポート中... ${Math.min(i + chunkSize, records.length)}/${records.length}件`)
      }
      setImportMessage(`インポート完了：${records.length}件`)
      fetchUsers()
    } catch {
      setImportMessage("エラー：CSVの読み込みに失敗しました")
    }
    setImporting(false)
    e.target.value = ""
  }

  const handleDeleteAll = async () => {
    if (!confirm("全レコードを削除しますか？次回インポート時に再取り込みできます。")) return
    await fetch("/api/prinser/m-user", { method: "DELETE" })
    setUsers([])
    setTotalCount(0)
    setImportMessage("全レコードを削除しました")
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">m_user</h1>
          <p className="text-sm text-gray-500 mt-1">PRINSERユーザーマスタ（{totalCount}件）</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/masters/prinser/m-user/definition")}
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

      {/* 検索 */}
      <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Input value={keyword} onChange={e => setKeyword(e.target.value)}
              placeholder="UID・氏名・カナ・メール・部門で検索"
              onKeyDown={e => { if (e.key === "Enter") fetchUsers() }}
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
          <Button onClick={fetchUsers} className="flex items-center gap-1">
            <Search className="w-4 h-4" />検索
          </Button>
        </div>
      </div>

      {/* 一覧 */}
      {loading ? (
        <p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p>
      ) : users.length === 0 ? (
        <p className="text-center text-gray-500 py-8">データがありません。CSVをインポートしてください。</p>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">UID</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">氏名</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">カナ</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">部門CD</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">管理部門</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">事務所</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">メール</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">電話</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">レベル</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">削除</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.uid} className={`hover:bg-gray-50 ${u.del_flg === "1" ? "opacity-50" : ""}`}>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-700 whitespace-nowrap">{u.uid}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">{u.unm ?? "—"}</td>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{u.ukana ?? "—"}</td>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{u.bumon_cd ?? "—"}</td>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{u.kanribumon ?? "—"}</td>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{u.jimusyo ?? "—"}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs">{u.umail ?? "—"}</td>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{u.utel ?? "—"}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-center">{u.ulevel ?? "—"}</td>
                    <td className="px-4 py-2.5 text-center">
                      {u.del_flg === "1"
                        ? <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">削除</span>
                        : <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded">有効</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
