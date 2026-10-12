"use client"

import { useEffect, useState } from "react"

type Machine = "main" | "sub"

type Rule = {
  id: string
  machine: Machine
  valid_from: string
  valid_to: string | null
  start_min: number
  end_min: number
  break_start: number | null
  break_end: number | null
  working_days: string
}

type Draft = {
  valid_from: string
  valid_to: string
  start: string
  end: string
  break_start: string
  break_end: string
  days: string
}

const MACHINES: { key: Machine; label: string; sub: string }[] = [
  { key: "main", label: "Zund S3 M800", sub: "メイン" },
  { key: "sub", label: "Zund PN M800", sub: "サブ" },
]
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"]

function minToTime(m: number | null): string {
  if (m === null) return ""
  const hh = String(Math.floor(m / 60)).padStart(2, "0")
  const mm = String(m % 60).padStart(2, "0")
  return `${hh}:${mm}`
}

function timeToMin(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

function toDraft(r: Rule): Draft {
  return {
    valid_from: r.valid_from,
    valid_to: r.valid_to ?? "",
    start: minToTime(r.start_min),
    end: minToTime(r.end_min),
    break_start: minToTime(r.break_start),
    break_end: minToTime(r.break_end),
    days: r.working_days,
  }
}

function todayKey(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return jst.toISOString().slice(0, 10)
}

function sameDraft(a: Draft, b: Draft): boolean {
  return (
    a.valid_from === b.valid_from && a.valid_to === b.valid_to && a.start === b.start && a.end === b.end &&
    a.break_start === b.break_start && a.break_end === b.break_end && a.days === b.days
  )
}

export default function WorkRuleTab() {
  const [rules, setRules] = useState<Rule[]>([])
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [saved, setSaved] = useState<Record<string, Draft>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    try {
      const res = await fetch("/api/cad/masters/work-rules")
      if (res.ok === false) throw new Error("読み込みに失敗しました")
      const data = (await res.json()) as Rule[]
      const d: Record<string, Draft> = {}
      data.forEach(r => { d[r.id] = toDraft(r) })
      setRules(data)
      setDrafts(d)
      setSaved(d)
      setLoadError("")
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "読み込みに失敗しました")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const setField = (id: string, key: keyof Draft, value: string) => {
    setDrafts(prev => ({ ...prev, [id]: { ...prev[id], [key]: value } }))
  }

  const toggleDay = (id: string, idx: number) => {
    const cur = drafts[id]
    if (cur === undefined) return
    const chars = cur.days.split("")
    chars[idx] = chars[idx] === "1" ? "0" : "1"
    setField(id, "days", chars.join(""))
  }

  const toPayload = (machine: Machine, d: Draft) => {
    const start = timeToMin(d.start)
    const end = timeToMin(d.end)
    const bs = d.break_start === "" ? null : timeToMin(d.break_start)
    const be = d.break_end === "" ? null : timeToMin(d.break_end)
    return {
      machine,
      valid_from: d.valid_from,
      valid_to: d.valid_to === "" ? null : d.valid_to,
      start_min: start,
      end_min: end,
      break_start: bs,
      break_end: be,
      working_days: d.days,
    }
  }

  const save = async (rule: Rule) => {
    const d = drafts[rule.id]
    if (d === undefined) return
    setBusyId(rule.id)
    try {
      const res = await fetch("/api/cad/masters/work-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rule.id, ...toPayload(rule.machine, d) }),
      })
      if (res.ok === false) {
        const data = await res.json()
        alert(data.error ?? "保存に失敗しました")
        return
      }
      await load()
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (rule: Rule) => {
    if (confirm("この稼働ルールを削除しますか？") === false) return
    setBusyId(rule.id)
    try {
      const res = await fetch(`/api/cad/masters/work-rules?id=${encodeURIComponent(rule.id)}`, { method: "DELETE" })
      if (res.ok === false) {
        alert("削除に失敗しました")
        return
      }
      await load()
    } finally {
      setBusyId(null)
    }
  }

  const add = async (machine: Machine) => {
    setBusyId(`new-${machine}`)
    try {
      const res = await fetch("/api/cad/masters/work-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machine,
          valid_from: todayKey(),
          valid_to: null,
          start_min: 9 * 60 + 30,
          end_min: 18 * 60,
          break_start: 12 * 60,
          break_end: 12 * 60 + 50,
          working_days: "0111110",
        }),
      })
      if (res.ok === false) {
        const data = await res.json()
        alert(data.error ?? "追加に失敗しました")
        return
      }
      await load()
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <p className="text-sm text-gray-400">読み込み中...</p>
  if (loadError !== "") return <p className="text-sm text-red-600">{loadError}</p>

  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-500">
        機械ごと・期間ごとの稼働時間を登録します。CAD作業予定の灰色（稼働時間外）の表示に使います。複数のルールが同じ日に当てはまるときは、適用開始日が新しいものを優先します。登録がないときは、標準値（9:30〜18:00、休憩12:00〜12:50、月〜金）を使います。
      </p>

      {MACHINES.map(m => {
        const list = rules.filter(r => r.machine === m.key)
        return (
          <div key={m.key}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold">
                {m.label}
                <span className="ml-2 text-xs font-normal text-gray-400">{m.sub}</span>
              </h2>
              <button
                onClick={() => void add(m.key)}
                disabled={busyId === `new-${m.key}`}
                className="h-8 px-3 rounded bg-lime-600 text-white text-sm hover:bg-lime-700 disabled:opacity-50"
              >
                ルールを追加
              </button>
            </div>
            {list.length === 0 ? (
              <p className="text-sm text-gray-400">登録されていません（標準値を使います）。</p>
            ) : (
              <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-600">
                      <th className="text-left px-3 py-2 font-medium whitespace-nowrap">適用開始日</th>
                      <th className="text-left px-3 py-2 font-medium whitespace-nowrap">適用終了日</th>
                      <th className="text-left px-3 py-2 font-medium">始業</th>
                      <th className="text-left px-3 py-2 font-medium">終業</th>
                      <th className="text-left px-3 py-2 font-medium whitespace-nowrap">休憩開始</th>
                      <th className="text-left px-3 py-2 font-medium whitespace-nowrap">休憩終了</th>
                      <th className="text-left px-3 py-2 font-medium">稼働する曜日</th>
                      <th className="px-3 py-2 w-32" />
                    </tr>
                  </thead>
                  <tbody>
                    {list.map(r => {
                      const d = drafts[r.id]
                      const s = saved[r.id]
                      if (d === undefined || s === undefined) return null
                      const changed = sameDraft(d, s) === false
                      return (
                        <tr key={r.id} className="border-b last:border-b-0">
                          <td className="px-3 py-2">
                            <input type="date" value={d.valid_from} onChange={e => setField(r.id, "valid_from", e.target.value)} className="h-8 border rounded px-2 text-sm" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="date" value={d.valid_to} onChange={e => setField(r.id, "valid_to", e.target.value)} className="h-8 border rounded px-2 text-sm" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="time" value={d.start} onChange={e => setField(r.id, "start", e.target.value)} className="h-8 border rounded px-2 text-sm" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="time" value={d.end} onChange={e => setField(r.id, "end", e.target.value)} className="h-8 border rounded px-2 text-sm" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="time" value={d.break_start} onChange={e => setField(r.id, "break_start", e.target.value)} className="h-8 border rounded px-2 text-sm" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="time" value={d.break_end} onChange={e => setField(r.id, "break_end", e.target.value)} className="h-8 border rounded px-2 text-sm" />
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              {WEEKDAYS.map((w, i) => (
                                <label key={w} className="flex items-center gap-0.5 text-xs">
                                  <input type="checkbox" checked={d.days[i] === "1"} onChange={() => toggleDay(r.id, i)} />
                                  {w}
                                </label>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right whitespace-nowrap">
                            {changed && (
                              <button
                                onClick={() => void save(r)}
                                disabled={busyId === r.id}
                                className="h-8 px-3 mr-2 rounded bg-lime-600 text-white text-sm hover:bg-lime-700 disabled:opacity-50"
                              >
                                保存
                              </button>
                            )}
                            <button
                              onClick={() => void remove(r)}
                              disabled={busyId === r.id}
                              className="h-8 px-3 rounded border text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}