"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Search, Upload, X, CheckCircle, AlertCircle } from "lucide-react"

const GENRE_OPTIONS = ["CD", "BD", "DVD", "その他"]
const SPEC_OPTIONS = ["紙ジャケ", "トレー仕様", "12cmCD", "化粧紙", "その他"]
const HINMOKU_OPTIONS = ["ハコ", "オビ", "ラベル", "スペーサー", "E式ジャケット", "デジ本体", "その他"]

type Condition = { id: string; value: string }
type Child = { id: string; edaban: string; han: string | null; me: string | null; kiri: string | null; men: string | null; sizey: number | null; sizex: number | null; location: string | null }
type Parent = {
  id: string; uid_ntemp: string; kyugataban: string | null
  genre: string | null; spec: string | null; hinmoku: string | null
  sizey: number | null; sizex: number | null; widthy: number | null
  conditions: Condition[]; children: Child[]
}

type ImportStatus = "idle" | "uploading" | "importing" | "done" | "error"

export default function DielinesPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [genre, setGenre] = useState("")
  const [spec, setSpec] = useState("")
  const [hinmoku, setHinmoku] = useState("")
  const [condition, setCondition] = useState("")

  // インポート状態
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle")
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState({ count: 0, total: 0 })
  const [importError, setImportError] = useState("")
  const [showImport, setShowImport] = useState(false)

  const fetchParents = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (genre) params.set("genre", genre)
    if (spec) params.set("spec", spec)
    if (hinmoku) params.set("hinmoku", hinmoku)
    if (condition) params.set("condition", condition)
    if (keyword) params.set("keyword", keyword)
    const res = await fetch(`/api/dlms/dielines?${params.toString()}`)
    const data = await res.json()
    setParents(data)
    setLoading(false)
  }

  useEffect(() => { fetchParents() }, [])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("この型台帳を削除しますか？")) return
    await fetch(`/api/dlms/dielines/${id}`, { method: "DELETE" })
    fetchParents()
  }

  const handleExport = () => {
    const rows = [["型番号", "旧型番号", "ジャンル", "仕様", "品目", "展開たて", "展開よこ", "天地", "左右", "背幅", "条件1", "条件2", "条件3", "条件4"]]
    parents.forEach(p => {
      const conds = p.conditions.map(c => c.value)
      while (conds.length < 4) conds.push("")
      rows.push([
        p.uid_ntemp, p.kyugataban ?? "", p.genre ?? "", p.spec ?? "", p.hinmoku ?? "",
        "", "", p.sizey?.toString() ?? "", p.sizex?.toString() ?? "", p.widthy?.toString() ?? "",
        conds[0], conds[1], conds[2], conds[3],
      ])
    })
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "抜き型台帳.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async () => {
    if (!importFile) return
    setImportStatus("uploading")
    setImportError("")
    setImportProgress({ count: 0, total: 0 })

    try {
      // S3にアップロード
      const presignRes = await fetch("/api/dlms/dielines/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: importFile.name }),
      })
      const { url, key } = await presignRes.json()
      await fetch(url, { method: "PUT", body: importFile, headers: { "Content-Type": "text/csv" } })

      // チャンク処理
      setImportStatus("importing")
      let offset = 0
      let total = 0
      let totalCount = 0

      while (true) {
        const res = await fetch("/api/dlms/dielines/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, offset }),
        })
        const data = await res.json()
        if (!data.ok) throw new Error(data.error ?? "インポートエラー")
        total = data.total
        totalCount += data.count
        offset = data.offset
        setImportProgress({ count: totalCount, total })
        if (data.done) break
      }

      setImportStatus("done")
      fetchParents()
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "エラーが発生しました")
      setImportStatus("error")
    }
  }

  const resetImport = () => {
    setImportStatus("idle")
    setImportFile(null)
    setImportProgress({ count: 0, total: 0 })
    setImportError("")
    setShowImport(false)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">抜き型管理</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImport(v => !v)} className="flex items-center gap-1">
            <Upload className="w-4 h-4" />CSVインポート
          </Button>
          <Button variant="outline" onClick={handleExport} className="flex items-center gap-1">
            <Download className="w-4 h-4" />CSVエクスポート
          </Button>
          <Button onClick={() => router.push("/dashboard/dlms/dielines/new")}>新規登録</Button>
        </div>
      </div>

      {/* インポートパネル */}
      {showImport && (
        <div className="bg-white border rounded-lg p-5 mb-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">CSVインポート</h2>
            <button onClick={resetImport} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-gray-500">
            列順：型番号・旧型番号・ジャンル・仕様・品目・展開たて・展開よこ・天地・左右・背幅・条件1・条件2・条件3・条件4
          </p>

          {importStatus === "idle" && (
            <div>
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${importFile ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                onClick={() => fileInputRef.current?.click()}>
                {importFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-sm text-gray-700 font-medium">{importFile.name}</span>
                    <button onClick={e => { e.stopPropagation(); setImportFile(null) }} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">CSVファイルを選択</p>
                    <p className="text-xs text-gray-400 mt-1">Shift-JIS / UTF-8 対応</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                onChange={e => setImportFile(e.target.files?.[0] ?? null)} />
              <div className="flex justify-end mt-3">
                <Button onClick={handleImport} disabled={!importFile} size="sm">
                  インポート開始
                </Button>
              </div>
            </div>
          )}

          {(importStatus === "uploading" || importStatus === "importing") && (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                {importStatus === "uploading" ? "S3にアップロード中..." : `インポート中... ${importProgress.count} / ${importProgress.total} 件`}
              </div>
              {importProgress.total > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.round(importProgress.count / importProgress.total * 100)}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {importStatus === "done" && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">{importProgress.count}件のインポートが完了しました</span>
              <button onClick={resetImport} className="ml-auto text-xs text-green-600 hover:text-green-800">閉じる</button>
            </div>
          )}

          {importStatus === "error" && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{importError}</span>
              <button onClick={() => setImportStatus("idle")} className="ml-auto text-xs text-red-600 hover:text-red-800">再試行</button>
            </div>
          )}
        </div>
      )}

      {/* 検索 */}
      <div className="bg-white border rounded-lg p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-3">
          <Input value={keyword} onChange={e => setKeyword(e.target.value)}
            placeholder="型番号・旧型番" className="h-8 text-sm" />
          <select value={genre} onChange={e => setGenre(e.target.value)}
            className="h-8 border rounded px-2 text-sm bg-white">
            <option value="">ジャンル：すべて</option>
            {GENRE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={spec} onChange={e => setSpec(e.target.value)}
            className="h-8 border rounded px-2 text-sm bg-white">
            <option value="">仕様：すべて</option>
            {SPEC_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={hinmoku} onChange={e => setHinmoku(e.target.value)}
            className="h-8 border rounded px-2 text-sm bg-white">
            <option value="">品目：すべて</option>
            {HINMOKU_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <Input value={condition} onChange={e => setCondition(e.target.value)}
            placeholder="条件" className="h-8 text-sm" />
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={fetchParents} className="flex items-center gap-1">
            <Search className="w-3 h-3" />検索
          </Button>
        </div>
      </div>

      {/* 一覧 */}
      {loading ? (
        <p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p>
      ) : parents.length === 0 ? (
        <p className="text-center text-gray-500 py-8">データがありません</p>
      ) : (
        <div className="space-y-3">
          {parents.map(p => (
            <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/dashboard/dlms/dielines/${p.id}`)}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-bold text-lg text-gray-800">{p.uid_ntemp}</span>
                      {p.kyugataban && <span className="text-sm text-gray-400">旧：{p.kyugataban}</span>}
                      {[p.genre, p.spec, p.hinmoku].filter(Boolean).map((v, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{v}</span>
                      ))}
                    </div>
                    <div className="flex gap-4 text-sm text-gray-500 flex-wrap">
                      {p.sizey && p.sizex && <span>天地×左右：{p.sizey}×{p.sizex}mm</span>}
                      {p.widthy && <span>背幅：{p.widthy}mm</span>}
                      <span>枝番：{p.children.length}件</span>
                    </div>
                    {p.conditions.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {p.conditions.map(c => (
                          <span key={c.id} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{c.value}</span>
                        ))}
                      </div>
                    )}
                    {p.children.length > 0 && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {p.children.map(c => (
                          <span key={c.id} className="text-xs border border-gray-200 text-gray-500 px-2 py-0.5 rounded">
                            {p.uid_ntemp}-{c.edaban} {[c.han, c.me, c.kiri, c.men].filter(Boolean).join("/")}
                            {c.location && ` [${c.location}]`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4" onClick={e => e.stopPropagation()}>
                    <Button variant="outline" size="sm"
                      onClick={() => router.push(`/dashboard/dlms/dielines/${p.id}`)}>詳細</Button>
                    <Button variant="destructive" size="sm"
                      onClick={e => handleDelete(p.id, e)}>削除</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
