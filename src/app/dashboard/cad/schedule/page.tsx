"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  BREAK_END_MIN,
  BREAK_START_MIN,
  WORK_END_MIN,
  WORK_START_MIN,
  dayNumberToDateKey,
  fromAbsoluteMinutes,
  isWorkingDay,
  type ScheduleBlock,
  type UnscheduledItem,
} from "@/lib/cad/schedule"

const WIN_START = 8 * 60
const WIN_END = 24 * 60
const PX_PER_MIN = 0.6
const DAY_W = (WIN_END - WIN_START) * PX_PER_MIN
const LABEL_W = 160
const ROW_H = 64
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"]
const HOUR_LABELS = [9, 12, 15, 18, 21]

const BLOCK_STYLE: Record<string, string> = {
  "依頼済": "bg-blue-200 border-blue-400 text-blue-900",
  "着手": "bg-yellow-200 border-yellow-400 text-yellow-900",
  "保留": "bg-red-200 border-red-400 text-red-900",
}

function todayDayNumber(): number {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return Math.floor(Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate()) / (24 * 60 * 60 * 1000))
}

function fmtAbs(abs: number): string {
  const { dayNumber, minutesOfDay } = fromAbsoluteMinutes(abs)
  const [, m, d] = dayNumberToDateKey(dayNumber).split("-")
  const hh = String(Math.floor(minutesOfDay / 60)).padStart(2, "0")
  const mm = String(minutesOfDay % 60).padStart(2, "0")
  return `${Number(m)}/${Number(d)} ${hh}:${mm}`
}

