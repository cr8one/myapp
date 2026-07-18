"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download, Search, Upload, X, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react"

const GENRE_OPTIONS = ["CD", "BD", "DVD", "その他"]
const SPEC_OPTIONS = ["紙ジャケ", "トレー仕様", "12cmCD", "化粧紙", "その他"]
const HINMOKU_OPTIONS = ["ハコ", "オビ", "ラベル", "スペーサー", "E式ジャケット", "デジ本体", "その他"]
const PAGE_SIZE = 50

type Child = { id: string; edaban: string; han: string | null; me: string | null; kiri: string | null; men: string | null; sizey: number | null; sizex: number | null; location: string | null }
type Condition = { id: string; value: string }
type Part = { id: string; part_name: string | null; sizey: number | null; sizex: number | null; widthy: number | null; developy: number | null; developx: number | null; develop_depth: number | null; inner_height: number | null; inner_width: number | null; inner_depth: number | null }
type Parent = {
  id: string; uid_ntemp: string; kyugataban: string | null
  genre: string | null; spec: string | null; hinmoku: string | null
  conditions: Condition[]; children: Child[]; parts: Part[]
}
type ImportStatus = "idle" | "uploading" | "importing" | "done" | "error"

export default function DielinesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [parents, setParents] = useState<Parent[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [genre, setGenre] = useState<string[]>([])
  const [spec, setSpec] = useState<string[]>([])
  const [hinmoku, setHinmoku] = useState<string[]>([])
  const [condition, setCondition] = useState("")
  const [mode, setMode] = useState<"AND" | "OR">("AND")
  const [uidFrom, setUidFrom] = useState("")
  const [uidTo, setUidTo] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [sort, setSort] = useState("uid_desc")
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [importStatus, setImportStatus] = useState<ImportStatus>("idle")
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState({ count: 0, total: 0 })
  const [importError, setImportError] = useState("")
  const [showImport, setShowImport] = useState(false)

  const totalPages = Math.ceil(total / PAGE_SIZE)

const buildQuery = (
    p: number,
    kw = keyword, gn = genre, sp = spec, hn = hinmoku, cd = condition,
    md = mode, uf = uidFrom, ut = uidTo, df = dateFrom, dt = dateTo, sr = sort,
  ) => {
    const params = new URLSearchParams()
    if (gn.length > 0) params.set("genre", gn.join(","))
    if (sp.length > 0) params.set("spec", sp.join(","))
    if (hn.length > 0) params.set("hinmoku", hn.join(","))
    if (cd) params.set("condition", cd)
    if (kw) params.set("keyword", kw)
    if (md === "OR") params.set("mode", "OR")
    if (uf) params.set("uidFrom", uf)
    if (ut) params.set("uidTo", ut)
    if (df) params.set("dateFrom", df)
    if (dt) params.set("dateTo", dt)
    if (sr && sr !== "uid_desc") params.set("sort", sr)
    params.set("page", String(p))
    return params
  }
  const fetchParents = async (
    p: number,
    kw = keyword, gn = genre, sp = spec, hn = hinmoku, cd = condition,
    md = mode, uf = uidFrom, ut = uidTo, df = dateFrom, dt = dateTo, sr = sort,
    syncUrl = true,
  ) => {
    setLoading(true)
    const params = buildQuery(p, kw, gn, sp, hn, cd, md, uf, ut, df, dt, sr)
    if (syncUrl) router.replace(`/dashboard/dlms/dielines?${params.toString()}`)
    const res = await fetch(`/api/dlms/dielines?${params.toString()}`)
    const data = await res.json()
    setParents(data.records)
    setTotal(data.total)
    setLoading(false)
  }
  useEffect(() => {
    const p = parseInt(searchParams.get("page") ?? "1")
    const kw = searchParams.get("keyword") ?? ""
    const gn = searchParams.get("genre")?.split(",").filter(Boolean) ?? []
    const sp = searchParams.get("spec")?.split(",").filter(Boolean) ?? []
    const hn = searchParams.get("hinmoku")?.split(",").filter(Boolean) ?? []
    const cd = searchParams.get("condition") ?? ""
    const md = searchParams.get("mode") === "OR" ? "OR" : "AND"
    const uf = searchParams.get("uidFrom") ?? ""
    const ut = searchParams.get("uidTo") ?? ""
    const df = searchParams.get("dateFrom") ?? ""
    const dt = searchParams.get("dateTo") ?? ""
    const sr = searchParams.get("sort") ?? "uid_desc"
    setPage(p); setKeyword(kw); setGenre(gn); setSpec(sp); setHinmoku(hn); setCondition(cd)
    setMode(md); setUidFrom(uf); setUidTo(ut); setDateFrom(df); setDateTo(dt); setSort(sr)
    fetchParents(p, kw, gn, sp, hn, cd, md, uf, ut, df, dt, sr, false)
  }, [searchParams])
  const handleClear = () => {
    setKeyword(""); setGenre([]); setSpec([]); setHinmoku([]); setCondition("")
    setMode("AND"); setUidFrom(""); setUidTo(""); setDateFrom(""); setDateTo(""); setSort("uid_desc")
    setPage(1)
    fetchParents(1, "", [], [], [], "", "AND", "", "", "", "", "uid_desc")
  }

  const handleSearch = () => {
    setPage(1)
    fetchParents(1)
  }

  const handlePage = (next: number) => {
    setPage(next)
    fetchParents(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("この型台帳を削除しますか？")) return
    await fetch(`/api/dlms/dielines/${id}`, { method: "DELETE" })
    fetchParents(page)
  }

    const handleExport = () => {
    const maxConds = Math.max(1, ...parents.map(p => p.conditions.length))
    const condHeaders = Array.from({ length: maxConds }, (_, i) => `条件${i + 1}`)
    const rows = [["型番号", "旧型番号", "ジャンル", "仕様", "品目", ...condHeaders]]
    parents.forEach(p => {
      const conds = p.conditions.map(c => c.value)
      while (conds.length < maxConds) conds.push("")
      rows.push([
        p.uid_ntemp, p.kyugataban ?? "", p.genre ?? "", p.spec ?? "", p.hinmoku ?? "",
        ...conds,
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
      const presignRes = await fetch("/api/dlms/dielines/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: importFile.name }),
      })
      const { url, key } = await presignRes.json()
      await fetch(url, { method: "PUT", body: importFile, headers: { "Content-Type": "text/csv" } })
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
      fetchParents(1)
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "エラーが発生しました")
      setImportStatus("error")
    }
  }

  const [showChildrenImport, setShowChildrenImport] = useState(false)
  const [childrenImportFile, setChildrenImportFile] = useState<File | null>(null)
  const [childrenImportStatus, setChildrenImportStatus] = useState<ImportStatus>("idle")
  const [childrenImportProgress, setChildrenImportProgress] = useState({ count: 0, total: 0 })
  const [childrenImportError, setChildrenImportError] = useState("")
  const childrenImportRef = useRef<HTMLInputElement>(null)

  const handleChildrenExport = () => { window.location.href = "/api/dlms/dielines/children-export" }

  const handleChildrenImport = async () => {
    if (!childrenImportFile) return
    setChildrenImportStatus("uploading")
    setChildrenImportError("")
    setChildrenImportProgress({ count: 0, total: 0 })
    try {
      const presignRes = await fetch("/api/dlms/dielines/children-presign", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: childrenImportFile.name }),
      })
      const { url, key } = await presignRes.json()
      await fetch(url, { method: "PUT", body: childrenImportFile, headers: { "Content-Type": "text/csv" } })
      setChildrenImportStatus("importing")
      let offset = 0; let total = 0; let totalCount = 0
      while (true) {
        const res = await fetch("/api/dlms/dielines/children-import", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, offset }),
        })
        const data = await res.json()
        if (!data.ok) throw new Error(data.error ?? "インポートエラー")
        total = data.total; totalCount += data.count; offset = data.offset
        setChildrenImportProgress({ count: totalCount, total })
        if (data.done) break
      }
      setChildrenImportStatus("done")
      fetchParents(1)
    } catch (e) {
      setChildrenImportError(e instanceof Error ? e.message : "エラーが発生しました")
      setChildrenImportStatus("error")
    }
  }

  const resetChildrenImport = () => {
    setChildrenImportStatus("idle")
    setChildrenImportFile(null)
    setChildrenImportProgress({ count: 0, total: 0 })
    setChildrenImportError("")
    setShowChildrenImport(false)
  }

  const resetImport = () => {
    setImportStatus("idle")
    setImportFile(null)
    setImportProgress({ count: 0, total: 0 })
    setImportError("")
    setShowImport(false)
  }

  const [showPartsImport, setShowPartsImport] = useState(false)
  const [partsImportFile, setPartsImportFile] = useState<File | null>(null)
  const [partsImportStatus, setPartsImportStatus] = useState<ImportStatus>("idle")
  const [partsImportProgress, setPartsImportProgress] = useState({ count: 0, total: 0 })
  const [partsImportError, setPartsImportError] = useState("")
  const partsImportRef = useRef<HTMLInputElement>(null)
  const handlePartsExport = () => { window.location.href = "/api/dlms/dielines/parts-export" }
  const handlePartsImport = async () => {
    if (!partsImportFile) return
    setPartsImportStatus("uploading")
    setPartsImportError("")
    setPartsImportProgress({ count: 0, total: 0 })
    try {
      const presignRes = await fetch("/api/dlms/dielines/presign", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: partsImportFile.name }),
      })
      const { url, key } = await presignRes.json()
      await fetch(url, { method: "PUT", body: partsImportFile, headers: { "Content-Type": "text/csv" } })
      setPartsImportStatus("importing")
      let offset = 0; let total = 0; let totalCount = 0
      while (true) {
        const res = await fetch("/api/dlms/dielines/import", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, offset, type: "parts" }),
        })
        const data = await res.json()
        if (!data.ok) throw new Error(data.error ?? "インポートエラー")
        total = data.total; totalCount += data.count; offset = data.offset
        setPartsImportProgress({ count: totalCount, total })
        if (data.done) break
      }
      setPartsImportStatus("done")
      fetchParents(1)
    } catch (e) {
      setPartsImportError(e instanceof Error ? e.message : "エラーが発生しました")
      setPartsImportStatus("error")
    }
  }
  const resetPartsImport = () => {
    setPartsImportStatus("idle")
    setPartsImportFile(null)
    setPartsImportProgress({ count: 0, total: 0 })
    setPartsImportError("")
    setShowPartsImport(false)
  }

  const Pagination = () => (
    <div className="flex items-center justify-between py-3 px-1">
      <p className="text-sm text-gray-500">
        全 {total} 件中 {(page - 1) * PAGE_SIZE + 1}〜{Math.min(page * PAGE_SIZE, total)} 件表示
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => handlePage(page - 1)} disabled={page <= 1}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm px-3">{page} / {totalPages}</span>
        <Button variant="outline" size="sm" onClick={() => handlePage(page + 1)} disabled={page >= totalPages}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

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
          <Button variant="outline" onClick={() => setShowChildrenImport(v => !v)} className="flex items-center gap-1">
            <Upload className="w-4 h-4" />枝番インポート
          </Button>
          <Button variant="outline" onClick={handleChildrenExport} className="flex items-center gap-1">
            <Download className="w-4 h-4" />枝番エクスポート
          </Button>
          <Button variant="outline" onClick={() => setShowPartsImport(v => !v)} className="flex items-center gap-1">
            <Upload className="w-4 h-4" />パーツインポート
          </Button>
          <Button variant="outline" onClick={handlePartsExport} className="flex items-center gap-1">
            <Download className="w-4 h-4" />パーツエクスポート
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
            列順：型番号・旧型番号・ジャンル・仕様・品目・展開たて・展開よこ・天地・左右・背幅・条件1・条件2...（条件数に応じて動的）
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
                <Button onClick={handleImport} disabled={!importFile} size="sm">インポート開始</Button>
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
                  <div className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.round(importProgress.count / importProgress.total * 100)}%` }} />
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

      {/* 枝番インポートパネル */}
      {showChildrenImport && (
        <div className="bg-white border rounded-lg p-5 mb-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">枝番CSVインポート</h2>
            <button onClick={resetChildrenImport} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-gray-500">
            列順：型番号・枝番・判・目・切・面・天地(mm)・左右(mm)・咥え(mm)・所在
          </p>
          {childrenImportStatus === "idle" && (
            <div className="space-y-3">
              <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${childrenImportFile ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setChildrenImportFile(f) }}>
                {childrenImportFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-gray-700 font-medium">{childrenImportFile.name}</span>
                    <button onClick={() => setChildrenImportFile(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500">CSVファイルをドラッグ＆ドロップ</p>
                    <label className="mt-2 inline-block cursor-pointer text-blue-600 text-sm hover:underline">
                      またはファイルを選択
                      <input ref={childrenImportRef} type="file" accept=".csv" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) setChildrenImportFile(f) }} />
                    </label>
                  </div>
                )}
              </div>
              <Button onClick={handleChildrenImport} disabled={!childrenImportFile} size="sm">インポート開始</Button>
            </div>
          )}
          {(childrenImportStatus === "uploading" || childrenImportStatus === "importing") && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">{childrenImportStatus === "uploading" ? "S3にアップロード中..." : `インポート中... ${childrenImportProgress.count} / ${childrenImportProgress.total} 件`}</p>
              {childrenImportProgress.total > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.round(childrenImportProgress.count / childrenImportProgress.total * 100)}%` }} />
                </div>
              )}
            </div>
          )}
          {childrenImportStatus === "done" && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">{childrenImportProgress.count}件のインポートが完了しました</span>
              <button onClick={resetChildrenImport} className="ml-auto text-sm text-gray-500 hover:text-gray-700">閉じる</button>
            </div>
          )}
          {childrenImportStatus === "error" && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{childrenImportError}</span>
              <button onClick={resetChildrenImport} className="ml-auto text-sm text-gray-500 hover:text-gray-700">閉じる</button>
            </div>
          )}
        </div>
      )}

      {/* パーツインポートパネル */}
      {showPartsImport && (
        <div className="bg-white border rounded-lg p-5 mb-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">パーツCSVインポート</h2>
            <button onClick={resetPartsImport} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-gray-500">
            列順：型番号・パーツ名・展開天地・展開左右・展開背・仕上げ背・仕上げ高さ・仕上げ奥行き・内寸背・内寸高さ・内寸奥行き
          </p>
          {partsImportStatus === "idle" && (
            <div className="space-y-3">
              <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${partsImportFile ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                onClick={() => partsImportRef.current?.click()}>
                {partsImportFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-gray-700 font-medium">{partsImportFile.name}</span>
                    <button onClick={e => { e.stopPropagation(); setPartsImportFile(null) }} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">CSVファイルを選択</p>
                  </>
                )}
              </div>
              <input ref={partsImportRef} type="file" accept=".csv" className="hidden"
                onChange={e => setPartsImportFile(e.target.files?.[0] ?? null)} />
              <div className="flex justify-end">
                <Button onClick={handlePartsImport} disabled={!partsImportFile} size="sm">インポート開始</Button>
              </div>
            </div>
          )}
          {(partsImportStatus === "uploading" || partsImportStatus === "importing") && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">{partsImportStatus === "uploading" ? "S3にアップロード中..." : `インポート中... ${partsImportProgress.count} / ${partsImportProgress.total} 件`}</p>
              {partsImportProgress.total > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.round(partsImportProgress.count / partsImportProgress.total * 100)}%` }} />
                </div>
              )}
            </div>
          )}
          {partsImportStatus === "done" && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">{partsImportProgress.count}件のインポートが完了しました</span>
              <button onClick={resetPartsImport} className="ml-auto text-xs text-green-600 hover:text-green-800">閉じる</button>
            </div>
          )}
          {partsImportStatus === "error" && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{partsImportError}</span>
              <button onClick={() => setPartsImportStatus("idle")} className="ml-auto text-xs text-red-600 hover:text-red-800">再試行</button>
            </div>
          )}
        </div>
      )}
      {/* 検索 */}
      <div className="bg-white border rounded-lg p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mb-3">
          <Input value={keyword} onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="型番号・旧型番" className="h-8 text-sm" autoComplete="off" />
          <Input value={condition} onChange={e => setCondition(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="条件" className="h-8 text-sm" autoComplete="off" />
          <div className="flex items-center gap-1 justify-end">
            <span className="text-xs text-gray-400 mr-1">絞り込み条件：</span>
            <button
              onClick={() => setMode("AND")}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${mode === "AND" ? "bg-gray-800 text-white border-gray-800" : "bg-white border-gray-200 text-gray-500"}`}
            >AND</button>
            <button
              onClick={() => setMode("OR")}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${mode === "OR" ? "bg-gray-800 text-white border-gray-800" : "bg-white border-gray-200 text-gray-500"}`}
            >OR</button>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400 w-12">ジャンル</span>
            {GENRE_OPTIONS.map(o => (
              <button key={o} onClick={() => setGenre(g => g.includes(o) ? g.filter(v => v !== o) : [...g, o])}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${genre.includes(o) ? "bg-orange-600 text-white border-orange-600" : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"}`}>
                {o}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400 w-12">仕様</span>
            {SPEC_OPTIONS.map(o => (
              <button key={o} onClick={() => setSpec(g => g.includes(o) ? g.filter(v => v !== o) : [...g, o])}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${spec.includes(o) ? "bg-orange-600 text-white border-orange-600" : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"}`}>
                {o}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400 w-12">品目</span>
            {HINMOKU_OPTIONS.map(o => (
              <button key={o} onClick={() => setHinmoku(g => g.includes(o) ? g.filter(v => v !== o) : [...g, o])}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${hinmoku.includes(o) ? "bg-orange-600 text-white border-orange-600" : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"}`}>
                {o}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => setShowAdvanced(v => !v)} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" />詳細検索{showAdvanced ? "を閉じる" : ""}
          </button>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={handleClear} className="flex items-center gap-1">
              <X className="w-3 h-3" />クリア
            </Button>
            <Button size="sm" onClick={handleSearch} className="flex items-center gap-1">
              <Search className="w-3 h-3" />検索
            </Button>
          </div>
        </div>

        {showAdvanced && (
          <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">型番号（範囲）</label>
              <div className="flex items-center gap-1">
                <Input value={uidFrom} onChange={e => setUidFrom(e.target.value)}
                  placeholder="以上" className="h-8 text-sm" autoComplete="off" />
                <span className="text-xs text-gray-400">〜</span>
                <Input value={uidTo} onChange={e => setUidTo(e.target.value)}
                  placeholder="以下" className="h-8 text-sm" autoComplete="off" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">作成日（範囲）</label>
              <div className="flex items-center gap-1">
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="h-8 text-sm" autoComplete="off" />
                <span className="text-xs text-gray-400">〜</span>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="h-8 text-sm" autoComplete="off" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">並び順</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: "uid_desc", label: "型番号（降順）" },
                  { key: "uid_asc", label: "型番号（昇順）" },
                  { key: "date_desc", label: "作成日（新しい順）" },
                  { key: "date_asc", label: "作成日（古い順）" },
                ].map(s => (
                  <button key={s.key} onClick={() => setSort(s.key)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${sort === s.key ? "bg-gray-800 text-white border-gray-800" : "bg-white border-gray-200 text-gray-500"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* 一覧 */}

      {loading ? (
        <p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p>
      ) : parents.length === 0 ? (
        <p className="text-center text-gray-500 py-8">データがありません</p>
      ) : (
        <>
          <Pagination />
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col style={{ width: "14%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "20%" }} />
              </colgroup>
              <thead>
                <tr className="bg-gray-50 border-b text-xs text-gray-500">
                  <th className="px-3 py-2 text-left font-medium">型番号</th>
                  <th className="px-3 py-2 text-left font-medium">ジャンル/仕様/品目</th>
                  <th className="px-3 py-2 text-left font-medium">条件</th>
                  <th className="px-3 py-2 text-left font-medium">サイズ</th>
                  <th className="px-3 py-2 text-left font-medium">パーツ/枝番</th>
                  <th className="px-3 py-2 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {parents.map(p => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/dlms/dielines/${p.id}?${buildQuery(page).toString()}`)}>
                    <td className="px-3 py-2">
                      <div className="font-bold text-gray-800">{p.uid_ntemp}</div>
                      {p.kyugataban && <div className="text-xs text-gray-400">旧：{p.kyugataban}</div>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 flex-wrap">
                        {[p.genre, p.spec, p.hinmoku].filter(Boolean).map((v, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{v}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 flex-wrap">
                        {p.conditions.map(c => (
                          <span key={c.id} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{c.value}</span>
                        ))}
                        {p.conditions.length === 0 && <span className="text-xs text-gray-300">-</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-600 text-xs">
                      {p.parts.length > 0 && p.parts[0].sizey && p.parts[0].sizex ? (
                        <div>天地×左右：{p.parts[0].sizey}×{p.parts[0].sizex}mm</div>
                      ) : <div className="text-gray-300">-</div>}
                      {p.parts.length > 0 && p.parts[0].widthy && <div>背幅：{p.parts[0].widthy}mm</div>}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {p.parts.length > 1 && <div className="text-orange-600 font-medium">パーツ{p.parts.length}件</div>}
                      <div>枝番：{p.children.length}件</div>
                    </td>
                    <td className="px-3 py-2 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm"
                          onClick={() => router.push(`/dashboard/dlms/dielines/${p.id}?${buildQuery(page).toString()}`)}>詳細</Button>
                        <Button variant="destructive" size="sm"
                          onClick={e => handleDelete(p.id, e)}>削除</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination />
        </>
      )}
    </div>
  )
}
