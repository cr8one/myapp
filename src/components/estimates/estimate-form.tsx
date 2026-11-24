"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Copy, Lock, Unlock } from "lucide-react"
import { calcEstimate, stripOverrides } from "@/lib/estimate/estimate"
import type { EstimateResult, OtherLineInput, PressGroupInput } from "@/lib/estimate/estimate"
import {
  clearFormOverrides, emptyBody, emptyGroup, emptyHeader, freezeFormData, MAX_GROUPS, MAX_OTHERS, MAX_PLATE_MAKING, MAX_PROC, toEngineInput,
} from "@/lib/estimate/form-types"
import type { EstimateBody, EstimateHeader } from "@/lib/estimate/form-types"
import type { PaperLineInput } from "@/lib/estimate/paper"
import type { PlateMakingInput } from "@/lib/estimate/plate"
import type { ProcLineInput } from "@/lib/estimate/proc"
import { DIGIPAK_LABEL, reviveStd } from "@/lib/estimate/std-json"
import type { EstimateStdJson } from "@/lib/estimate/std-json"

type Standard = { id: string; name: string; is_archived: boolean }
type Category = { id: string; name: string; default_standard_id: string | null; customer_name: string | null }
type Loaded = {
  id: string | null
  estimateNo: string
  category: { id: string; name: string }
  standardId: string
  header: EstimateHeader
  body: EstimateBody
  confirmed: boolean
  storedResult: EstimateResult | null
  stdJson: EstimateStdJson | null
  standards: Standard[]
}

const HAN = ["", "4/6判", "菊判", "L判", "K判", "A判"]
const SIZE_KINDS: [string, string][] = [["", "全判"], ["半切", "半切"], ["3切", "3切"], ["4切", "4切"], ["8切", "8切"]]
const PRINT_KINDS: [string, string][] = [["", "薄紙"], ["厚紙印刷", "厚紙"], ["UV薄紙印刷", "UV薄紙"], ["UV厚紙印刷", "UV厚紙"]]
const PROOFS = ["", "初校", "再校", "三校", "四校", "念校"]
const COLORS = ["", "色校正", "青焼き"]
const BASIS = ["", "個", "通1", "通2", "通3", "通4"]
const TRAY_LABELS = [1, 2, 3, 4].map(n => `デジパックトレイ代 (${n}枚貼り)`)

const inputCls = "w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white disabled:bg-gray-50 disabled:text-gray-500"
const cellCls = "border border-gray-300 rounded px-1.5 py-1 text-sm bg-white text-right tabular-nums disabled:bg-gray-50"
const fmt = (v: number | null | undefined, d = 4) => (v === null || v === undefined ? "" : v.toLocaleString("ja-JP", { maximumFractionDigits: d }))
const today = () => new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)

