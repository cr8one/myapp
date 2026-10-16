"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Row = {
  id: string
  name: string
  type: string
  maker: string
  rendo_tray_cd: string | null
  optimal_stock: number | null
  prev_qty: number | null
  inhouse_qty: number | null
  arrival: (number | null)[]
  usage: number[]
}
type Resp = { month: string; prev_month: string; months: string[]; rows: Row[] }

function addMonths(ym: string, n: number): string {
  const y = Number(ym.slice(0, 4))
  const m = Number(ym.slice(4, 6)) - 1 + n
  const yy = y + Math.floor(m / 12)
  const mm = ((m % 12) + 12) % 12 + 1
  return `${yy}${String(mm).padStart(2, "0")}`
}
function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`
}
const fmtYm = (ym: string) => `${ym.slice(0, 4)}年${Number(ym.slice(4, 6))}月`
const monthName = (ym: string) => `${Number(ym.slice(4, 6))}月`
const fmtNum = (n: number) => n.toLocaleString("ja-JP")

// 全角数字を半角にし、数字以外を除く（最大9桁）
function normalize(s: string): string {
  return s
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[^\d]/g, "")
    .slice(0, 9)
}
function parseQty(s: string): number | null {
  return s === "" ? null : Number(s)
}

function QtyInput({
  value,
  onChange,
  onCommit,
}: {
  value: string
  onChange: (v: string) => void
  onCommit: () => void
}) {
  const [focused, setFocused] = useState(false)
  const shown = !focused && value !== "" ? Number(value).toLocaleString("ja-JP") : value
  return (
    <input
      type="text"
      inputMode="numeric"
      value={shown}
      onFocus={() => setFocused(true)}
      onChange={(e) => onChange(normalize(e.target.value))}
      onBlur={() => { setFocused(false); onCommit() }}
      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur() }}
      className="h-8 w-full rounded border border-amber-200 bg-amber-50/40 px-2 text-right text-sm focus:border-blue-400 focus:bg-white focus:outline-none"
    />
  )
}

export default function TraySchedulePurchasePage() {
  const [month, setMonth] = useState(currentMonth())
  const [data, setData] = useState<Resp | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(0)
  const reqId = useRef(0)

  const load = useCallback(async (m: string) => {
    const id = ++reqId.current
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/tray/schedule-purchase?month=${m}`)
      const json = await res.json().catch(() => ({}))
      if (id !== reqId.current) return
      if (!res.ok) {
        setData(null)
        setError(json.error ?? "読み込みに失敗しました")
      } else {
        setData(json)
        setEdits({})
      }
    } catch {
      if (id === reqId.current) {
        setData(null)
        setError("読み込みに失敗しました")
      }
    }
    if (id === reqId.current) setLoading(false)
  }, [])

  useEffect(() => { load(month) }, [month, load])

  // 入力中の値があればそれを、なければ保存済みの値を返す
  const eff = (key: string, server: number | null): number | null => {
    const raw = edits[key]
    return raw === undefined ? server : parseQty(raw)
  }
  const cellValue = (key: string, server: number | null): string =>
    edits[key] ?? (server === null ? "" : String(server))

  const setEdit = (key: string, v: string) => setEdits((prev) => ({ ...prev, [key]: v }))
  const clearEdit = (key: string, raw: string) =>
    setEdits((prev) => {
      if (prev[key] !== raw) return prev
      const n = { ...prev }
      delete n[key]
      return n
    })

  const commit = async (key: string, row: Row, kind: "arrival" | "inhouse", idx: number) => {
    if (!data) return
    const raw = edits[key]
    if (raw === undefined) return
    const value = parseQty(raw)
    const current = kind === "inhouse" ? row.inhouse_qty : row.arrival[idx]
    if (value === current) {
      clearEdit(key, raw)
      return
    }
    const reqMonth = data.month
    const body =
      kind === "inhouse"
        ? { kind, tray_id: row.id, qty: value }
        : { kind, tray_id: row.id, month: data.months[idx], qty: value }
    setSaving((s) => s + 1)
    setError("")
    try {
      const res = await fetch("/api/tray/schedule-purchase", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        setError(e.error ?? "保存に失敗しました")
      } else {
        setData((prev) => {
          if (!prev || prev.month !== reqMonth) return prev
          return {
            ...prev,
            rows: prev.rows.map((r) => {
              if (r.id !== row.id) return r
              if (kind === "inhouse") return { ...r, inhouse_qty: value }
              const arrival = [...r.arrival]
              arrival[idx] = value
              return { ...r, arrival }
            }),
          }
        })
      }
    } catch {
      setError("保存に失敗しました")
    }
    clearEdit(key, raw)
    setSaving((s) => s - 1)
  }

  const prevLabel = data ? `${monthName(data.prev_month)}残数` : "前月残数"

  return (
    <div className="p-4 md:p-8">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold">トレイ管理予定表（購買）</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">期間：{fmtYm(month)}〜</span>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            aria-label="前の月"
            className="flex h-9 w-9 items-center justify-center rounded border bg-white hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="次の月"
            className="flex h-9 w-9 items-center justify-center rounded border bg-white hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {saving > 0 && <span className="text-xs text-gray-400">保存中...</span>}
        </div>
      </div>

      {data && (
        <p className="mb-3 text-xs text-gray-500">
          {monthName(data.prev_month)}残数は{fmtYm(data.prev_month)}分の棚卸し情報、使用予定は{fmtYm(data.prev_month)}提出分の明細から集計しています。社内在庫と入庫予定は、直接入力できます。
        </p>
      )}

      {error && (
        <p className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="py-8 text-center text-gray-400 animate-pulse">読み込み中...</p>
      ) : !data ? null : data.rows.length === 0 ? (
        <p className="py-8 text-center text-gray-500">トレイが登録されていません</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <table className="w-full min-w-[1300px] text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs text-gray-500">
                <th rowSpan={2} className="px-3 py-2 text-left font-medium">分類</th>
                <th rowSpan={2} className="px-3 py-2 text-left font-medium">品名</th>
                <th rowSpan={2} className="px-3 py-2 text-left font-medium">メーカー</th>
                <th rowSpan={2} className="px-3 py-2 text-right font-medium">{prevLabel}</th>
                <th rowSpan={2} className="px-3 py-2 text-right font-medium">社内在庫</th>
                <th rowSpan={2} className="px-3 py-2 text-right font-medium">適正在庫</th>
                {data.months.map((m) => (
                  <th key={m} colSpan={3} className="border-l px-3 py-2 text-center font-medium">{monthName(m)}</th>
                ))}
              </tr>
              <tr className="border-b bg-gray-50 text-xs text-gray-500">
                {data.months.map((m) => (
                  <FragmentHeads key={m} />
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => {
                const arr = [0, 1, 2].map((i) => eff(`a|${r.id}|${i}`, r.arrival[i]) ?? 0)
                const rem: (number | null)[] = [null, null, null]
                if (r.prev_qty !== null) {
                  let cur = r.prev_qty
                  for (let i = 0; i < 3; i++) {
                    cur = cur + arr[i] - r.usage[i]
                    rem[i] = cur
                  }
                }
                const sKey = `s|${r.id}`
                return (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-700">{r.type}</td>
                    <td className="px-3 py-2 font-medium text-gray-800">{r.name}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{r.maker}</td>
                    <td className="px-3 py-2 text-right text-gray-800">
                      {r.prev_qty === null ? <span className="text-gray-300">-</span> : fmtNum(r.prev_qty)}
                    </td>
                    <td className="w-28 px-1 py-1">
                      <QtyInput
                        value={cellValue(sKey, r.inhouse_qty)}
                        onChange={(v) => setEdit(sKey, v)}
                        onCommit={() => commit(sKey, r, "inhouse", 0)}
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-gray-800">
                      {r.optimal_stock === null ? <span className="text-gray-300">-</span> : fmtNum(r.optimal_stock)}
                    </td>
                    {[0, 1, 2].map((i) => {
                      const aKey = `a|${r.id}|${i}`
                      return (
                        <MonthCells
                          key={i}
                          input={
                            <QtyInput
                              value={cellValue(aKey, r.arrival[i])}
                              onChange={(v) => setEdit(aKey, v)}
                              onCommit={() => commit(aKey, r, "arrival", i)}
                            />
                          }
                          usage={r.usage[i]}
                          remaining={rem[i]}
                        />
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FragmentHeads() {
  return (
    <>
      <th className="border-l px-3 py-2 text-right font-medium">入庫予定</th>
      <th className="px-3 py-2 text-right font-medium">使用予定</th>
      <th className="px-3 py-2 text-right font-medium">見込み残</th>
    </>
  )
}

function MonthCells({
  input,
  usage,
  remaining,
}: {
  input: React.ReactNode
  usage: number
  remaining: number | null
}) {
  return (
    <>
      <td className="w-28 border-l px-1 py-1">{input}</td>
      <td className="px-3 py-2 text-right text-gray-800">
        {usage === 0 ? <span className="text-gray-300">-</span> : fmtNum(usage)}
      </td>
      <td className={`px-3 py-2 text-right ${remaining !== null && remaining < 0 ? "font-medium text-red-600" : "text-gray-800"}`}>
        {remaining === null ? <span className="text-gray-300">-</span> : fmtNum(remaining)}
      </td>
    </>
  )
}