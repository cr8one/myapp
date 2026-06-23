"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Pencil, Trash2, Download, Upload, X, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Database } from "lucide-react"

const PROGRESS_OPTIONS = ["保留", "入稿待ち", "入稿済", "製版中", "製版済", "出力中", "出力済", "印刷中", "印刷済", "完了"]
const KOSEI_OPTIONS = ["初校", "再校", "三校", "四校", "五校", "六校", "七校", "八校", "九校"]
const PROGRESS_COLORS: Record<string, string> = {
  "保留":    "bg-gray-100 text-gray-500",
  "入稿待ち": "bg-yellow-100 text-yellow-700",
  "入稿済":  "bg-blue-100 text-blue-700",
  "製版中":  "bg-orange-100 text-orange-700",
  "製版済":  "bg-cyan-100 text-cyan-700",
  "出力中":  "bg-purple-100 text-purple-700",
  "出力済":  "bg-indigo-100 text-indigo-700",
  "印刷中":  "bg-pink-100 text-pink-700",
  "印刷済":  "bg-green-100 text-green-700",
  "完了":    "bg-gray-200 text-gray-600",
}

type DppSchedule = {
  id: string; schedule_no: string; hinban: string | null; hinmei: string | null
  artist_name: string | null; kosei_stage: string | null
  nouki_date: string | null; nouki_time: string | null
  progress: string | null; eigyo_tanto: string | null; seihan_tanto: string | null
  biko: string | null; shuukei_daisuu: number | null
}
type DppMaster = { id: number; name: string; is_active: boolean }

const PAGE_SIZE = 50
type ImportStatus = "idle" | "uploading" | "importing" | "done" | "error"
const DIRECT_INPUT = "__direct__"

const emptyForm = {
  hinban: "", hinmei: "", artist_name: "", kosei_stage: "初校",
  nouki_date: "", nouki_time: "", progress: "入稿待ち",
  eigyo_tanto: "", seihan_tanto: "", biko: "", shuukei_daisuu: "",
}

// 担当者選択コンポーネント
function TantoSelect({ label, value, onChange, suggestions }: {
  label: string
  value: string
  onChange: (v: string) => void
  suggestions: string[]
}) {
  const isInSuggestions = suggestions.includes(value)
  const selectValue = value === "" ? "" : isInSuggestions ? value : DIRECT_INPUT

  const handleSelectChange = (v: string) => {
    if (v === DIRECT_INPUT) {
      onChange("")
    } else {
      onChange(v)
    }
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <select
        value={selectValue}
        onChange={e => handleSelectChange(e.target.value)}
        className="w-full h-8 border rounded px-2 text-sm bg-white"
      >
        <option value="">—</option>
        {suggestions.map(s => <option key={s} value={s}>{s}</option>)}
        <option value={DIRECT_INPUT}>直接入力...</option>
      </select>
      {selectValue === DIRECT_INPUT && (
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="直接入力"
          autoComplete="off"
          className="h-8 text-sm mt-1"
          autoFocus
        />
      )}
    </div>
  )
}