function parseNum(t: string): number | null {
  const s = t.normalize("NFKC").replace(/[,\s]/g, "")
  if (s === "") return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

const manualCls = "border border-amber-400 bg-amber-50 rounded px-1.5 py-1 text-sm text-right tabular-nums disabled:text-gray-600"

function NumField(props: { value: number | null; onChange: (v: number | null) => void; className?: string; placeholder?: string; disabled?: boolean; width?: string; hl?: boolean }) {
  const { value, onChange, className, placeholder, disabled, width, hl } = props
  const [text, setText] = useState(value === null ? "" : String(value))
  useEffect(() => {
    if (parseNum(text) !== value) setText(value === null ? "" : String(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return (
    <input
      inputMode="decimal"
      autoComplete="off"
      disabled={disabled}
      placeholder={placeholder}
      value={text}
      onChange={e => {
        setText(e.target.value)
        onChange(parseNum(e.target.value))
      }}
      className={`${hl && value !== null ? manualCls : className ?? cellCls} ${width ?? "w-full"}`}
    />
  )
}

function Field(props: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block space-y-0.5 ${props.className ?? ""}`}>
      <span className="text-[11px] text-gray-500">{props.label}</span>
      {props.children}
    </label>
  )
}

// 金額の欄：空欄なら自動計算（薄い文字で、自動計算の値を出す）。入力すると、その金額が優先される
function AmountCell(props: { label: string; manual: number | null | undefined; ref0: number | null | undefined; onChange: (v: number | null) => void }) {
  return (
    <div className="px-2 py-1 bg-slate-50 rounded">
      <div className="text-[10px] text-gray-400">{props.label}{props.manual != null ? "（手入力）" : "（空欄＝自動）"}</div>
      <NumField value={props.manual ?? null} onChange={props.onChange} placeholder={fmt(props.ref0, 0)} hl />
    </div>
  )
}

function ResultCell(props: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="px-2 py-1 bg-slate-50 rounded text-right">
      <div className="text-[10px] text-gray-400 text-left">{props.label}</div>
      <div className={`tabular-nums text-sm ${props.strong ? "font-bold text-slate-900" : "text-gray-800"}`}>{props.value || "　"}</div>
    </div>
  )
}

// ================= 読み込み =================
export default function EstimateEditor(props: { mode: "new"; categoryId: string } | { mode: "edit"; id: string }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState("")
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion(v => v + 1), [])
  const mode = props.mode
  const key = props.mode === "new" ? props.categoryId : props.id

  useEffect(() => {
    let alive = true
    const run = async () => {
      setError("")
      const sRes = await fetch("/api/estimates/standards")
      const standards: Standard[] = sRes.ok ? await sRes.json() : []
      if (mode === "new") {
        const cRes = await fetch("/api/estimates/categories")
        const cats: Category[] = cRes.ok ? await cRes.json() : []
        const cat = cats.find(c => c.id === key)
        if (!cat) return alive && setError("見積区分が見つかりません")
        const std = standards.find(s => s.id === cat.default_standard_id && !s.is_archived) ?? standards.find(s => !s.is_archived)
        if (!std) return alive && setError("使える基準がありません。見積書マスタ（基準）を登録してください")
        const r = await fetch(`/api/estimates/std/${std.id}`)
        if (!r.ok) return alive && setError("基準の値を読み込めませんでした")
        const stdJson: EstimateStdJson = await r.json()
        if (!alive) return
        setLoaded({
          id: null,
          estimateNo: "",
          category: { id: cat.id, name: cat.name },
          standardId: std.id,
          header: { ...emptyHeader(), customer_name: cat.customer_name ?? "", issue_date: today() },
          body: { ...emptyBody(), groups: [emptyGroup()] },
          confirmed: false,
          storedResult: null,
          stdJson,
          standards,
        })
        return
      }
      const r = await fetch(`/api/estimates/${key}`)
      const d = await r.json().catch(() => null)
      if (!r.ok) return alive && setError(d?.error ?? "読み込みに失敗しました")
      if (!alive) return
      setLoaded({
        id: d.estimate.id,
        estimateNo: d.estimate.estimate_no,
        category: d.estimate.category ?? { id: "", name: "" },
        standardId: d.estimate.standard.id,
        header: d.header,
        body: d.body,
        confirmed: d.estimate.is_confirmed,
        storedResult: d.result as EstimateResult | null,
        stdJson: d.std,
        standards,
      })
    }
    run()
    return () => { alive = false }
  }, [mode, key, version])

  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>
  if (!loaded) return <div className="p-6 text-sm text-gray-400">読み込み中...</div>
  return <EstimateForm key={`${key}-${version}`} loaded={loaded} reload={reload} />
}

// ================= フォーム本体 =================
function EstimateForm({ loaded, reload }: { loaded: Loaded; reload: () => void }) {
  const router = useRouter()
  const locked = loaded.confirmed
  const [header, setHeader] = useState<EstimateHeader>(loaded.header)
  const [body, setBody] = useState<EstimateBody>(loaded.body)
  const [standardId, setStandardId] = useState(loaded.standardId)
  const [stdJson, setStdJson] = useState<EstimateStdJson | null>(loaded.stdJson)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = "" }
    window.addEventListener("beforeunload", h)
    return () => window.removeEventListener("beforeunload", h)
  }, [dirty])

  const std = useMemo(() => (stdJson ? reviveStd(stdJson) : null), [stdJson])
  const live = useMemo(() => (std ? calcEstimate(toEngineInput(header, body), std) : null), [std, header, body])
  const result: EstimateResult | null = locked ? loaded.storedResult : live
  // 手入力をすべて外した、自動計算だけの結果（薄い文字で見せる）。確定済みは、保存した結果を見せる
  const auto = useMemo(() => (std ? calcEstimate(stripOverrides(toEngineInput(header, body)), std) : null), [std, header, body])
  const ref: EstimateResult | null = locked ? loaded.storedResult : auto

  // 基準が変わって、保存時の金額と、今の自動計算が違うときのお知らせ
  const [stale, setStale] = useState<{ stored: number; now: number } | null>(null)
  const [copyOpen, setCopyOpen] = useState(false)
  useEffect(() => {
    const sr = loaded.storedResult
    if (!locked && loaded.id && sr && live && (sr.total !== live.total || sr.amount !== live.amount)) {
      setStale({ stored: sr.amount, now: live.amount })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- 更新の部品 ----
  const setH = <K extends keyof EstimateHeader>(k: K, v: EstimateHeader[K]) => { setHeader(h => ({ ...h, [k]: v })); setDirty(true) }
  const setB = (patch: Partial<EstimateBody>) => { setBody(b => ({ ...b, ...patch })); setDirty(true) }
  const META = new Set(["partName", "manualPlateAmount", "manualPrintAmount"])
  const released = (had: boolean) => { if (had) setNotice("この行の内容を変えたので、金額の固定（手入力）を解除しました。もう一度固定するには、金額の欄に入力してください") }
  const updGroup = (i: number, patch: Partial<PressGroupInput>, release = false) => {
    const g = body.groups[i]
    const rel = release || Object.keys(patch).some(k => !META.has(k) && k !== "paper")
    const had = g.paper.manualAmount != null || g.manualPlateAmount != null || g.manualPrintAmount != null
    const paper = { ...(patch.paper ?? g.paper), ...(rel ? { manualAmount: null } : {}) }
    const next: PressGroupInput = { ...g, ...patch, paper, ...(rel ? { manualPlateAmount: null, manualPrintAmount: null } : {}) }
    setB({ groups: body.groups.map((x, k) => (k === i ? next : x)) })
    if (rel) released(had)
  }
  const updPaper = (i: number, patch: Partial<PaperLineInput>) => {
    const g = body.groups[i]
    updGroup(i, { paper: { ...g.paper, ...patch } }, Object.keys(patch).some(k => k !== "manualAmount"))
  }
  const updColors = (i: number, patch: { colorsFront?: number | null; colorsBack?: number | null }) => {
    const g = body.groups[i]
    const front = patch.colorsFront !== undefined ? patch.colorsFront : g.colorsFront ?? null
    const back = patch.colorsBack !== undefined ? patch.colorsBack : g.colorsBack ?? null
    updGroup(i, { colorsFront: front, colorsBack: back, paper: { ...g.paper, colors: (front ?? 0) + (back ?? 0) } }, true)
  }
  // 行の内容（数量・単価・台数など）を変えたら、その行の金額の固定は外れる。名前（内容）だけの修正では、外れない
  const patchLine = <T extends { manualAmount?: number | null }>(item: T, patch: Partial<T>): T => {
    const rel = Object.keys(patch).some(k => k !== "manualAmount" && k !== "label")
    if (rel) released(item.manualAmount != null)
    return { ...item, ...patch, ...(rel ? { manualAmount: null } : {}) } as T
  }
  const updPlateMaking = (i: number, patch: Partial<PlateMakingInput>) =>
    setB({ plateMaking: body.plateMaking.map((l, k) => (k === i ? patchLine(l, patch) : l)) })
  const updProc = (i: number, patch: Partial<ProcLineInput>) =>
    setB({ proc: body.proc.map((l, k) => (k === i ? patchLine(l, patch) : l)) })
  const updOther = (i: number, patch: Partial<OtherLineInput>) =>
    setB({ others: body.others.map((l, k) => (k === i ? patchLine(l, patch) : l)) })
  const updStuff = (patch: { stuffQty?: number | null; stuffPrice?: number | null }) => {
    released(body.stuffManualAmount != null)
    setB({ ...patch, stuffManualAmount: null })
  }

  const changeStandard = async (id: string) => {
    if (id === standardId) return
    setError("")
    const r = await fetch(`/api/estimates/std/${id}`)
    if (!r.ok) { setError("基準の値を読み込めませんでした"); return }
    setStdJson(await r.json())
    setStandardId(id)
    setDirty(true)
  }

  // ---- 保存・確定など ----
  const payload = () => ({ category_id: loaded.category.id, standard_id: standardId, header, body })
  const save = async (): Promise<string | null> => {
    setSaving(true)
    setError("")
    setNotice("")
    const res = loaded.id
      ? await fetch(`/api/estimates/${loaded.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload()) })
      : await fetch("/api/estimates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload()) })
    const d = await res.json().catch(() => null)
    setSaving(false)
    if (!res.ok) { setError(d?.error ?? "保存に失敗しました"); return null }
    setDirty(false)
    return loaded.id ?? (d.id as string)
  }
  const onSave = async () => {
    const id = await save()
    if (!id) return
    if (!loaded.id) router.replace(`/dashboard/estimates/${id}`)
    else { setNotice("保存しました"); }
  }
  const onConfirm = async () => {
    if (!confirm("確定します。確定すると、この時点の単価で固定され、基準を直しても変わりません。よろしいですか？")) return
    const id = await save()
    if (!id) return
    const res = await fetch(`/api/estimates/${id}/confirm`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmed: true }) })
    const d = await res.json().catch(() => null)
    if (!res.ok) { setError(d?.error ?? "確定に失敗しました"); return }
    if (!loaded.id) router.replace(`/dashboard/estimates/${id}`)
    else reload()
  }
  const onUnconfirm = async () => {
    if (!confirm("確定を取り消します。確定していたときの金額は、固定されたまま、編集に戻ります（勝手に再計算されません）。よろしいですか？")) return
    const res = await fetch(`/api/estimates/${loaded.id}/confirm`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmed: false }) })
    const d = await res.json().catch(() => null)
    if (!res.ok) { setError(d?.error ?? "取り消しに失敗しました"); return }
    reload()
  }
  const onCopy = async (mode: "price" | "amount" | "recalc") => {
    if (dirty && !confirm("未保存の変更は、複製に含まれません。複製しますか？")) return
    const res = await fetch(`/api/estimates/${loaded.id}/copy`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode }) })
    const d = await res.json().catch(() => null)
    if (!res.ok) { setError(d?.error ?? "複製に失敗しました"); return }
    setDirty(false)
    router.push(`/dashboard/estimates/${d.id}`)
  }
  const onDelete = async () => {
    if (!confirm(`${loaded.estimateNo} を削除しますか？`)) return
    const res = await fetch(`/api/estimates/${loaded.id}`, { method: "DELETE" })
    const d = await res.json().catch(() => null)
    if (!res.ok) { setError(d?.error ?? "削除に失敗しました"); return }
    setDirty(false)
    router.push("/dashboard/estimates")
  }

  // 保存時の結果を、手入力として固定する（基準が変わったときのお知らせから）
  const freezeStored = (mode: "price" | "amount") => {
    if (!loaded.storedResult) return
    const f = freezeFormData(header, body, loaded.storedResult, mode)
    setHeader(f.header)
    setBody(f.body)
    setStale(null)
    setDirty(true)
    setNotice(mode === "price" ? "保存時の単価を固定しました。保存すると反映されます" : "保存時の金額を固定しました。保存すると反映されます")
  }
  const clearAll = () => {
    if (!confirm("手入力（数量・単価・金額・営業費率など）を、すべて外して、自動計算に戻します。製版や加工の手入力の単価も外れるので、金額が大きく変わることがあります。よろしいですか？")) return
    const f = clearFormOverrides(header, body)
    setHeader(f.header)
    setBody(f.body)
    setDirty(true)
    setNotice("手入力を、すべて外しました。保存するまで、反映されません")
  }

  const cat = std ? stdJson?.catalog : undefined
  const hasDigipak = body.proc.some(l => l.label === DIGIPAK_LABEL)
  const order = (header.main_qty ?? 0) + (header.sample_qty ?? 0)
  const rateHint = std ? `新譜 ${fmt((std.salesRateNew ?? 0) * 100, 2)}%／旧譜 ${fmt((std.salesRateOld ?? 0) * 100, 2)}%` : ""

  return (
    <div className="p-4 max-w-[1500px] mx-auto">
      {/* 上のバー */}
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/estimates" className="text-sm text-gray-500 hover:text-gray-700">← 見積一覧</Link>
          <h1 className="text-lg font-bold text-gray-900">{loaded.estimateNo ? `見積書 ${loaded.estimateNo}` : "見積書（新規）"}</h1>
          <span className="text-xs text-gray-500">{loaded.category.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded ${locked ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{locked ? "確定" : "仮"}</span>
          {dirty && <span className="text-xs text-blue-600">未保存の変更があります</span>}
        </div>
        <div className="flex items-center gap-2">
          {!locked && (
            <>
              <button onClick={clearAll} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800">手入力をすべて外す</button>
              <button onClick={onSave} disabled={saving} className="px-4 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-40">{saving ? "保存中..." : "保存"}</button>
              <button onClick={onConfirm} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 border border-emerald-600 text-emerald-700 text-sm rounded-lg hover:bg-emerald-50 disabled:opacity-40"><Lock className="w-4 h-4" />確定</button>
            </>
          )}
          {locked && (
            <button onClick={onUnconfirm} className="flex items-center gap-1 px-3 py-1.5 border border-amber-600 text-amber-700 text-sm rounded-lg hover:bg-amber-50"><Unlock className="w-4 h-4" />確定を取り消す</button>
          )}
          {loaded.id && (
            <>
              <button onClick={() => setCopyOpen(o => !o)} className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50"><Copy className="w-4 h-4" />複製</button>
              {!locked && <button onClick={onDelete} className="flex items-center gap-1 px-3 py-1.5 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" />削除</button>}
            </>
          )}
        </div>
      </div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {notice && <p className="mb-3 text-sm text-emerald-700">{notice}</p>}
      {locked && <p className="mb-3 text-xs text-gray-500">確定済みです。確定したときの結果を表示しています。変更するには、「確定を取り消す」を押してください（確定していたときの金額は、固定されたまま、編集に戻ります）。</p>}

      {copyOpen && loaded.id && (
        <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <p className="text-sm font-medium text-gray-700">どのように、引き継いで複製しますか？（新しい番号の、仮の見積書ができます）</p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <button onClick={() => onCopy("price")} className="p-3 text-left bg-white border border-slate-300 rounded-lg hover:border-slate-500">
              <div className="font-medium text-gray-900">単価を引き継ぐ（おすすめ）</div>
              <div className="text-xs text-gray-500 mt-1">各行の単価と営業費率を、そのまま固定して写します。本番数などを変えると、金額は再計算されますが、単価は元のままです。再見積もり向きです。</div>
            </button>
            <button onClick={() => onCopy("amount")} className="p-3 text-left bg-white border border-slate-300 rounded-lg hover:border-slate-500">
              <div className="font-medium text-gray-900">金額をそのまま引き継ぐ</div>
              <div className="text-xs text-gray-500 mt-1">各行の金額と営業費を固定して写します。元の見積書と、同じ金額になります。</div>
            </button>
            <button onClick={() => onCopy("recalc")} className="p-3 text-left bg-white border border-slate-300 rounded-lg hover:border-slate-500">
              <div className="font-medium text-gray-900">自動計算し直す</div>
              <div className="text-xs text-gray-500 mt-1">入力だけを写して、今の基準で、計算し直します。手入力の値は、そのまま残ります。</div>
            </button>
          </div>
          <button onClick={() => setCopyOpen(false)} className="text-xs text-gray-500 hover:text-gray-700">閉じる</button>
        </div>
      )}

      {stale && !locked && (
        <div className="mb-3 p-3 bg-amber-50 border border-amber-300 rounded-xl text-sm space-y-2">
          <p className="text-amber-900">保存したときの金額（{fmt(stale.stored, 0)}円）と、今の自動計算（{fmt(stale.now, 0)}円）が、違っています。基準が変わった可能性があります。どちらを使いますか？</p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => freezeStored("price")} className="px-3 py-1.5 bg-white border border-amber-400 text-amber-900 rounded-lg hover:bg-amber-100">保存時の単価に固定する</button>
            <button onClick={() => freezeStored("amount")} className="px-3 py-1.5 bg-white border border-amber-400 text-amber-900 rounded-lg hover:bg-amber-100">保存時の金額に固定する</button>
            <button onClick={() => setStale(null)} className="px-3 py-1.5 text-amber-900 hover:underline">今の自動計算のまま使う</button>
          </div>
        </div>
      )}

      <div className="flex gap-4 items-start">
        <fieldset disabled={locked} className="flex-1 min-w-0 space-y-4">
          <datalist id="paper-names">{(cat?.paperNames ?? []).map(n => <option key={n} value={n} />)}</datalist>
          <datalist id="proc-labels">{(cat?.procLabels ?? []).map(p => <option key={p.label} value={p.label} />)}</datalist>
          <datalist id="plate-labels">{(cat?.plateLabels ?? []).map(n => <option key={n} value={n} />)}</datalist>
          <datalist id="other-labels">{TRAY_LABELS.map(n => <option key={n} value={n} />)}</datalist>

          <p className="text-[11px] text-gray-500">
            自動計算は、補助です。
            <span className="mx-1 px-1 border border-amber-400 bg-amber-50 text-amber-900 rounded">黄色の欄</span>
            に入力した値（数量・単価・金額・営業費率など）が、いつも優先されます。空欄の欄には、自動計算の値が、薄い文字で出ています。
          </p>

          {/* ヘッダー */}
          <section className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="grid grid-cols-6 gap-3">
              <Field label="基準" className="col-span-2">
                <select value={standardId} onChange={e => changeStandard(e.target.value)} className={inputCls}>
                  {loaded.standards.filter(s => !s.is_archived || s.id === standardId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="作成日"><input type="date" value={header.issue_date} onChange={e => setH("issue_date", e.target.value)} className={inputCls} /></Field>
              <Field label="納期"><input type="date" value={header.due_date} onChange={e => setH("due_date", e.target.value)} className={inputCls} /></Field>
              <Field label="新旧区分">
                <select value={header.new_old_kind} onChange={e => setH("new_old_kind", e.target.value as EstimateHeader["new_old_kind"])} className={inputCls}>
                  <option value="新">新譜</option>
                  <option value="旧">旧譜</option>
                  <option value="">なし（営業費なし）</option>
                </select>
              </Field>
              <Field label="営業費率（%・手入力）">
                <NumField
                  value={header.sales_rate_override === null ? null : Number((header.sales_rate_override * 100).toFixed(4))}
                  onChange={v => setH("sales_rate_override", v === null ? null : v / 100)}
                  placeholder={ref?.salesRate != null ? fmt(ref.salesRate * 100, 2) : "なし"}
                  hl
                />
              </Field>
              <Field label="宛名" className="col-span-2"><input value={header.customer_name} onChange={e => setH("customer_name", e.target.value)} className={inputCls} /></Field>
              <Field label="客先担当者"><input value={header.contact_name} onChange={e => setH("contact_name", e.target.value)} className={inputCls} /></Field>
              <Field label="品番"><input value={header.product_code} onChange={e => setH("product_code", e.target.value)} className={inputCls} /></Field>
              <Field label="本番数"><NumField value={header.main_qty} onChange={v => setH("main_qty", v)} /></Field>
              <Field label="見本数"><NumField value={header.sample_qty} onChange={v => setH("sample_qty", v)} /></Field>
              <Field label="品名" className="col-span-3"><input value={header.title} onChange={e => setH("title", e.target.value)} className={inputCls} /></Field>
              <Field label="内容" className="col-span-3"><input value={header.content} onChange={e => setH("content", e.target.value)} className={inputCls} /></Field>
              <Field label="納入先" className="col-span-2"><input value={header.delivery_to} onChange={e => setH("delivery_to", e.target.value)} className={inputCls} /></Field>
              <Field label="梱包形態" className="col-span-2"><input value={header.packing} onChange={e => setH("packing", e.target.value)} className={inputCls} /></Field>
              <Field label="備考" className="col-span-2"><input value={header.remarks} onChange={e => setH("remarks", e.target.value)} className={inputCls} /></Field>
              <Field label="メモ（社内用）" className="col-span-6"><input value={header.memo} onChange={e => setH("memo", e.target.value)} className={inputCls} /></Field>
            </div>
            <p className="mt-2 text-[11px] text-gray-400">オーダー数（本番数＋見本数）：{fmt(order)}　{rateHint ? `営業費率の基準：${rateHint}` : ""}</p>
          </section>

          {/* 用紙・刷版・印刷 */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800">用紙・刷版・印刷</h2>
              {body.groups.length < MAX_GROUPS && (
                <button type="button" onClick={() => setB({ groups: [...body.groups, emptyGroup()] })} className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"><Plus className="w-3.5 h-3.5" />行を追加</button>
              )}
            </div>
            {body.groups.map((g, i) => {
              const pr = result?.papers[i]
              const pt = result?.prints[i]
              const rp = ref?.papers[i]
              const rl = ref?.plates[i]
              const rt = ref?.prints[i]
              return (
                <div key={i} className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 w-5">{i + 1}</span>
                    <input placeholder="部位（フロントカバー、本文24Pなど）" value={g.partName ?? ""} onChange={e => updGroup(i, { partName: e.target.value })} className={`${inputCls} max-w-xs`} />
                    {body.groups.length > 1 && !locked && (
                      <button type="button" onClick={() => setB({ groups: body.groups.filter((_, k) => k !== i) })} className="ml-auto p-1 text-gray-400 hover:text-red-500" title="この行を削除"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                  <div className="grid grid-cols-12 gap-2">
                    <Field label="用紙名" className="col-span-3"><input list="paper-names" value={g.paper.name} onChange={e => updPaper(i, { name: e.target.value })} className={inputCls} /></Field>
                    <Field label="判" className="col-span-1">
                      <select value={g.han} onChange={e => updGroup(i, { han: e.target.value })} className={inputCls}>{HAN.map(h => <option key={h} value={h}>{h || "—"}</option>)}</select>
                    </Field>
                    <Field label="用紙サイズ" className="col-span-1">
                      <select value={g.paper.sizeKind} onChange={e => updPaper(i, { sizeKind: e.target.value })} className={inputCls}>{SIZE_KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                    </Field>
                    <Field label="斤量" className="col-span-1"><NumField value={g.paper.gsm} onChange={v => updPaper(i, { gsm: v })} /></Field>
                    <Field label="包単位" className="col-span-1"><NumField value={g.paper.packUnit} onChange={v => updPaper(i, { packUnit: v })} /></Field>
                    <Field label="面" className="col-span-1"><NumField value={g.paper.faces} onChange={v => updPaper(i, { faces: v })} /></Field>
                    <Field label="各面" className="col-span-1"><NumField value={g.paper.eachFaces} onChange={v => updPaper(i, { eachFaces: v })} /></Field>
                    <Field label="台数" className="col-span-1"><NumField value={g.paper.units} onChange={v => updPaper(i, { units: v })} /></Field>
                    <Field label="印刷種別" className="col-span-2">
                      <select value={g.printKind} onChange={e => updGroup(i, { printKind: e.target.value })} className={inputCls}>{PRINT_KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                    </Field>
                    <Field label="色数（表）" className="col-span-1"><NumField value={g.colorsFront ?? null} onChange={v => updColors(i, { colorsFront: v })} /></Field>
                    <Field label="色数（裏）" className="col-span-1"><NumField value={g.colorsBack ?? null} onChange={v => updColors(i, { colorsBack: v })} /></Field>
                    <Field label="特色増し" className="col-span-1"><NumField value={g.extraColors} onChange={v => updGroup(i, { extraColors: v ?? 0 })} /></Field>
                    <div className="col-span-4 flex items-end gap-3 pb-1 text-xs text-gray-600">
                      <span className="text-[11px] text-gray-500">損紙の予備</span>
                      {([["B", "製本"], ["C", "断裁"], ["D", "抜き"], ["E", "表面加工"], ["digi", "デジ"]] as const).map(([k, l]) => (
                        <label key={k} className="flex items-center gap-1">
                          <input type="checkbox" checked={g.paper.spare[k]} onChange={e => updPaper(i, { spare: { ...g.paper.spare, [k]: e.target.checked } })} />
                          {l}
                        </label>
                      ))}
                    </div>
                    <Field label="手入力：用紙数量" className="col-span-2"><NumField value={g.paper.manualQty} onChange={v => updPaper(i, { manualQty: v })} placeholder={fmt(rp?.qty, 0)} hl /></Field>
                    <Field label="手入力：用紙単価" className="col-span-2"><NumField value={g.paper.manualPrice} onChange={v => updPaper(i, { manualPrice: v })} placeholder={fmt(rp?.price, 2)} hl /></Field>
                    <Field label="手入力：刷版単価" className="col-span-2"><NumField value={g.manualPlatePrice} onChange={v => updGroup(i, { manualPlatePrice: v })} placeholder={fmt(rl?.price, 2)} hl /></Field>
                    <Field label="手入力：印刷代" className="col-span-2"><NumField value={g.manualPrintPrice} onChange={v => updGroup(i, { manualPrintPrice: v })} placeholder={fmt(rt?.unitPrice, 2)} hl /></Field>
                    <Field label="手入力：通し数" className="col-span-2"><NumField value={g.manualPrintPasses} onChange={v => updGroup(i, { manualPrintPasses: v })} placeholder={fmt(rt?.passesUsed, 0)} hl /></Field>
                  </div>
                  <div className="grid grid-cols-8 gap-2">
                    <ResultCell label="通し数" value={fmt(pr?.passes, 0)} />
                    <ResultCell label="用紙数量" value={fmt(pr?.qty, 0)} />
                    <ResultCell label="用紙単価" value={fmt(pr?.price, 2)} />
                    <AmountCell label="用紙金額" manual={g.paper.manualAmount} ref0={rp?.amount} onChange={v => updPaper(i, { manualAmount: v })} />
                    <AmountCell label="刷版金額" manual={g.manualPlateAmount} ref0={rl?.amount} onChange={v => updGroup(i, { manualPlateAmount: v })} />
                    <ResultCell label="印刷代" value={fmt(pt?.unitPrice, 2)} />
                    <ResultCell label="印刷の通し数" value={fmt(pt?.passesUsed, 0)} />
                    <AmountCell label="印刷金額" manual={g.manualPrintAmount} ref0={rt?.amount} onChange={v => updGroup(i, { manualPrintAmount: v })} />
                  </div>
                </div>
              )
            })}
          </section>

          {/* 製版 */}
          <section className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800">製版</h2>
              {body.plateMaking.length < MAX_PLATE_MAKING && (
                <button type="button" onClick={() => setB({ plateMaking: [...body.plateMaking, { label: "", color: "", proof: "", qty: 1, units: 1, manualPrice: null, line: body.plateMaking.length + 1 }] })} className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"><Plus className="w-3.5 h-3.5" />行を追加</button>
              )}
            </div>
            {body.plateMaking.length === 0 && <p className="text-xs text-gray-400">製版の行がありません。</p>}
            {body.plateMaking.map((l, i) => {
              const r = result?.plateMaking[i]
              const rr = ref?.plateMaking[i]
              return (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <Field label="内容" className="col-span-3"><input list="plate-labels" value={l.label} onChange={e => updPlateMaking(i, { label: e.target.value })} className={inputCls} /></Field>
                  <Field label="カラー" className="col-span-1"><select value={l.color} onChange={e => updPlateMaking(i, { color: e.target.value })} className={inputCls}>{COLORS.map(c => <option key={c} value={c}>{c || "—"}</option>)}</select></Field>
                  <Field label="校正" className="col-span-1"><select value={l.proof} onChange={e => updPlateMaking(i, { proof: e.target.value })} className={inputCls}>{PROOFS.map(c => <option key={c} value={c}>{c || "—"}</option>)}</select></Field>
                  <Field label="数量" className="col-span-1"><NumField value={l.qty} onChange={v => updPlateMaking(i, { qty: v })} /></Field>
                  <Field label="台数" className="col-span-1"><NumField value={l.units} onChange={v => updPlateMaking(i, { units: v })} /></Field>
                  <Field label="手入力：単価" className="col-span-2"><NumField value={l.manualPrice} onChange={v => updPlateMaking(i, { manualPrice: v })} placeholder={fmt(rr?.price, 2)} hl /></Field>
                  <ResultCell label="単価" value={fmt(r?.price, 2)} />
                  <AmountCell label="金額" manual={l.manualAmount} ref0={rr?.amount} onChange={v => updPlateMaking(i, { manualAmount: v })} />
                  {!locked && <button type="button" onClick={() => setB({ plateMaking: body.plateMaking.filter((_, k) => k !== i) })} className="p-1 pb-2 text-gray-400 hover:text-red-500" title="削除"><Trash2 className="w-4 h-4" /></button>}
                </div>
              )
            })}
          </section>

          {/* 加工 */}
          <section className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800">加工</h2>
              {body.proc.length < MAX_PROC && (
                <button type="button" onClick={() => setB({ proc: [...body.proc, { label: "", basis: "個", manualQty: null, manualPrice: null }] })} className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"><Plus className="w-3.5 h-3.5" />行を追加</button>
              )}
            </div>
            {body.proc.length === 0 && <p className="text-xs text-gray-400">加工の行がありません。</p>}
            {body.proc.map((l, i) => {
              const r = result?.proc[i]
              const rr = ref?.proc[i]
              return (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <Field label="内容（選ぶか、自由に入力）" className="col-span-3"><input list="proc-labels" value={l.label} onChange={e => updProc(i, { label: e.target.value })} className={inputCls} /></Field>
                  <Field label="数量の基準" className="col-span-1"><select value={l.basis} onChange={e => updProc(i, { basis: e.target.value })} className={inputCls}>{BASIS.map(c => <option key={c} value={c}>{c || "—"}</option>)}</select></Field>
                  <Field label="手入力：数量" className="col-span-1"><NumField value={l.manualQty} onChange={v => updProc(i, { manualQty: v })} placeholder={fmt(rr?.qty, 0)} hl /></Field>
                  <Field label="手入力：単価" className="col-span-2"><NumField value={l.manualPrice} onChange={v => updProc(i, { manualPrice: v })} placeholder={fmt(rr?.price, 2)} hl /></Field>
                  <ResultCell label="数量" value={fmt(r?.qty, 0)} />
                  <ResultCell label={`単価${r && r.source !== "なし" ? `（${r.source}）` : ""}`} value={fmt(r?.price, 2)} />
                  <AmountCell label="金額" manual={l.manualAmount} ref0={rr?.amount} onChange={v => updProc(i, { manualAmount: v })} />
                  {!locked && <button type="button" onClick={() => setB({ proc: body.proc.filter((_, k) => k !== i) })} className="p-1 pb-2 text-gray-400 hover:text-red-500" title="削除"><Trash2 className="w-4 h-4" /></button>}
                </div>
              )
            })}
            {hasDigipak && (
              <div className="grid grid-cols-6 gap-2 pt-1 border-t border-gray-100">
                <Field label="デジパックの面数">
                  <select value={body.dvFaces} onChange={e => setB({ dvFaces: e.target.value })} className={inputCls}>
                    <option value="">—</option>
                    {["2面", "3面", "4面", "5面", "6面"].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Field>
                <Field label="ポケット">
                  <select value={body.dvPocket} onChange={e => setB({ dvPocket: e.target.value })} className={inputCls}>
                    <option value="無し">無し</option>
                    <option value="有り">有り</option>
                  </select>
                </Field>
              </div>
            )}
          </section>

          {/* 入稿形態・加工他 */}
          <section className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm space-y-2">
            <h2 className="text-sm font-bold text-gray-800">入稿形態・加工他</h2>
            <div className="grid grid-cols-12 gap-2 items-end">
              <Field label="入稿形態" className="col-span-5"><input value={body.stuffLabel} onChange={e => setB({ stuffLabel: e.target.value })} className={inputCls} /></Field>
              <Field label="数量" className="col-span-2"><NumField value={body.stuffQty} onChange={v => updStuff({ stuffQty: v })} /></Field>
              <Field label="単価" className="col-span-2"><NumField value={body.stuffPrice} onChange={v => updStuff({ stuffPrice: v })} /></Field>
              <AmountCell label="金額" manual={body.stuffManualAmount} ref0={ref?.stuffAmount} onChange={v => setB({ stuffManualAmount: v })} />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-gray-500">加工他（トレイ代など。「デジパックトレイ代 (1枚貼り)」を選び、数量と単価を空欄にすると、自動で入ります）</span>
              {body.others.length < MAX_OTHERS && (
                <button type="button" onClick={() => setB({ others: [...body.others, { label: "", manualQty: null, manualPrice: null }] })} className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"><Plus className="w-3.5 h-3.5" />行を追加</button>
              )}
            </div>
            {body.others.map((l, i) => {
              const r = result?.others[i]
              const rr = ref?.others[i]
              return (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <Field label="内容" className="col-span-3"><input list="other-labels" value={l.label} onChange={e => updOther(i, { label: e.target.value })} className={inputCls} /></Field>
                  <Field label="手入力：数量" className="col-span-1"><NumField value={l.manualQty} onChange={v => updOther(i, { manualQty: v })} placeholder={fmt(rr?.qty, 0)} hl /></Field>
                  <Field label="手入力：単価" className="col-span-2"><NumField value={l.manualPrice} onChange={v => updOther(i, { manualPrice: v })} placeholder={fmt(rr?.price, 2)} hl /></Field>
                  <ResultCell label="数量" value={fmt(r?.qty, 0)} />
                  <ResultCell label="単価" value={fmt(r?.price, 2)} />
                  <AmountCell label="金額" manual={l.manualAmount} ref0={rr?.amount} onChange={v => updOther(i, { manualAmount: v })} />
                  {!locked && <button type="button" onClick={() => setB({ others: body.others.filter((_, k) => k !== i) })} className="p-1 pb-2 text-gray-400 hover:text-red-500" title="削除"><Trash2 className="w-4 h-4" /></button>}
                </div>
              )
            })}
          </section>
        </fieldset>

        {/* 合計（どの項目も、直接入力できる。空欄なら自動計算） */}
        <aside className="w-72 shrink-0 sticky top-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm space-y-2 text-sm">
          <h2 className="text-sm font-bold text-gray-800">合計</h2>
          <fieldset disabled={locked} className="space-y-2">
            {([
              ["小計（製版・刷版・印刷・加工・入稿）", body.manualSubtotal, ref?.subtotal, (v: number | null) => setB({ manualSubtotal: v }), 0],
              [`営業費${result?.salesRate != null ? `（${fmt(result.salesRate * 100, 2)}%）` : ""}`, body.manualSalesCost, ref?.salesCost, (v: number | null) => setB({ manualSalesCost: v }), 0],
              ["合計", body.manualTotal, ref?.total, (v: number | null) => setB({ manualTotal: v }), 0],
              ["単価", body.manualUnitPrice, ref?.unitPrice, (v: number | null) => setB({ manualUnitPrice: v }), 1],
              ["金額（見積金額）", body.manualAmount, ref?.amount, (v: number | null) => setB({ manualAmount: v }), 0],
            ] as [string, number | null, number | null | undefined, (v: number | null) => void, number][]).map(([l, manual, a, on, d]) => (
              <div key={l} className="space-y-0.5">
                <div className="text-[11px] text-gray-500">{l}{manual !== null ? "（手入力）" : ""}</div>
                <NumField value={manual} onChange={on} placeholder={fmt(a, d)} hl />
              </div>
            ))}
          </fieldset>
          <div className="pt-2 border-t border-gray-200 space-y-1">
            <div className="flex justify-between"><span className="text-gray-500 text-xs">用紙</span><span className="tabular-nums">{fmt(result?.paperTotal, 0)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 text-xs">製版</span><span className="tabular-nums">{fmt(result?.plateMakingTotal, 0)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 text-xs">加工他</span><span className="tabular-nums">{fmt(result?.otherTotal, 0)}</span></div>
          </div>
          <div className="pt-2 border-t border-gray-200 space-y-1">
            <div className="flex justify-between"><span className="font-bold">合計</span><span className="tabular-nums font-bold">{fmt(result?.total, 0)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 text-xs">オーダー数</span><span className="tabular-nums">{fmt(result?.order, 0)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 text-xs">単価</span><span className="tabular-nums text-base font-bold">{fmt(result?.unitPrice, 1)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 text-xs">金額</span><span className="tabular-nums text-base font-bold">{fmt(result?.amount, 0)}</span></div>
          </div>
          <p className="text-[11px] text-gray-400 pt-1">合計・単価・金額の欄に入力すると、その値が優先されます（上の行の金額を直しても、そこは変わりません）。空欄にすると、自動計算に戻ります。</p>
        </aside>
      </div>
    </div>
  )
}