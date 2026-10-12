"use client"

import { useState } from "react"
import {
  dayNumberToDateKey,
  resolveDayHours,
  type DayOverrideLite,
  type WorkRuleLite,
} from "@/lib/cad/schedule"

type Machine = "main" | "sub"
type Mode = "rule" | "off" | "custom"
type Draft = { mode: Mode; start: string; end: string; break_start: string; break_end: string }

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

function initialDraft(machine: Machine, dayNumber: number, rules: WorkRuleLite[], overrides: DayOverrideLite[]): Draft {
  const dateKey = dayNumberToDateKey(dayNumber)
  const ov = overrides.find(o => o.machine === machine && o.date === dateKey)
  if (ov && ov.is_off === false && ov.start_min !== null && ov.end_min !== null) {
    return {
      mode: "custom",
      start: minToTime(ov.start_min),
      end: minToTime(ov.end_min),
      break_start: minToTime(ov.break_start),
      break_end: minToTime(ov.break_end),
    }
  }
  const h = resolveDayHours(machine, dayNumber, rules, [])
  return {
    mode: ov ? "off" : "rule",
    start: minToTime(h.start),
    end: minToTime(h.end),
    break_start: minToTime(h.breakStart),
    break_end: minToTime(h.breakEnd),
  }
}

export default function DayOverrideDialog({
  dayNumber,
  rules,
  overrides,
  onClose,
  onSaved,
}: {
  dayNumber: number
  rules: WorkRuleLite[]
  overrides: DayOverrideLite[]
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const dateKey = dayNumberToDateKey(dayNumber)
  const [, m, d] = dateKey.split("-")
  const dow = new Date(dayNumber * 24 * 60 * 60 * 1000).getUTCDay()

  const [drafts, setDrafts] = useState<Record<Machine, Draft>>({
    main: initialDraft("main", dayNumber, rules, overrides),
    sub: initialDraft("sub", dayNumber, rules, overrides),
  })
  const [busy, setBusy] = useState<Machine | null>(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const setDraft = (machine: Machine, patch: Partial<Draft>) =>
    setDrafts(prev => ({ ...prev, [machine]: { ...prev[machine], ...patch } }))

  const save = async (machine: Machine) => {
    const dr = drafts[machine]
    setError("")
    setMessage("")
    setBusy(machine)
    try {
      let res: Response
      if (dr.mode === "rule") {
        res = await fetch(`/api/cad/schedule/day-overrides?machine=${machine}&date=${dateKey}`, { method: "DELETE" })
      } else if (dr.mode === "off") {
        res = await fetch("/api/cad/schedule/day-overrides", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ machine, date: dateKey, is_off: true }),
        })
      } else {
        const start = timeToMin(dr.start)
        const end = timeToMin(dr.end)
        if (start === null || end === null) {
          setError("始業と終業を入力してください")
          return
        }
        const bs = dr.break_start === "" ? null : timeToMin(dr.break_start)
        const be = dr.break_end === "" ? null : timeToMin(dr.break_end)
        res = await fetch("/api/cad/schedule/day-overrides", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            machine,
            date: dateKey,
            is_off: false,
            start_min: start,
            end_min: end,
            break_start: bs,
            break_end: be,
          }),
        })
      }
      if (res.ok === false) {
        const data = await res.json()
        setError(data.error ?? "保存に失敗しました")
        return
      }
      await onSaved()
      setMessage(`${MACHINES.find(x => x.key === machine)?.label ?? ""} を保存しました`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-lg w-[560px] max-w-full max-h-full overflow-y-auto p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">
            {Number(m)}/{Number(d)}（{WEEKDAYS[dow]}）の稼働時間
          </h2>
          <button onClick={onClose} className="h-8 px-3 rounded border text-sm text-gray-600 hover:bg-gray-50">
            閉じる
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          この日だけ、稼働ルールとは別の稼働時間にできます。残業は、終業の時刻を延ばして設定します（終業は23:59まで）。
        </p>

        <div className="space-y-5">
          {MACHINES.map(mc => {
            const dr = drafts[mc.key]
            return (
              <div key={mc.key} className="border rounded-lg p-4">
                <div className="font-medium mb-2">
                  {mc.label}
                  <span className="ml-2 text-xs font-normal text-gray-400">{mc.sub}</span>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm mb-3">
                  <label className="flex items-center gap-1.5">
                    <input type="radio" name={`mode-${mc.key}`} checked={dr.mode === "rule"} onChange={() => setDraft(mc.key, { mode: "rule" })} />
                    稼働ルールどおり
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="radio" name={`mode-${mc.key}`} checked={dr.mode === "off"} onChange={() => setDraft(mc.key, { mode: "off" })} />
                    休み
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="radio" name={`mode-${mc.key}`} checked={dr.mode === "custom"} onChange={() => setDraft(mc.key, { mode: "custom" })} />
                    時間を変更
                  </label>
                </div>

                {dr.mode === "custom" && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
                    <label className="flex items-center gap-2">
                      始業
                      <input type="time" value={dr.start} onChange={e => setDraft(mc.key, { start: e.target.value })} className="h-8 border rounded px-2 text-sm" />
                    </label>
                    <label className="flex items-center gap-2">
                      終業
                      <input type="time" value={dr.end} onChange={e => setDraft(mc.key, { end: e.target.value })} className="h-8 border rounded px-2 text-sm" />
                    </label>
                    <label className="flex items-center gap-2">
                      休憩開始
                      <input type="time" value={dr.break_start} onChange={e => setDraft(mc.key, { break_start: e.target.value })} className="h-8 border rounded px-2 text-sm" />
                    </label>
                    <label className="flex items-center gap-2">
                      休憩終了
                      <input type="time" value={dr.break_end} onChange={e => setDraft(mc.key, { break_end: e.target.value })} className="h-8 border rounded px-2 text-sm" />
                    </label>
                  </div>
                )}

                <button
                  onClick={() => void save(mc.key)}
                  disabled={busy !== null}
                  className="h-8 px-4 rounded bg-lime-600 text-white text-sm hover:bg-lime-700 disabled:opacity-50"
                >
                  {busy === mc.key ? "保存中..." : "保存"}
                </button>
              </div>
            )
          })}
        </div>

        {error !== "" && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {message !== "" && <p className="mt-4 text-sm text-lime-700">{message}</p>}
      </div>
    </div>
  )
}