export default function DppPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [records, setRecords] = useState<DppSchedule[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(parseInt(searchParams.get("page") ?? "1"))
  const [eigyoMasters, setEigyoMasters] = useState<DppMaster[]>([])
  const [seihanMasters, setSeihanMasters] = useState<DppMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "")
  const [progressFilter, setProgressFilter] = useState(searchParams.get("progress") ?? "")
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<DppSchedule | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DppSchedule | null>(null)
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle")
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState({ count: 0, total: 0 })
  const [importError, setImportError] = useState("")
  const [showImport, setShowImport] = useState(false)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const buildQuery = (p: number, kw = keyword, pf = progressFilter) => {
    const params = new URLSearchParams()
    if (kw) params.set("keyword", kw)
    if (pf) params.set("progress", pf)
    params.set("page", String(p))
    return params
  }
  const fetchRecords = async (p = page, kw = keyword, pf = progressFilter, syncUrl = true) => {
    setLoading(true)
    const params = buildQuery(p, kw, pf)
    if (syncUrl) router.replace(`/dashboard/dpp?${params.toString()}`)
    const res = await fetch(`/api/dpp/schedules?${params.toString()}`)
    const data = await res.json()
    setRecords(data.records)
    setTotal(data.total)
    setLoading(false)
  }

  useEffect(() => {
    const p = parseInt(searchParams.get("page") ?? "1")
    const kw = searchParams.get("keyword") ?? ""
    const pf = searchParams.get("progress") ?? ""
    setPage(p); setKeyword(kw); setProgressFilter(pf)
    fetchRecords(p, kw, pf, false)
    fetch("/api/dpp/masters?type=eigyo").then(r => r.json()).then(setEigyoMasters)
    fetch("/api/dpp/masters?type=seihan").then(r => r.json()).then(setSeihanMasters)
  }, [searchParams])

  const handleSearch = () => {
    setPage(1)
    fetchRecords(1)
  }
  const handlePage = (next: number) => {
    setPage(next)
    fetchRecords(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  const handleExport = () => {
    const params = buildQuery(1)
    params.delete("page")
    window.open(`/api/dpp/schedules/export?${params.toString()}`, "_blank")
  }
  const handleImport = async () => {
    if (!importFile) return
    setImportStatus("uploading")
    setImportError("")
    setImportProgress({ count: 0, total: 0 })
    try {
      const presignRes = await fetch("/api/dpp/schedules/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: importFile.name }),
      })
      const { url, key } = await presignRes.json()
      await fetch(url, { method: "PUT", body: importFile, headers: { "Content-Type": "text/csv" } })
      setImportStatus("importing")
      let offset = 0
      let total = 0
      while (true) {
        const res = await fetch("/api/dpp/schedules/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, offset }),
        })
        const data = await res.json()
        total = data.total
        offset = data.offset
        setImportProgress({ count: offset, total })
        if (data.done) break
      }
      setImportStatus("done")
      fetchRecords(1)
    } catch {
      setImportStatus("error")
      setImportError("インポート中にエラーが発生しました")
    }
  }
  const resetImport = () => {
    setImportStatus("idle")
    setImportFile(null)
    setImportProgress({ count: 0, total: 0 })
    setImportError("")
    setShowImport(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }
  const [showKikan, setShowKikan] = useState(false)
  const [kikanFrom, setKikanFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7)
    return d.toLocaleDateString("sv-SE")
  })
  const [kikanTo, setKikanTo] = useState(() => new Date().toLocaleDateString("sv-SE"))
  const [kikanResults, setKikanResults] = useState<Record<string, string>[]>([])
  const [kikanSelected, setKikanSelected] = useState<string[]>([])
  const [kikanLoading, setKikanLoading] = useState(false)
  const [kikanImporting, setKikanImporting] = useState(false)
  const [kikanMessage, setKikanMessage] = useState("")

  const handleKikanSearch = async () => {
    setKikanLoading(true)
    setKikanMessage("")
    setKikanResults([])
    setKikanSelected([])
    const from = kikanFrom.replace(/-/g, "/")
    const to = kikanTo.replace(/-/g, "/")
    const res = await fetch(`/api/dpp/kikan/search?from=${from}&to=${to}`)
    if (!res.ok) { setKikanMessage("取得エラー"); setKikanLoading(false); return }
    const data = await res.json()
    setKikanResults(data)
    setKikanMessage(`${data.length}件取得しました`)
    setKikanLoading(false)
  }

  const handleKikanImport = async () => {
    if (kikanSelected.length === 0) return
    setKikanImporting(true)
    setKikanMessage("")
    const res = await fetch("/api/dpp/kikan/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ knoList: kikanSelected }),
    })
    const data = await res.json()
    const ok = data.results?.filter((r: Record<string, string>) => r.status === "ok").length ?? 0
    setKikanMessage(`${ok}件取り込みました`)
    setKikanSelected([])
    setKikanImporting(false)
  }

  const Pagination = () => (
    <div className="flex items-center justify-between mb-3 px-1">
      <span className="text-xs text-gray-400">{total}件中 {(page - 1) * PAGE_SIZE + 1}〜{Math.min(page * PAGE_SIZE, total)}件</span>
      <div className="flex items-center gap-1">
        <button onClick={() => handlePage(page - 1)} disabled={page <= 1}
          className="p-1.5 rounded border text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-500 px-2">{page} / {totalPages || 1}</span>
        <button onClick={() => handlePage(page + 1)} disabled={page >= totalPages}
          className="p-1.5 rounded border text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  const eigyoSuggestions = eigyoMasters.filter(m => m.is_active).map(m => m.name)
  const seihanSuggestions = seihanMasters.filter(m => m.is_active).map(m => m.name)

  const openCreate = () => {
    setEditTarget(null)
    setForm({ ...emptyForm, nouki_date: new Date().toISOString().split("T")[0] })
    setModalOpen(true)
  }

  const openEdit = (r: DppSchedule) => {
    setEditTarget(r)
    setForm({
      hinban: r.hinban ?? "", hinmei: r.hinmei ?? "",
      artist_name: r.artist_name ?? "", kosei_stage: r.kosei_stage ?? "初校",
      nouki_date: r.nouki_date ? r.nouki_date.split("T")[0] : "",
      nouki_time: r.nouki_time ?? "", progress: r.progress ?? "入稿待ち",
      eigyo_tanto: r.eigyo_tanto ?? "", seihan_tanto: r.seihan_tanto ?? "",
      biko: r.biko ?? "", shuukei_daisuu: r.shuukei_daisuu?.toString() ?? "",
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editTarget) {
        await fetch("/api/dpp/schedules", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editTarget.id, ...form }),
        })
      } else {
        await fetch("/api/dpp/schedules", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      }
      setModalOpen(false)
      fetchRecords()
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await fetch("/api/dpp/schedules", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id }),
    })
    setDeleteTarget(null)
    fetchRecords()
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">DPP予定表</h1>
          <p className="text-sm text-gray-500 mt-1">{total}件</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="flex items-center gap-1.5">
            <Download className="w-4 h-4" />CSV出力
          </Button>
          <Button variant="outline" onClick={() => setShowImport(s => !s)} className="flex items-center gap-1.5">
            <Upload className="w-4 h-4" />CSV取込
          </Button>
          <Button variant="outline" onClick={() => { setShowKikan(s => !s); setShowImport(false) }} className="flex items-center gap-1.5">
            <Database className="w-4 h-4" />基幹取込
          </Button>
          <Button onClick={openCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />新規登録
          </Button>
        </div>
      </div>
      {showKikan && (
        <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">更新日付</label>
              <input type="date" value={kikanFrom} onChange={e => setKikanFrom(e.target.value)}
                className="h-8 border rounded px-2 text-sm" />
              <span className="text-xs text-gray-400">〜</span>
              <input type="date" value={kikanTo} onChange={e => setKikanTo(e.target.value)}
                className="h-8 border rounded px-2 text-sm" />
            </div>
            <Button size="sm" onClick={handleKikanSearch} disabled={kikanLoading}>
              {kikanLoading ? "検索中..." : "検索"}
            </Button>
            {kikanSelected.length > 0 && (
              <Button size="sm" onClick={handleKikanImport} disabled={kikanImporting} className="bg-green-600 hover:bg-green-700">
                {kikanImporting ? "取込中..." : `${kikanSelected.length}件を取込`}
              </Button>
            )}
            <button onClick={() => setShowKikan(false)} className="ml-auto text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          {kikanMessage && <p className="text-xs text-gray-500">{kikanMessage}</p>}
          {kikanResults.length > 0 && (
            <div className="overflow-x-auto max-h-80 overflow-y-auto border rounded">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-1.5 text-left">
                      <input type="checkbox"
                        checked={kikanSelected.length === kikanResults.length}
                        onChange={e => setKikanSelected(e.target.checked ? kikanResults.map(r => r.kno) : [])} />
                    </th>
                    <th className="px-2 py-1.5 text-left text-gray-600">受注No</th>
                    <th className="px-2 py-1.5 text-left text-gray-600">品名</th>
                    <th className="px-2 py-1.5 text-left text-gray-600">得意先</th>
                    <th className="px-2 py-1.5 text-left text-gray-600">担当者</th>
                    <th className="px-2 py-1.5 text-left text-gray-600">納期</th>
                    <th className="px-2 py-1.5 text-left text-gray-600">更新日</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {kikanResults.map(r => (
                    <tr key={r.kno} className="hover:bg-blue-50">
                      <td className="px-2 py-1.5">
                        <input type="checkbox"
                          checked={kikanSelected.includes(r.kno)}
                          onChange={e => setKikanSelected(prev =>
                            e.target.checked ? [...prev, r.kno] : prev.filter(k => k !== r.kno)
                          )} />
                      </td>
                      <td className="px-2 py-1.5 font-mono text-gray-700">{r.kno}</td>
                      <td className="px-2 py-1.5 text-gray-600 max-w-[160px] truncate">{r.ttl_hinmei3 ?? "—"}</td>
                      <td className="px-2 py-1.5 text-gray-600">{r.ttl_tokuname1 ?? "—"}</td>
                      <td className="px-2 py-1.5 text-gray-600">{r.ttl_m_tantoname ?? "—"}</td>
                      <td className="px-2 py-1.5 text-gray-600">{r.ttl_nonyudate ?? "—"}</td>
                      <td className="px-2 py-1.5 text-gray-400">{r.dtupdt ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {showImport && (
        <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm space-y-3">
          {importStatus === "idle" && (
            <div className="flex items-center gap-3">
              <input ref={fileInputRef} type="file" accept=".csv"
                onChange={e => setImportFile(e.target.files?.[0] ?? null)}
                className="text-sm flex-1" />
              <Button size="sm" onClick={handleImport} disabled={!importFile}>取込開始</Button>
              <button onClick={resetImport} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
          )}
          {(importStatus === "uploading" || importStatus === "importing") && (
            <div className="flex items-center gap-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <span className="text-sm animate-pulse">
                {importStatus === "uploading" ? "アップロード中..." : `インポート中... ${importProgress.count}/${importProgress.total}件`}
              </span>
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

      <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-48">
            <Input value={keyword} onChange={e => setKeyword(e.target.value)}
              placeholder="品番・品名・アーティスト・担当者で検索"
              onKeyDown={e => { if (e.key === "Enter") fetchRecords() }}
              autoComplete="off" />
          </div>
          <select value={progressFilter} onChange={e => setProgressFilter(e.target.value)}
            className="h-10 border rounded px-3 text-sm bg-white">
            <option value="">進捗：すべて</option>
            {PROGRESS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <Button onClick={handleSearch} className="flex items-center gap-1">
            <Search className="w-4 h-4" />検索
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p>
      ) : records.length === 0 ? (
        <p className="text-center text-gray-500 py-8">データがありません。</p>
      ) : (
        <>
          <Pagination />
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">No.</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">校正</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">品番</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">品名</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">アーティスト</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">納期</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">進捗</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">集計</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">営業</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">製版</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">備考</th>
                  <th className="px-3 py-2.5 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-pink-50 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-gray-500 whitespace-nowrap">{r.schedule_no}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {r.kosei_stage
                        ? <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">{r.kosei_stage}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-gray-700 whitespace-nowrap">{r.hinban ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2.5 text-gray-700 max-w-[160px]"><div className="truncate">{r.hinmei ?? <span className="text-gray-300">—</span>}</div></td>
                    <td className="px-3 py-2.5 text-gray-600 max-w-[140px]"><div className="truncate">{r.artist_name ?? <span className="text-gray-300">—</span>}</div></td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-gray-600">
                      {r.nouki_date
                        ? <span className="font-medium">{new Date(r.nouki_date).toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit" })}</span>
                        : <span className="text-gray-300">—</span>}
                      {r.nouki_time && <span className="ml-1 text-xs text-gray-500">{r.nouki_time}</span>}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {r.progress
                        ? <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PROGRESS_COLORS[r.progress] ?? "bg-gray-100 text-gray-600"}`}>{r.progress}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{r.shuukei_daisuu ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{r.eigyo_tanto ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{r.seihan_tanto ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2.5 text-gray-500 max-w-[160px]"><div className="truncate">{r.biko ?? <span className="text-gray-300">—</span>}</div></td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(r)} className="p-1 text-gray-400 hover:text-blue-600 rounded"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteTarget(r)} className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-800">{editTarget ? "予定を編集" : "予定を新規登録"}</h2>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">品番</Label>
                  <Input value={form.hinban} onChange={e => setForm(f => ({ ...f, hinban: e.target.value }))} autoComplete="off" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">校正段階</Label>
                  <select value={form.kosei_stage} onChange={e => setForm(f => ({ ...f, kosei_stage: e.target.value }))}
                    className="w-full h-8 border rounded px-2 text-sm bg-white">
                    {KOSEI_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">品名</Label>
                  <Input value={form.hinmei} onChange={e => setForm(f => ({ ...f, hinmei: e.target.value }))} autoComplete="off" className="h-8 text-sm" />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">アーティスト名</Label>
                  <Input value={form.artist_name} onChange={e => setForm(f => ({ ...f, artist_name: e.target.value }))} autoComplete="off" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">納期日付</Label>
                  <Input type="date" value={form.nouki_date} onChange={e => setForm(f => ({ ...f, nouki_date: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">納期時刻</Label>
                  <Input value={form.nouki_time} onChange={e => setForm(f => ({ ...f, nouki_time: e.target.value }))} placeholder="例：12:00" autoComplete="off" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">進捗</Label>
                  <select value={form.progress} onChange={e => setForm(f => ({ ...f, progress: e.target.value }))}
                    className="w-full h-8 border rounded px-2 text-sm bg-white">
                    {PROGRESS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">集計台数</Label>
                  <Input type="number" value={form.shuukei_daisuu} onChange={e => setForm(f => ({ ...f, shuukei_daisuu: e.target.value }))} autoComplete="off" className="h-8 text-sm" />
                </div>
                <TantoSelect label="営業担当" value={form.eigyo_tanto}
                  onChange={v => setForm(f => ({ ...f, eigyo_tanto: v }))}
                  suggestions={eigyoSuggestions} />
                <TantoSelect label="製版担当" value={form.seihan_tanto}
                  onChange={v => setForm(f => ({ ...f, seihan_tanto: v }))}
                  suggestions={seihanSuggestions} />
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">備考</Label>
                  <Textarea value={form.biko} onChange={e => setForm(f => ({ ...f, biko: e.target.value }))} rows={3} className="text-sm" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2 flex-shrink-0">
              <Button variant="outline" onClick={() => setModalOpen(false)}>キャンセル</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">削除の確認</h2>
            <p className="text-sm text-gray-600">No.{deleteTarget.schedule_no}「{deleteTarget.hinmei ?? deleteTarget.hinban ?? ""}」を削除しますか？</p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>キャンセル</Button>
              <Button variant="destructive" onClick={handleDelete}>削除</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
