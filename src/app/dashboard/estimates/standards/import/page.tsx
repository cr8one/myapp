"use client"
import { useState } from "react"
import Link from "next/link"
import { Upload } from "lucide-react"

type StandardPreview = {
  name: string
  exists: boolean
  values: number
  tiers: number
  cells: number
  warningCount: number
  warnings: string[]
}
type Unmapped = { pattern: string; count: number; example: string }
type RunResult = { name: string; status: "created" | "replaced" | "skipped"; values: number; tiers: number; cells: number }
type ApiResult = {
  ok?: boolean
  error?: string
  dry_run?: boolean
  standards?: StandardPreview[]
  results?: RunResult[]
  unmapped?: Unmapped[]
  errors?: string[]
}

const STATUS_LABEL: Record<RunResult["status"], string> = {
  created: "新規作成",
  replaced: "上書き",
  skipped: "スキップ（既存）",
}

const btnPrimary = "px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-50"
const btnSecondary = "px-4 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50 disabled:opacity-50"

async function send(file: File, dryRun: boolean, overwrite: boolean) {
  const fd = new FormData()
  fd.append("file", file)
  fd.append("dry_run", dryRun ? "1" : "0")
  fd.append("overwrite", overwrite ? "1" : "0")
  const res = await fetch("/api/estimates/standards/import", { method: "POST", body: fd })
  const data = (await res.json().catch(() => null)) as ApiResult | null
  return { ok: res.ok, data }
}

export default function EstimateStandardsImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [overwrite, setOverwrite] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [preview, setPreview] = useState<ApiResult | null>(null)
  const [done, setDone] = useState<ApiResult | null>(null)

  const onFile = (f: File | null) => {
    setFile(f)
    setPreview(null)
    setDone(null)
    setError("")
  }

  const runPreview = async () => {
    if (!file) return
    setBusy(true)
    setError("")
    setDone(null)
    const r = await send(file, true, overwrite)
    if (!r.ok || !r.data?.ok) {
      setPreview(null)
      setError(r.data?.error ?? "確認に失敗しました")
    } else {
      setPreview(r.data)
    }
    setBusy(false)
  }

  const runImport = async () => {
    if (!file || !preview?.standards) return
    const targets = preview.standards.filter(s => overwrite || !s.exists).length
    const msg = overwrite
      ? `${preview.standards.length}件の基準を取り込みます。既存の基準は、取り込み対象の表の中身が入れ替わります。よろしいですか？`
      : `${targets}件の基準を新しく取り込みます（既存の基準はスキップします）。よろしいですか？`
    if (!confirm(msg)) return
    setBusy(true)
    setError("")
    const r = await send(file, false, overwrite)
    if (!r.ok || !r.data?.ok) {
      setError(r.data?.error ?? "取り込みに失敗しました")
    } else {
      setDone(r.data)
      setPreview(null)
    }
    setBusy(false)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">基準の取り込み（FileMaker）</h1>
        <Link href="/dashboard/estimates/standards" className="text-sm text-gray-500 hover:text-gray-700">← 見積書マスタに戻る</Link>
      </div>

      <p className="text-xs text-gray-400 mb-4">
        FileMakerの基準ファイル（見積基準_SP）を、「レコードの書き出し」でExcel（.xlsx）にしたものを選んでください。まず「確認」で、書き込まずに内容を確認できます。
        今回の対象は、基本の値、用紙、トレイ、加工・製本、外箱、デジ加工・投込み代です。
      </p>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <input type="file" accept=".xlsx" onChange={e => onFile(e.target.files?.[0] ?? null)} className="text-sm" />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={overwrite} onChange={e => { setOverwrite(e.target.checked); setPreview(null) }} />
          既存の基準も上書きする（取り込み対象の表だけ入れ替えます）
        </label>
        <div className="flex gap-2">
          <button onClick={runPreview} disabled={!file || busy} className={btnSecondary}>
            {busy && !preview ? "確認中..." : "確認（書き込まない）"}
          </button>
          <button onClick={runImport} disabled={!preview || busy} className={`${btnPrimary} flex items-center gap-1`}>
            <Upload className="w-4 h-4" /> {busy && preview ? "取り込み中..." : "取り込む"}
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {preview?.errors && preview.errors.length > 0 && (
        <div className="mb-4 text-sm text-red-600 space-y-1">
          {preview.errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}

      {preview?.standards && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-700 mb-2">確認結果（まだ書き込んでいません）：{preview.standards.length}件</h2>
          <div className="space-y-2">
            {preview.standards.map(s => (
              <div key={s.name} className="px-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900 w-64">{s.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${s.exists ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {s.exists ? "既存" : "新規"}
                  </span>
                  <span className="text-gray-500 w-24">値 {s.values}</span>
                  <span className="text-gray-500 w-32">ロット範囲 {s.tiers}</span>
                  <span className="text-gray-500 w-24">単価 {s.cells}</span>
                  <span className={s.warningCount > 0 ? "text-amber-600" : "text-gray-400"}>警告 {s.warningCount}</span>
                </div>
                {s.warnings.length > 0 && (
                  <ul className="mt-2 text-xs text-amber-700 list-disc pl-5 space-y-0.5">
                    {s.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    {s.warningCount > s.warnings.length && <li>ほか{s.warningCount - s.warnings.length}件</li>}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {done?.results && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-700 mb-2">取り込み結果</h2>
          <div className="space-y-2">
            {done.results.map(r => (
              <div key={r.name} className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm text-sm">
                <span className="font-medium text-gray-900 w-64">{r.name}</span>
                <span className="w-36 text-gray-700">{STATUS_LABEL[r.status]}</span>
                <span className="text-gray-500 w-24">値 {r.values}</span>
                <span className="text-gray-500 w-32">ロット範囲 {r.tiers}</span>
                <span className="text-gray-500">単価 {r.cells}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(preview?.unmapped ?? done?.unmapped) && (preview?.unmapped ?? done?.unmapped)!.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-700 mb-1">まだ取り込み対象にしていないフィールド（値が入っているもの）</h2>
          <p className="text-xs text-gray-400 mb-2">件数は、全基準の合計です。印刷・損紙・表面加工・製版・デジパックなどは、次の段階で取り込みます。</p>
          <div className="border border-gray-200 rounded-xl bg-white shadow-sm divide-y divide-gray-100 text-sm">
            {(preview?.unmapped ?? done?.unmapped)!.map(u => (
              <div key={u.pattern} className="flex items-center gap-3 px-4 py-2">
                <span className="w-64 text-gray-800">{u.pattern}</span>
                <span className="w-20 text-gray-500">{u.count}件</span>
                <span className="text-xs text-gray-400">例：{u.example}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}