export default function CadSchedulePage() {
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([])
  const [unscheduled, setUnscheduled] = useState<UnscheduledItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/cad/schedule")
      .then(async res => {
        if (res.ok === false) throw new Error("読み込みに失敗しました")
        return res.json() as Promise<{ blocks: ScheduleBlock[]; unscheduled: UnscheduledItem[] }>
      })
      .then(d => {
        setBlocks(d.blocks)
        setUnscheduled(d.unscheduled)
      })
      .catch(e => setError(e instanceof Error ? e.message : "読み込みに失敗しました"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8"><p className="text-sm text-gray-400">読み込み中...</p></div>
  if (error !== "") return <div className="p-8"><p className="text-sm text-red-600">{error}</p></div>

  const today = todayDayNumber()
  let firstDay = today
  let lastDay = today + 6
  for (const b of blocks) {
    firstDay = Math.min(firstDay, fromAbsoluteMinutes(b.startAbs).dayNumber)
    lastDay = Math.max(lastDay, fromAbsoluteMinutes(b.endAbs).dayNumber)
  }
  if (lastDay - firstDay > 60) lastDay = firstDay + 60
  const days: number[] = []
  for (let d = firstDay; d <= lastDay; d++) days.push(d)
  const totalW = days.length * DAY_W

  const xOf = (abs: number): number => {
    const { dayNumber, minutesOfDay } = fromAbsoluteMinutes(abs)
    const clamped = Math.min(Math.max(minutesOfDay - WIN_START, 0), WIN_END - WIN_START)
    return (dayNumber - firstDay) * DAY_W + clamped * PX_PER_MIN
  }
  const mx = (minutesOfDay: number): number => (minutesOfDay - WIN_START) * PX_PER_MIN

  const renderBackground = () => (
    <>
      {days.map((d, i) => {
        const left = i * DAY_W
        if (isWorkingDay(d) === false) {
          return <div key={d} className="absolute top-0 bottom-0 bg-gray-200" style={{ left, width: DAY_W }} />
        }
        return (
          <div key={d} className="absolute top-0 bottom-0" style={{ left, width: DAY_W }}>
            <div className="absolute top-0 bottom-0 bg-gray-100" style={{ left: 0, width: mx(WORK_START_MIN) }} />
            <div className="absolute top-0 bottom-0 bg-gray-100" style={{ left: mx(BREAK_START_MIN), width: (BREAK_END_MIN - BREAK_START_MIN) * PX_PER_MIN }} />
            <div className="absolute top-0 bottom-0 bg-gray-100" style={{ left: mx(WORK_END_MIN), width: DAY_W - mx(WORK_END_MIN) }} />
          </div>
        )
      })}
      {days.map((d, i) => (
        <div key={`line-${d}`} className="absolute top-0 bottom-0 border-l border-gray-300" style={{ left: i * DAY_W }} />
      ))}
    </>
  )

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">CAD作業予定</h1>
      <p className="text-sm text-gray-500 mb-4">
        作業標準時間をブロックの幅として、希望納期から後ろへ積んでいます（現在は表示のみ）。灰色は稼働時間外です。
      </p>

      <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
        <div style={{ width: LABEL_W + totalW }}>
          <div className="flex border-b bg-gray-50">
            <div className="shrink-0 px-3 py-2 text-xs font-medium text-gray-600" style={{ width: LABEL_W }}>機械</div>
            <div className="relative" style={{ width: totalW, height: 44 }}>
              {days.map((d, i) => {
                const dow = new Date(d * 24 * 60 * 60 * 1000).getUTCDay()
                const [, m, dd] = dayNumberToDateKey(d).split("-")
                return (
                  <div key={d} className="absolute top-0 bottom-0 border-l border-gray-300" style={{ left: i * DAY_W, width: DAY_W }}>
                    <div className={`px-2 text-xs font-medium ${d === today ? "text-lime-700" : "text-gray-600"}`}>
                      {Number(m)}/{Number(dd)}（{WEEKDAYS[dow]}）{d === today ? " 今日" : ""}
                    </div>
                    {HOUR_LABELS.map(h => (
                      <span key={h} className="absolute text-[10px] text-gray-400" style={{ left: mx(h * 60), top: 24 }}>{h}:00</span>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex border-b">
            <div className="shrink-0 px-3 py-2 text-sm font-medium" style={{ width: LABEL_W }}>
              Zund S3 M800
              <div className="text-xs font-normal text-gray-400">メイン</div>
            </div>
            <div className="relative" style={{ width: totalW, height: ROW_H }}>
              {renderBackground()}
              {blocks.map(b => {
                const left = xOf(b.startAbs)
                const width = Math.max(xOf(b.endAbs) - left, 4)
                return (
                  <Link
                    key={b.id}
                    href={`/dashboard/cad/requests/${b.id}`}
                    title={`No.${b.uid}\n${b.client ?? ""} ${b.title ?? ""}\n品目：${b.hinmoku ?? "—"}\n作業時間：${b.workMinutes}分\n${fmtAbs(b.startAbs)} 〜 ${fmtAbs(b.endAbs)}`}
                    className={`absolute top-2 bottom-2 border rounded px-1 text-[11px] leading-tight overflow-hidden whitespace-nowrap hover:brightness-95 ${BLOCK_STYLE[b.status] ?? "bg-gray-200 border-gray-400"}`}
                    style={{ left, width }}
                  >
                    <div className="font-medium">{b.uid}</div>
                    <div>{b.title ?? ""}</div>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex">
            <div className="shrink-0 px-3 py-2 text-sm font-medium" style={{ width: LABEL_W }}>
              Zund PN M800
              <div className="text-xs font-normal text-gray-400">サブ</div>
            </div>
            <div className="relative" style={{ width: totalW, height: ROW_H }}>
              {renderBackground()}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-bold mb-2">未設定（{unscheduled.length}件）</h2>
        {unscheduled.length === 0 ? (
          <p className="text-sm text-gray-400">未設定の依頼書はありません。</p>
        ) : (
          <div className="bg-white border rounded-lg shadow-sm divide-y">
            {unscheduled.map(u => (
              <div key={u.id} className="px-4 py-2 text-sm flex flex-wrap items-center gap-x-4 gap-y-1">
                <Link href={`/dashboard/cad/requests/${u.id}`} className="text-blue-600 hover:underline font-medium">{u.uid}</Link>
                <span className="text-gray-500">{u.status}</span>
                <span>{u.client ?? ""}</span>
                <span>{u.title ?? ""}</span>
                <span className="text-gray-400">{u.hinmoku ?? ""}</span>
                <span className="text-amber-700">※ {u.reason}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}