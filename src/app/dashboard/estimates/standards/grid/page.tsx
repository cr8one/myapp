"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import type { ClipboardEvent, KeyboardEvent } from "react"
import Link from "next/link"

type Sheet = { code: string; name: string; kind: string }
type Std = { id: string; name: string; is_archived: boolean }
type Item = { id: string; name: string; unit: string | null }
type Cell = { value: number | null; is_lump: boolean }
type Tier = { id: string; lot_from: number; lot_to: number | null; cells: Record<string, Cell> }
type GridData = {
  sheets: Sheet[]
  sheet: Sheet | null
  standards: Std[]
  items: Item[]
  values?: Record<string, Record<string, Cell>>
  tiers?: Record<string, Tier[]>
}
type Edit = {
  standard_id: string
  item_id: string
  tier_id: string | null
  text: string
  value: number | null
  invalid: boolean
  is_lump: boolean
  before: number | null
  before_lump: boolean
}
type Col = { key: string; label: string; itemId: string; lotFrom?: number }
type Ref = { key: string; base: Cell | null; editable: boolean; tierId: string | null; title: string }

const NO_LUMP_SHEETS = ["basic", "paper", "tray", "plate_size", "plate_spec"]
const normalize = (s: string) => s.normalize("NFKC").toLowerCase()
const fmt = (v: number | null) => (v === null ? "" : String(v))

