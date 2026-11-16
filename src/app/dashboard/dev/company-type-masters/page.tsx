"use client"
import { useEffect, useRef, useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KANA_INDEX_GROUPS, toHiragana } from "@/components/ui/searchable-select-modal"
import { toKatakana } from "@/lib/kana"
type TypeMaster = {
  id: string
  name: string
  description?: string | null
  furigana?: string | null
}
const KANA_TABS = ["全", ...KANA_INDEX_GROUPS.map((g) => g.label), "他"]
// 検索用：ひらがな・カタカナの違いと大文字小文字を区別しない
const norm = (s: string) => toHiragana(s).toLowerCase()
export default function DevCompanyTypeMastersPage() {
  const [masters, setMasters] = useState<TypeMaster[]>([])
  const [fetching, setFetching] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<TypeMaster | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [importMessage, setImportMessage] = useState("")
  const [name, setName] = useState("")
  const [furigana, setFurigana] = useState("")
  const [description, setDescription] = useState("")
  const [query, setQuery] = useState("")
  const [kanaGroup, setKanaGroup] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fetchMasters = async () => {
    setFetching(true)
    const res = await fetch("/api/dev/company-type-masters")
    const data = await res.json()
    setMasters(data)
    setFetching(false)
  }
  useEffect(() => { fetchMasters() }, [])
  const resetForm = () => {
    setName(""); setFurigana(""); setDescription("")
    setError(""); setEditTarget(null); setShowForm(false)
  }
  const handleEdit = (master: TypeMaster) => {
    setEditTarget(master)
    setName(master.name)
    setFurigana(master.furigana ?? "")
    setDescription(master.description ?? "")
    setShowForm(true)
  }
  const handleSubmit = async () => {
    if (!name) { setError("種別名は必須です"); return }
    if (!furigana.trim()) { setError("フリガナは必須です"); return }
    setLoading(true); setError("")
    const body = { name, description, furigana }
    const res = editTarget
      ? await fetch(`/api/dev/company-type-masters/${editTarget.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/dev/company-type-masters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? "保存に失敗しました"); setLoading(false); return
    }
    resetForm(); setLoading(false); fetchMasters()
  }
  const handleDelete = async (id: string) => {
    if (!confirm("この種別を削除しますか？\n※この種別を設定している会社からも削除されます")) return
    await fetch(`/api/dev/company-type-masters/${id}`, { method: "DELETE" })
    fetchMasters()
  }
  const handleDeleteAll = async () => {
    if (!confirm(`全${masters.length}件の種別を削除しますか？\nこの操作は取り消せません。`)) return
    await fetch("/api/dev/company-type-masters", { method: "DELETE" })
    fetchMasters()
    setImportMessage("")
  }
  const handleExport = () => {
    const header = "name,furigana,description"
    const rows = masters.map((m) =>
      [`"${m.name}"`, `"${m.furigana ?? ""}"`, `"${m.description ?? ""}"`].join(",")
    )
    const csv = [header, ...rows].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "company_type_masters.csv"; a.click()
    URL.revokeObjectURL(url)
  }
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportMessage("")
    const text = await file.text()
    const lines = text.replace(/\r/g, "").split("\n").filter(Boolean)
    const headers = lines[0].replace(/^\uFEFF/, "").split(",").map((h) => h.trim())
    const rows = lines.slice(1).map((line) => {
      const values: string[] = []
      let current = ""
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') { inQuotes = !inQuotes }
        else if (char === "," && !inQuotes) { values.push(current.trim()); current = "" }
        else { current += char }
      }
      values.push(current.trim())
      const row: Record<string, string> = {}
      headers.forEach((h, i) => { row[h] = values[i] ?? "" })
      return row
    })
    const chunkSize = 100
    let totalCount = 0
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize)
      const res = await fetch("/api/dev/company-type-masters/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: chunk }),
      })
      const data = await res.json()
      if (!res.ok) { setImportMessage(`エラー: ${data.error}`); e.target.value = ""; return }
      totalCount += chunk.length
      setImportMessage(`処理中... ${totalCount}/${rows.length}件`)
    }
    setImportMessage(`${totalCount}件をインポートしました`)
    fetchMasters()
    e.target.value = ""
  }
  // あかさたな絞り込み（「他」は、フリガナが空、または行に当てはまらない文字の種別）
  const matchesKana = (m: TypeMaster) => {
    if (!kanaGroup) return true
    const kana = toHiragana(m.furigana ?? "")
    if (kanaGroup === "他") {
      return !KANA_INDEX_GROUPS.some((g) => g.chars.some((c) => kana.startsWith(c)))
    }
    const group = KANA_INDEX_GROUPS.find((g) => g.label === kanaGroup)
    return group ? group.chars.some((c) => kana.startsWith(c)) : true
  }
  const q = norm(query.trim())
  const filtered = masters.filter((m) =>
    matchesKana(m) &&
    (q === "" ||
      norm(m.name).includes(q) ||
      norm(m.furigana ?? "").includes(q) ||
      norm(m.description ?? "").includes(q))
  )
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex flex-wrap gap-2 justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">種別管理</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="hidden md:inline-flex" onClick={handleExport}>CSVエクスポート</Button>
          <Button variant="outline" className="hidden md:inline-flex" onClick={() => fileInputRef.current?.click()}>CSVインポート</Button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <Button variant="destructive" className="hidden md:inline-flex" onClick={handleDeleteAll}>全件削除</Button>
          <Button onClick={() => { resetForm(); setShowForm(!showForm) }}>
            {showForm ? "キャンセル" : "新規追加"}
          </Button>
        </div>
      </div>
      {importMessage && (
        <p className={`mb-4 text-sm px-4 py-2 rounded ${importMessage.startsWith("エラー") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
          {importMessage}
        </p>
      )}
      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle>{editTarget ? "種別編集" : "種別追加"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>種別名 *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例：OEM生産" />
            </div>
            <div className="space-y-2">
              <Label>フリガナ *</Label>
              <Input
                value={furigana}
                onChange={(e) => setFurigana(e.target.value)}
                onBlur={() => setFurigana(toKatakana(furigana))}
                placeholder="例：オーイーエムセイサン"
              />
              <p className="text-xs text-gray-500">ひらがなで入力してもカタカナに変換されます（一覧の並び順とあかさたな絞り込みに使います）</p>
            </div>
            <div className="space-y-2">
              <Label>説明</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? "処理中..." : editTarget ? "更新する" : "追加する"}
            </Button>
          </CardContent>
        </Card>
      )}
      {fetching ? (
        <p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p>
      ) : masters.length === 0 ? (
        <p className="text-center text-gray-500 py-8">種別が登録されていません</p>
      ) : (
        <>
          <div className="mb-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="種別名・フリガナ・説明で検索"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {KANA_TABS.map((tab) => {
                const active = tab === "全" ? kanaGroup === null : kanaGroup === tab
                return (
                  <Button
                    key={tab}
                    variant={active ? "default" : "outline"}
                    size="sm"
                    className="px-3"
                    onClick={() => setKanaGroup(tab === "全" ? null : tab)}
                  >
                    {tab}
                  </Button>
                )
              })}
            </div>
            <p className="text-xs text-gray-500">
              {filtered.length === masters.length ? `全${masters.length}件` : `全${masters.length}件中 ${filtered.length}件を表示`}
            </p>
          </div>
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-8">該当する種別がありません</p>
          ) : (
            <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
              <table className="w-full table-fixed text-sm min-w-[560px]">
                <colgroup>
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "24%" }} />
                </colgroup>
                <thead>
                  <tr className="bg-gray-50 border-b text-xs text-gray-500">
                    <th className="px-3 py-2 text-left font-medium">種別名</th>
                    <th className="px-3 py-2 text-left font-medium">フリガナ</th>
                    <th className="px-3 py-2 text-left font-medium">説明</th>
                    <th className="px-3 py-2 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((master) => (
                    <tr key={master.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-800">{master.name}</td>
                      <td className="px-3 py-2 text-gray-600 text-xs">
                        {master.furigana || <span className="text-amber-500">未設定</span>}
                      </td>
                      <td className="px-3 py-2 text-gray-600 text-xs">
                        {master.description || <span className="text-gray-300">-</span>}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(master)}>編集</Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(master.id)}>削除</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}