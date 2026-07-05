"use client"
import React, { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Upload, X, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react"

const PROGRESS_OPTIONS = ["保留", "入稿待ち", "入稿済", "製版中", "製版済", "出力中", "出力済", "印刷中", "印刷済", "完了"]
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
type DppScheduleArchive = {
  id: string; sc_id: string; hinban: string | null; hinmei: string | null
  artist_name: string | null; kosei_stage: string | null
  nouki_date: string | null; nouki_time: string | null
  progress: string | null; eigyo_tanto: string | null; seihan_tanto: string | null
  biko: string | null; shuukei_daisuu: number | null
}
type DppScheduleArchivePart = {
  id: string; dsi_u_id: string
  page: string | null; part_name: string | null
  kosei_type: string | null; kosei_stage: string | null
  paper_name: string | null; paper_weight: string | null
  color_omote: string | null; color_ura: string | null
  maisu: string | null; menzuke_daisuu: number | null
  nyuko_date: string | null; nyuko_time: string | null
  shiage_date: string | null; shiage_time: string | null
  biko: string | null; biko_siyou: string | null
}
const PAGE_SIZE = 50
type AdvancedFilters = {
  hinban: string; hinmei: string; artistName: string; koseiStage: string
  noukiFrom: string; noukiTo: string; eigyoTanto: string; seihanTanto: string
  partName: string; paperName: string; colorOmote: string; colorUra: string
  koseiType: string; bikoSiyou: string; partBiko: string
  dgsYes: boolean; dgsNo: boolean
}
const emptyAdvanced: AdvancedFilters = {
  hinban: "", hinmei: "", artistName: "", koseiStage: "",
  noukiFrom: "", noukiTo: "", eigyoTanto: "", seihanTanto: "",
  partName: "", paperName: "", colorOmote: "", colorUra: "",
  koseiType: "", bikoSiyou: "", partBiko: "",
  dgsYes: false, dgsNo: false,
}
type AdvancedStringKey = Exclude<keyof AdvancedFilters, "dgsYes" | "dgsNo">
const ADVANCED_KEYS: AdvancedStringKey[] = [
  "hinban", "hinmei", "artistName", "koseiStage", "noukiFrom", "noukiTo",
  "eigyoTanto", "seihanTanto", "partName", "paperName", "colorOmote", "colorUra",
  "koseiType", "bikoSiyou", "partBiko",
]
type ImportStatus = "idle" | "uploading" | "importing" | "done" | "error"
type ImportTarget = "schedules" | "parts"

export default function DppArchiveClient({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [records, setRecords] = useState<DppScheduleArchive[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(parseInt(searchParams.get("page") ?? "1"))
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "")
  const [progressFilter, setProgressFilter] = useState(searchParams.get("progress") ?? "")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [advanced, setAdvanced] = useState<AdvancedFilters>(() => {
    const init = { ...emptyAdvanced }
    ADVANCED_KEYS.forEach(k => { init[k] = searchParams.get(k) ?? "" })
    init.dgsYes = searchParams.get("dgsYes") === "1"
    init.dgsNo = searchParams.get("dgsNo") === "1"
    return init
  })

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [partsCache, setPartsCache] = useState<Record<string, DppScheduleArchivePart[]>>({})
  const [partsLoading, setPartsLoading] = useState<Set<string>>(new Set())

  const [showImport, setShowImport] = useState(false)
  const [importTarget, setImportTarget] = useState<ImportTarget>("schedules")
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle")
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState({ count: 0, total: 0 })
  const [importError, setImportError] = useState("")

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const WEEKDAY_JP = ["日", "月", "火", "水", "木", "金", "土"]
  const groupedRecords = (() => {
    const groups: { key: string; label: string; items: DppScheduleArchive[] }[] = []
    const map = new Map<string, DppScheduleArchive[]>()
    for (const r of records) {
      const key = r.nouki_date ? r.nouki_date.slice(0, 10) : "__none__"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    }
    for (const [key, items] of map.entries()) {
      let label = "納期未定"
      if (key !== "__none__") {
        const d = new Date(key)
        label = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${WEEKDAY_JP[d.getDay()]})`
      }
      groups.push({ key, label, items })
    }
    return groups
  })()

  const buildQuery = (p: number, kw = keyword, pf = progressFilter, adv = advanced) => {
    const params = new URLSearchParams()
    if (kw) params.set("keyword", kw)
    if (pf) params.set("progress", pf)
    ADVANCED_KEYS.forEach(k => { if (adv[k]) params.set(k, adv[k] as string) })
    if (adv.dgsYes) params.set("dgsYes", "1")
    if (adv.dgsNo) params.set("dgsNo", "1")
    params.set("page", String(p))
    return params
  }

  const fetchRecords = async (p = page, kw = keyword, pf = progressFilter, syncUrl = true, adv = advanced) => {
    setLoading(true)
    const params = buildQuery(p, kw, pf, adv)
    if (syncUrl) router.replace(`/dashboard/dpp/archive?${params.toString()}`)
    if (adv.dgsYes && !adv.dgsNo) params.set("dgs", "1")
    if (adv.dgsNo && !adv.dgsYes) params.set("dgs", "0")
    const res = await fetch(`/api/dpp/archive/schedules?${params.toString()}`)
    const data = await res.json()
    setRecords(data.records)
    setTotal(data.total)
    setLoading(false)
  }

  useEffect(() => {
    const p = parseInt(searchParams.get("page") ?? "1")
    const kw = searchParams.get("keyword") ?? ""
    const pf = searchParams.get("progress") ?? ""
    const adv = { ...emptyAdvanced }
    ADVANCED_KEYS.forEach(k => { adv[k] = searchParams.get(k) ?? "" })
    adv.dgsYes = searchParams.get("dgsYes") === "1"
    adv.dgsNo = searchParams.get("dgsNo") === "1"
    setPage(p); setKeyword(kw); setProgressFilter(pf); setAdvanced(adv)
    fetchRecords(p, kw, pf, false, adv)
  }, [searchParams])

  const toggleExpand = async (scId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(scId)) {
        next.delete(scId)
      } else {
        next.add(scId)
      }
      return next
    })
    if (!partsCache[scId]) {
      setPartsLoading(prev => new Set(prev).add(scId))
      try {
        const res = await fetch(`/api/dpp/archive/schedules/${encodeURIComponent(scId)}`)
        const data = await res.json()
        setPartsCache(prev => ({ ...prev, [scId]: data.parts ?? [] }))
      } finally {
        setPartsLoading(prev => {
          const next = new Set(prev)
          next.delete(scId)
          return next
        })
      }
    }
  }

  const expandAll = async () => {
    const targets = records.map(r => r.sc_id)
    setExpandedIds(new Set(targets))
    const missing = targets.filter(id => !partsCache[id])
    if (missing.length === 0) return
    setPartsLoading(prev => {
      const next = new Set(prev)
      missing.forEach(id => next.add(id))
      return next
    })
    const results = await Promise.all(
      missing.map(async id => {
        const res = await fetch(`/api/dpp/archive/schedules/${encodeURIComponent(id)}`)
        const data = await res.json()
        return [id, data.parts ?? []] as const
      })
    )
    setPartsCache(prev => {
      const next = { ...prev }
      results.forEach(([id, parts]) => { next[id] = parts })
      return next
    })
    setPartsLoading(prev => {
      const next = new Set(prev)
      missing.forEach(id => next.delete(id))
      return next
    })
  }

  const collapseAll = () => setExpandedIds(new Set())

  const handleSearch = () => { setPage(1); fetchRecords(1) }
  const updateAdvanced = (patch: Partial<AdvancedFilters>) => setAdvanced(prev => ({ ...prev, ...patch }))
  const clearAdvanced = () => { setAdvanced(emptyAdvanced); setPage(1); fetchRecords(1, keyword, progressFilter, true, emptyAdvanced) }
  const handlePage = (next: number) => {
    setPage(next)
    fetchRecords(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const resetImport = () => {
    setImportStatus("idle")
    setImportFile(null)
    setImportProgress({ count: 0, total: 0 })
    setImportError("")
    setShowImport(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleImport = async () => {
    if (!importFile) return
    setImportStatus("uploading")
    setImportError("")
    setImportProgress({ count: 0, total: 0 })
    try {
      const presignRes = await fetch(`/api/dpp/archive/${importTarget}/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: importFile.name }),
      })
      if (!presignRes.ok) throw new Error()
      const { url, key } = await presignRes.json()
      await fetch(url, {
        method: "PUT",
        body: importFile,
        headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
      })
      setImportStatus("importing")
      let offset = 0
      let total = 0
      while (true) {
        const res = await fetch(`/api/dpp/archive/${importTarget}/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, offset }),
        })
        if (!res.ok) throw new Error()
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

  return (
    <div className="p-6 max-w-[1700px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">予定表アーカイブ</h1>
          <p className="text-sm text-gray-500 mt-1">{total}件（閲覧のみ）</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImport(s => !s)} className="flex items-center gap-1.5">
              <Upload className="w-4 h-4" />xlsx取込
            </Button>
          </div>
        )}
      </div>

      {isAdmin && showImport && (
        <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm space-y-3">
          {importStatus === "idle" && (
            <div className="flex items-center gap-3 flex-wrap">
              <select value={importTarget} onChange={e => setImportTarget(e.target.value as ImportTarget)}
                className="h-9 border rounded px-2 text-sm bg-white">
                <option value="schedules">仕様情報（親）</option>
                <option value="parts">パーツ情報（子）</option>
              </select>
              <input ref={fileInputRef} type="file" accept=".xlsx"
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
          {importTarget === "parts" && (
            <p className="text-xs text-gray-400">※パーツ情報は先に対応する仕様情報（親）を取り込んでから実行してください。</p>
          )}
        </div>
      )}

      <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-48">
            <Input value={keyword} onChange={e => setKeyword(e.target.value)}
              placeholder="sc_id・品番・品名・アーティスト・担当者で検索"
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
          <Button variant="outline" onClick={() => setShowAdvanced(s => !s)} className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4" />詳細検索
          </Button>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={expandAll}>全て展開</Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>全て閉じる</Button>
          </div>
        </div>
        {showAdvanced && (
          <div className="mt-4 pt-4 border-t space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2">仕様情報</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <Input value={advanced.hinban} onChange={e => updateAdvanced({ hinban: e.target.value })} placeholder="品番" autoComplete="off" />
                <Input value={advanced.hinmei} onChange={e => updateAdvanced({ hinmei: e.target.value })} placeholder="品名" autoComplete="off" />
                <Input value={advanced.artistName} onChange={e => updateAdvanced({ artistName: e.target.value })} placeholder="アーティスト名" autoComplete="off" />
                <Input value={advanced.koseiStage} onChange={e => updateAdvanced({ koseiStage: e.target.value })} placeholder="校正段階" autoComplete="off" />
                <Input value={advanced.eigyoTanto} onChange={e => updateAdvanced({ eigyoTanto: e.target.value })} placeholder="営業担当" autoComplete="off" />
                <Input value={advanced.seihanTanto} onChange={e => updateAdvanced({ seihanTanto: e.target.value })} placeholder="製版担当" autoComplete="off" />
                <div className="flex items-center gap-1.5 col-span-2">
                  <Input type="date" value={advanced.noukiFrom} onChange={e => updateAdvanced({ noukiFrom: e.target.value })} className="text-sm" />
                  <span className="text-gray-400 text-sm">〜</span>
                  <Input type="date" value={advanced.noukiTo} onChange={e => updateAdvanced({ noukiTo: e.target.value })} className="text-sm" />
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2">パーツ情報</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <Input value={advanced.partName} onChange={e => updateAdvanced({ partName: e.target.value })} placeholder="パーツ名" autoComplete="off" />
                <Input value={advanced.paperName} onChange={e => updateAdvanced({ paperName: e.target.value })} placeholder="用紙名" autoComplete="off" />
                <Input value={advanced.colorOmote} onChange={e => updateAdvanced({ colorOmote: e.target.value })} placeholder="色表" autoComplete="off" />
                <Input value={advanced.colorUra} onChange={e => updateAdvanced({ colorUra: e.target.value })} placeholder="色裏" autoComplete="off" />
                <Input value={advanced.koseiType} onChange={e => updateAdvanced({ koseiType: e.target.value })} placeholder="校正種" autoComplete="off" />
                <Input value={advanced.bikoSiyou} onChange={e => updateAdvanced({ bikoSiyou: e.target.value })} placeholder="仕様書備考" autoComplete="off" />
                <Input value={advanced.partBiko} onChange={e => updateAdvanced({ partBiko: e.target.value })} placeholder="備考" autoComplete="off" />
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={advanced.dgsYes} onChange={e => updateAdvanced({ dgsYes: e.target.checked })} />
                    DGSあり
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={advanced.dgsNo} onChange={e => updateAdvanced({ dgsNo: e.target.checked })} />
                    DGSなし
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={clearAdvanced}>詳細検索をクリア</Button>
              <Button size="sm" onClick={handleSearch} className="flex items-center gap-1">
                <Search className="w-3.5 h-3.5" />この条件で検索
              </Button>
            </div>
          </div>
        )}
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
              <table className="w-full text-[15px] table-fixed">
                <colgroup>
                  <col style={{ width: "32px" }} />
                  <col style={{ width: "72px" }} />
                  <col style={{ width: "56px" }} />
                  <col style={{ width: "120px" }} />
                  <col style={{ width: "240px" }} />
                  <col style={{ width: "150px" }} />
                  <col style={{ width: "100px" }} />
                  <col style={{ width: "90px" }} />
                  <col style={{ width: "70px" }} />
                  <col style={{ width: "140px" }} />
                  <col style={{ width: "auto" }} />
                </colgroup>
                <thead className="bg-gray-100 border-b">
                  <tr className="text-xs">
                    <th className="px-3 py-2.5 w-8"></th>
                    <th className="text-left px-3 py-2.5 text-gray-500 font-medium whitespace-nowrap">id</th>
                    <th className="text-left px-3 py-2.5 text-gray-500 font-medium whitespace-nowrap">校正</th>
                    <th className="text-left px-3 py-2.5 text-gray-500 font-medium whitespace-nowrap">品番</th>
                    <th className="text-left px-3 py-2.5 text-gray-500 font-medium whitespace-nowrap">品名</th>
                    <th className="text-left px-3 py-2.5 text-gray-500 font-medium whitespace-nowrap">アーティスト</th>
                    <th className="text-left px-3 py-2.5 text-gray-500 font-medium whitespace-nowrap">納期</th>
                    <th className="text-left px-3 py-2.5 text-gray-500 font-medium whitespace-nowrap">進捗</th>
                    <th className="text-left px-3 py-2.5 text-gray-500 font-medium whitespace-nowrap">集計</th>
                    <th className="text-left px-3 py-2.5 text-gray-500 font-medium whitespace-nowrap">営業/製版</th>
                    <th className="text-left px-3 py-2.5 text-gray-500 font-medium whitespace-nowrap">備考</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {groupedRecords.map(group => (
                    <React.Fragment key={group.key}>
                      <tr>
                        <td colSpan={11} className="bg-slate-700 px-4 py-2 text-sm font-bold text-white">
                          {group.label}
                        </td>
                      </tr>
                      {group.items.map(r => {
                    const isExpanded = expandedIds.has(r.sc_id)
                    const isLoadingParts = partsLoading.has(r.sc_id)
                    const parts = partsCache[r.sc_id]
                    return (
                    <React.Fragment key={r.id}>
                    <tr
                      className="hover:bg-rose-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/dpp/archive/${encodeURIComponent(r.sc_id)}`)}
                    >
                      <td className="px-3 py-3" onClick={e => { e.stopPropagation(); toggleExpand(r.sc_id) }}>
                        <button className="text-gray-400 hover:text-gray-700">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </td>
                      <td className="px-2 py-3 font-mono text-xs text-gray-400 whitespace-nowrap">{r.sc_id}</td>
                      <td className="px-1 py-3 whitespace-nowrap">
                        {r.kosei_stage
                          ? <span className="text-sm bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full">{r.kosei_stage}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-3 text-sm font-medium text-gray-600 truncate" title={r.hinban ?? ""}>{r.hinban ?? <span className="text-gray-300">—</span>}</td>
                      <td className="px-3 py-3 text-sm font-bold text-gray-900" title={r.hinmei ?? ""}><div className="line-clamp-2 leading-snug">{r.hinmei ?? <span className="text-gray-300">—</span>}</div></td>
                      <td className="px-3 py-3 text-sm text-gray-600" title={r.artist_name ?? ""}><div className="truncate">{r.artist_name ?? <span className="text-gray-300">—</span>}</div></td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-800 leading-tight">
                        {r.nouki_date && (
                          <div className="text-xs text-gray-400">
                            {new Date(r.nouki_date).toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit" })}
                          </div>
                        )}
                        {r.nouki_time
                          ? <div className="text-lg font-bold">{r.nouki_time}</div>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {r.progress
                          ? <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${PROGRESS_COLORS[r.progress] ?? "bg-gray-100 text-gray-600"}`}>{r.progress}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{r.shuukei_daisuu ?? <span className="text-gray-300">—</span>}</td>
                      <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{[r.eigyo_tanto, r.seihan_tanto].filter(Boolean).join(" / ") || <span className="text-gray-300">—</span>}</td>
                      <td className="px-3 py-3 text-xs text-gray-600" title={r.biko ?? ""}><div className="truncate">{r.biko ?? <span className="text-gray-300">—</span>}</div></td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={11} className="bg-slate-50 px-6 py-4 border-t-2 border-b-2 border-slate-200">
                          {isLoadingParts ? (
                            <p className="text-xs text-gray-400 py-2">読み込み中...</p>
                          ) : !parts || parts.length === 0 ? (
                            <p className="text-xs text-gray-400 py-2">パーツ情報がありません。</p>
                          ) : (
                            <table className="w-full text-xs table-fixed">
                              <colgroup>
                                <col style={{ width: "13%" }} />
                                <col style={{ width: "6%" }} />
                                <col style={{ width: "10%" }} />
                                <col style={{ width: "11%" }} />
                                <col style={{ width: "12%" }} />
                                <col style={{ width: "6%" }} />
                                <col style={{ width: "13%" }} />
                                <col style={{ width: "auto" }} />
                                <col style={{ width: "9%" }} />
                                <col style={{ width: "9%" }} />
                              </colgroup>
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left px-2 py-1 font-medium text-gray-400">パーツ名</th>
                                  <th className="text-left px-2 py-1 font-medium text-gray-400">頁</th>
                                  <th className="text-left px-2 py-1 font-medium text-gray-400">色表/色裏</th>
                                  <th className="text-left px-2 py-1 font-medium text-gray-400">校正種/枚数</th>
                                  <th className="text-left px-2 py-1 font-medium text-gray-400">用紙名/連量</th>
                                  <th className="text-left px-2 py-1 font-medium text-gray-400">面付</th>
                                  <th className="text-left px-2 py-1 font-medium text-gray-400">仕様書備考</th>
                                  <th className="text-left px-2 py-1 font-medium text-gray-400">備考</th>
                                  <th className="text-left px-2 py-1 font-medium text-gray-400">入稿日時</th>
                                  <th className="text-left px-2 py-1 font-medium text-gray-400">仕上日時</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 bg-white">
                                {parts.map(p => (
                                  <tr key={p.id} className="text-gray-600">
                                    <td className="px-2 py-1.5 font-medium text-gray-800 break-words leading-snug" title={p.part_name ?? ""}>{p.part_name ?? "—"}</td>
                                    <td className="px-2 py-1.5">{p.page ?? "—"}</td>
                                    <td className="px-2 py-1.5 break-words leading-snug">{[p.color_omote, p.color_ura].filter(Boolean).join(" / ") || "—"}</td>
                                    <td className="px-2 py-1.5 break-words leading-snug">
                                      {p.kosei_type || p.maisu
                                        ? <>
                                            {p.kosei_type ?? "—"}
                                            {p.maisu && <> / {p.maisu}<span className="text-xs text-gray-400"> 枚</span></>}
                                          </>
                                        : "—"}
                                    </td>
                                    <td className="px-2 py-1.5 break-words leading-snug" title={[p.paper_name, p.paper_weight].filter(Boolean).join(" ")}>
                                      {p.paper_name || p.paper_weight
                                        ? <>
                                            {p.paper_name ?? "—"}
                                            {p.paper_weight && <> {p.paper_weight}<span className="text-xs text-gray-400">kg</span></>}
                                          </>
                                        : "—"}
                                    </td>
                                    <td className="px-2 py-1.5">{p.menzuke_daisuu ?? "—"}</td>
                                    <td className="px-2 py-1.5 break-words leading-snug" title={p.biko_siyou ?? ""}>{p.biko_siyou ?? "—"}</td>
                                    <td className="px-2 py-1.5 break-words leading-snug" title={p.biko ?? ""}>{p.biko ?? "—"}</td>
                                    <td className="px-2 py-1.5 truncate">{p.nyuko_date ? `${new Date(p.nyuko_date).toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit" })} ${p.nyuko_time ?? ""}` : "—"}</td>
                                    <td className="px-2 py-1.5 truncate">{p.shiage_date ? `${new Date(p.shiage_date).toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit" })} ${p.shiage_time ?? ""}` : "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                    )
                  })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-3">
            <Pagination />
          </div>
        </>
      )}
    </div>
  )
}