function parseText(t: string): { value: number | null; invalid: boolean } {
  const s = t
    .replace(/[,\s　]/g, "")
    .replace(/[０-９．－]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
  if (s === "") return { value: null, invalid: false }
  const n = Number(s)
  return Number.isFinite(n) ? { value: n, invalid: false } : { value: null, invalid: true }
}

export default function EstimateStandardsGridPage() {
  const [data, setData] = useState<GridData | null>(null)
  const [sheetCode, setSheetCode] = useState("")
  const [itemId, setItemId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [qStd, setQStd] = useState("")
  const [qItem, setQItem] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  const [diffOn, setDiffOn] = useState(false)
  const [edits, setEdits] = useState<Record<string, Edit>>({})
  const [saving, setSaving] = useState(false)
  const inputs = useRef(new Map<string, HTMLInputElement>())

  const load = useCallback(async (code?: string) => {
    setLoading(true)
    setError("")
    const res = await fetch(`/api/estimates/standards/grid${code ? `?sheet=${encodeURIComponent(code)}` : ""}`)
    const body = await res.json().catch(() => null)
    if (!res.ok) {
      setError(body?.error ?? "読み込みに失敗しました")
      setLoading(false)
      return
    }
    setData(body)
    setSheetCode(body.sheet?.code ?? "")
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const isMatrix = data?.sheet?.kind === "matrix"

  // 単価表では、最初に値のある項目を選んでおく
  useEffect(() => {
    if (!data || data.sheet?.kind !== "matrix") return
    if (data.items.some(i => i.id === itemId)) return
    const used = new Set<string>()
    for (const list of Object.values(data.tiers ?? {})) for (const t of list) for (const k of Object.keys(t.cells)) used.add(k)
    setItemId((data.items.find(i => used.has(i.id)) ?? data.items[0])?.id ?? "")
  }, [data, itemId])

  const dirty = Object.keys(edits).length
  useEffect(() => {
    if (dirty === 0) return
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = "" }
    window.addEventListener("beforeunload", h)
    return () => window.removeEventListener("beforeunload", h)
  }, [dirty])

  const switchSheet = (code: string) => {
    if (code === sheetCode) return
    if (dirty > 0 && !confirm("未保存の変更があります。破棄して、別の表に移りますか？")) return
    setEdits({})
    setItemId("")
    setQItem("")
    setNotice("")
    load(code)
  }

  const reload = () => {
    if (dirty > 0 && !confirm("未保存の変更を破棄して、最新の内容を読み込みます。よろしいですか？")) return
    setEdits({})
    setNotice("")
    load(sheetCode)
  }

  const rows: Std[] = (() => {
    if (!data) return []
    const q = normalize(qStd.trim())
    return data.standards.filter(s => (showArchived || !s.is_archived) && (!q || normalize(s.name).includes(q)))
  })()

  const cols: Col[] = (() => {
    if (!data) return []
    if (isMatrix) {
      if (!itemId) return []
      const set = new Set<number>()
      for (const s of rows) for (const t of data.tiers?.[s.id] ?? []) set.add(t.lot_from)
      return Array.from(set)
        .sort((a, b) => a - b)
        .map(f => ({ key: `l${f}`, label: `${f.toLocaleString()}〜`, itemId, lotFrom: f }))
    }
    const q = normalize(qItem.trim())
    return data.items.filter(i => !q || normalize(i.name).includes(q)).map(i => ({ key: i.id, label: i.name, itemId: i.id }))
  })()

  const cellRef = (s: Std, c: Col): Ref => {
    if (isMatrix) {
      const t = (data?.tiers?.[s.id] ?? []).find(x => x.lot_from === c.lotFrom)
      if (!t) return { key: "", base: null, editable: false, tierId: null, title: "" }
      return {
        key: `${t.id}|${c.itemId}`,
        base: t.cells[c.itemId] ?? null,
        editable: true,
        tierId: t.id,
        title: `${t.lot_from.toLocaleString()}〜${t.lot_to === null ? "" : t.lot_to.toLocaleString()}`,
      }
    }
    return { key: `${s.id}|${c.itemId}`, base: data?.values?.[s.id]?.[c.itemId] ?? null, editable: true, tierId: null, title: "" }
  }

  const effective = (ref: Ref) => {
    const e = edits[ref.key]
    if (e) return { text: e.text, value: e.value, is_lump: e.is_lump, invalid: e.invalid, dirty: true }
    const v = ref.base?.value ?? null
    return { text: fmt(v), value: v, is_lump: ref.base?.is_lump ?? false, invalid: false, dirty: false }
  }

  const setCell = (s: Std, c: Col, patch: { text?: string; is_lump?: boolean }) => {
    const ref = cellRef(s, c)
    if (!ref.editable) return
    setEdits(prev => {
      const cur = prev[ref.key]
      const baseVal = ref.base?.value ?? null
      const baseLump = ref.base?.is_lump ?? false
      const text = patch.text ?? cur?.text ?? fmt(baseVal)
      const lump = patch.is_lump ?? cur?.is_lump ?? baseLump
      const { value, invalid } = parseText(text)
      const next = { ...prev }
      if (!invalid && value === baseVal && (value === null || lump === baseLump)) {
        delete next[ref.key]
        return next
      }
      next[ref.key] = {
        standard_id: s.id,
        item_id: c.itemId,
        tier_id: ref.tierId,
        text,
        value,
        invalid,
        is_lump: value === null ? false : lump,
        before: baseVal,
        before_lump: baseLump,
      }
      return next
    })
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>, r: number, c: number) => {
    const move = (dr: number) => {
      const el = inputs.current.get(`${r + dr}:${c}`)
      if (el) {
        e.preventDefault()
        el.focus()
        el.select()
      }
    }
    if (e.key === "ArrowDown" || e.key === "Enter") move(1)
    else if (e.key === "ArrowUp") move(-1)
  }

  // Excelなどからコピーした表を、選んだセルを左上として貼り付ける
  const onPaste = (e: ClipboardEvent<HTMLInputElement>, r: number, c: number) => {
    const text = e.clipboardData.getData("text")
    if (!/[\t\n]/.test(text)) return
    e.preventDefault()
    const lines = text.replace(/\r/g, "").split("\n")
    if (lines[lines.length - 1] === "") lines.pop()
    lines.forEach((line, dr) =>
      line.split("\t").forEach((cell, dc) => {
        const s = rows[r + dr]
        const col = cols[c + dc]
        if (s && col) setCell(s, col, { text: cell })
      })
    )
  }

  const save = async () => {
    const list = Object.values(edits)
    if (list.length === 0 || !data?.sheet) return
    if (list.some(e => e.invalid)) {
      setError("数値として読めないセルがあります（赤いセル）")
      return
    }
    setSaving(true)
    setError("")
    setNotice("")
    const res = await fetch("/api/estimates/standards/grid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sheet_code: data.sheet.code,
        changes: list.map(e => ({
          standard_id: e.standard_id,
          item_id: e.item_id,
          tier_id: e.tier_id,
          before: e.before,
          before_lump: e.before_lump,
          value: e.value,
          is_lump: e.is_lump,
        })),
      }),
    })
    const body = await res.json().catch(() => null)
    if (!res.ok) {
      const more = Array.isArray(body?.conflicts) ? `：${body.conflicts.join("、")}` : ""
      setError(`${body?.error ?? "保存に失敗しました"}${more}`)
      setSaving(false)
      return
    }
    setEdits({})
    setNotice(`${list.length}件を保存しました`)
    await load(data.sheet.code)
    setSaving(false)
  }

  // 列ごとに、最も多い値を求める（違いの強調用）
  const modes: Map<string, string> | null = (() => {
    if (!diffOn) return null
    const m = new Map<string, string>()
    for (const c of cols) {
      const cnt = new Map<string, number>()
      for (const s of rows) {
        const ref = cellRef(s, c)
        if (!ref.editable) continue
        const t = effective(ref).text.trim()
        cnt.set(t, (cnt.get(t) ?? 0) + 1)
      }
      let best = ""
      let n = -1
      for (const [t, k] of Array.from(cnt.entries())) {
        if (k > n) {
          best = t
          n = k
        }
      }
      m.set(c.key, best)
    }
    return m
  })()

  const showLump = !!data?.sheet && !NO_LUMP_SHEETS.includes(data.sheet.code)
  const itemOptions = (() => {
    if (!data) return []
    const q = normalize(qItem.trim())
    return data.items.filter(i => i.id === itemId || !q || normalize(i.name).includes(q))
  })()

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-gray-900">基準の一覧表（まとめて編集）</h1>
        <Link href="/dashboard/estimates/standards" className="text-sm text-gray-500 hover:text-gray-700">← 見積書マスタに戻る</Link>
      </div>

      {data && (
        <div className="flex gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
          {data.sheets.map(s => (
            <button
              key={s.code}
              onClick={() => switchSheet(s.code)}
              className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                s.code === sheetCode ? "border-slate-700 text-slate-900" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
        <input
          autoComplete="off"
          placeholder="基準名で絞り込み"
          value={qStd}
          onChange={e => setQStd(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 bg-white w-48"
        />
        <input
          autoComplete="off"
          placeholder="項目名で絞り込み"
          value={qItem}
          onChange={e => setQItem(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 bg-white w-48"
        />
        {isMatrix && (
          <label className="flex items-center gap-2 text-gray-600">
            項目
            <select value={itemId} onChange={e => setItemId(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 bg-white max-w-[280px]">
              {itemOptions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </label>
        )}
        <label className="flex items-center gap-1.5 text-gray-600">
          <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
          アーカイブ済みも表示
        </label>
        <label className="flex items-center gap-1.5 text-gray-600">
          <input type="checkbox" checked={diffOn} onChange={e => setDiffOn(e.target.checked)} />
          違いを強調
        </label>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-gray-500">{dirty > 0 ? `${dirty}件の未保存の変更` : ""}</span>
          <button onClick={reload} className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">最新を読み込む</button>
          <button
            onClick={save}
            disabled={dirty === 0 || saving}
            className="px-4 py-1.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-40"
          >
            {saving ? "保存中..." : "まとめて保存"}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-3">
        セルを選んで入力します（↑↓・Enterで上下に移動。Excelからコピーした表は、貼り付けできます）。
        <span className="mx-1 px-1 bg-blue-50 text-blue-700">青</span>未保存の変更、
        <span className="mx-1 px-1 bg-amber-50 text-amber-800">黄</span>一式（固定）、
        <span className="mx-1 px-1 bg-rose-50 text-rose-700">薄い赤</span>列で最も多い値と違う、
        <span className="mx-1 px-1 bg-red-100 text-red-700">赤</span>数値として読めない。
        単価表の列は、ロットの開始値です（カーソルを合わせると、その基準の範囲が出ます）。
      </p>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {notice && <p className="mb-3 text-sm text-emerald-700">{notice}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : !data || rows.length === 0 || cols.length === 0 ? (
        <p className="text-sm text-gray-400">表示できるデータがありません。</p>
      ) : (
        <div className="overflow-auto border border-gray-200 rounded-xl bg-white shadow-sm max-h-[calc(100vh-330px)]">
          <table className="text-xs border-collapse">
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-20 bg-slate-100 border-b border-r border-gray-200 px-3 py-2 text-left whitespace-nowrap min-w-[200px]">基準</th>
                {cols.map(c => (
                  <th key={c.key} className="sticky top-0 z-10 bg-slate-100 border-b border-gray-200 px-2 py-2 text-left font-medium text-gray-700 min-w-[96px] max-w-[170px]">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((s, r) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="sticky left-0 z-10 bg-white border-b border-r border-gray-100 px-3 py-1 whitespace-nowrap">
                    <Link href={`/dashboard/estimates/standards/${s.id}`} className="text-blue-700 hover:underline">{s.name}</Link>
                    {s.is_archived && <span className="ml-1 text-[10px] text-gray-400">（アーカイブ）</span>}
                  </td>
                  {cols.map((c, ci) => {
                    const ref = cellRef(s, c)
                    if (!ref.editable) {
                      return <td key={c.key} className="border-b border-gray-100 bg-gray-50 text-center text-gray-300">—</td>
                    }
                    const e = effective(ref)
                    const differs = !!modes && e.text.trim() !== (modes.get(c.key) ?? "")
                    const bg = e.invalid ? "bg-red-100" : e.dirty ? "bg-blue-50" : e.is_lump ? "bg-amber-50" : differs ? "bg-rose-50" : ""
                    return (
                      <td key={c.key} title={ref.title} className={`border-b border-gray-100 p-0 ${bg}`}>
                        <div className="flex items-center">
                          <input
                            ref={el => {
                              const k = `${r}:${ci}`
                              if (el) inputs.current.set(k, el)
                              else inputs.current.delete(k)
                            }}
                            value={e.text}
                            inputMode="decimal"
                            onChange={ev => setCell(s, c, { text: ev.target.value })}
                            onKeyDown={ev => onKey(ev, r, ci)}
                            onPaste={ev => onPaste(ev, r, ci)}
                            onFocus={ev => ev.target.select()}
                            className="w-full min-w-[70px] bg-transparent px-2 py-1 text-right tabular-nums outline-none focus:bg-white focus:ring-1 focus:ring-blue-400"
                          />
                          {showLump && e.value !== null && (
                            <button
                              type="button"
                              onClick={() => setCell(s, c, { is_lump: !e.is_lump })}
                              title="一式（固定）の切り替え"
                              className={`shrink-0 mr-1 w-4 h-4 text-[10px] leading-none rounded ${e.is_lump ? "bg-amber-400 text-white" : "bg-gray-100 text-gray-400"}`}
                            >
                              一
                            </button>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}