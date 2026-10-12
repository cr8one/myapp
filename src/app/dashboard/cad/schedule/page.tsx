"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import DayOverrideDialog from "./DayOverrideDialog"
import {
  dayNumberToDateKey,
  fromAbsoluteMinutes,
  resolveDayHours,
  type DayOverrideLite,
  type ScheduleBlock,
  type UnscheduledItem,
  type WorkRuleLite,
} from "@/lib/cad/schedule"

const WIN_START = 8 * 60
const WIN_END = 24 * 60
const LABEL_W = 160
const ROW_H = 64
const SNAP_MIN = 5
const DEFAULT_DAYS = 14
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"]
const HOUR_LABELS = [9, 12, 15, 18, 21]
const SCALES = [
  { label: "小", pxPerMin: 0.6 },
  { label: "中", pxPerMin: 1.2 },
  { label: "大", pxPerMin: 2.4 },
]
const MACHINE_LABEL = { main: "Zund S3 M800", sub: "Zund PN M800" }

const BLOCK_STYLE: Record<string, string> = {
  "依頼済": "bg-blue-200 border-blue-400 text-blue-900",
  "着手": "bg-yellow-200 border-yellow-400 text-yellow-900",
  "保留": "bg-red-200 border-red-400 text-red-900",
}

type Machine = "main" | "sub"
type DragTarget = { machine: Machine; startAbs: number }
type DragItem = { id: string; uid: string; workMinutes: number; grabOffset: number; isBlock: boolean }
type DragView = { item: DragItem; clientX: number; clientY: number; moved: boolean; target: DragTarget | null }

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
  const router = useRouter()
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([])
  const [unscheduled, setUnscheduled] = useState<UnscheduledItem[]>([])
  const [rules, setRules] = useState<WorkRuleLite[]>([])
  const [overrides, setOverrides] = useState<DayOverrideLite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [scaleIndex, setScaleIndex] = useState(1)
  const [drag, setDrag] = useState<DragView | null>(null)
  const [saving, setSaving] = useState(false)
  const [dialogDay, setDialogDay] = useState<number | null>(null)
  const mainRowRef = useRef<HTMLDivElement>(null)
  const subRowRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const [sRes, rRes, oRes] = await Promise.all([
        fetch("/api/cad/schedule"),
        fetch("/api/cad/masters/work-rules"),
        fetch("/api/cad/schedule/day-overrides"),
      ])
      if (sRes.ok === false) throw new Error("読み込みに失敗しました")
      const d = (await sRes.json()) as { blocks: ScheduleBlock[]; unscheduled: UnscheduledItem[] }
      setBlocks(d.blocks)
      setUnscheduled(d.unscheduled)
      setRules(rRes.ok ? ((await rRes.json()) as WorkRuleLite[]) : [])
      setOverrides(oRes.ok ? ((await oRes.json()) as DayOverrideLite[]) : [])
      setError("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込みに失敗しました")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) return <div className="p-8"><p className="text-sm text-gray-400">読み込み中...</p></div>
  if (error !== "") return <div className="p-8"><p className="text-sm text-red-600">{error}</p></div>

  const PX_PER_MIN = SCALES[scaleIndex].pxPerMin
  const DAY_W = (WIN_END - WIN_START) * PX_PER_MIN

  const today = todayDayNumber()
  let firstDay = today
  let lastDay = today + DEFAULT_DAYS - 1
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

  const computeTarget = (clientX: number, clientY: number, grabOffset: number): DragTarget | null => {
    const rows: { machine: Machine; el: HTMLDivElement | null }[] = [
      { machine: "main", el: mainRowRef.current },
      { machine: "sub", el: subRowRef.current },
    ]
    for (const r of rows) {
      if (r.el === null) continue
      const rect = r.el.getBoundingClientRect()
      if (clientY < rect.top || clientY > rect.bottom) continue
      const x = Math.min(Math.max(clientX - grabOffset - rect.left, 0), totalW - 1)
      const dayIdx = Math.floor(x / DAY_W)
      const within = x - dayIdx * DAY_W
      const minutesOfDay = Math.round((WIN_START + within / PX_PER_MIN) / SNAP_MIN) * SNAP_MIN
      return { machine: r.machine, startAbs: (firstDay + dayIdx) * 24 * 60 + minutesOfDay }
    }
    return null
  }

  const saveDrop = async (requestId: string, t: DragTarget) => {
    setSaving(true)
    try {
      const res = await fetch("/api/cad/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId, machine: t.machine, start_abs: t.startAbs }),
      })
      if (res.ok === false) {
        const data = await res.json()
        alert(data.error ?? "配置の保存に失敗しました")
        return
      }
      await load()
    } finally {
      setSaving(false)
    }
  }

  const resetPlacement = async (requestId: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/cad/schedule?request_id=${encodeURIComponent(requestId)}`, { method: "DELETE" })
      if (res.ok === false) {
        alert("自動配置に戻せませんでした")
        return
      }
      await load()
    } finally {
      setSaving(false)
    }
  }

  const startDrag = (e: React.PointerEvent<HTMLElement>, item: DragItem) => {
    if (e.button !== 0) return
    const sx = e.clientX
    const sy = e.clientY
    let moved = false
    let target: DragTarget | null = null

    const cleanup = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onCancel)
      document.body.style.userSelect = ""
      setDrag(null)
    }
    const onMove = (ev: PointerEvent) => {
      if (moved === false && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 4) return
      moved = true
      target = computeTarget(ev.clientX, ev.clientY, item.grabOffset)
      setDrag({ item, clientX: ev.clientX, clientY: ev.clientY, moved: true, target })
    }
    const onUp = () => {
      const t = target
      const wasMoved = moved
      cleanup()
      if (wasMoved) {
        if (t !== null) void saveDrop(item.id, t)
      } else if (item.isBlock) {
        router.push(`/dashboard/cad/requests/${item.id}`)
      }
    }
    const onCancel = () => cleanup()

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onCancel)
    document.body.style.userSelect = "none"
  }

  const renderBackground = (machine: Machine) => (
    <>
      {days.map((d, i) => {
        const left = i * DAY_W
        const h = resolveDayHours(machine, d, rules, overrides)
        if (h.off) {
          return <div key={d} className="absolute top-0 bottom-0 bg-gray-200" style={{ left, width: DAY_W }} />
        }
        return (
          <div key={d} className="absolute top-0 bottom-0" style={{ left, width: DAY_W }}>
            <div className="absolute top-0 bottom-0 bg-gray-100" style={{ left: 0, width: Math.max(mx(h.start), 0) }} />
            {h.breakStart !== null && h.breakEnd !== null && (
              <div className="absolute top-0 bottom-0 bg-gray-100" style={{ left: mx(h.breakStart), width: (h.breakEnd - h.breakStart) * PX_PER_MIN }} />
            )}
            <div className="absolute top-0 bottom-0 bg-gray-100" style={{ left: mx(h.end), width: Math.max(DAY_W - mx(h.end), 0) }} />
          </div>
        )
      })}
      {days.map((d, i) => (
        <div key={`line-${d}`} className="absolute top-0 bottom-0 border-l border-gray-300" style={{ left: i * DAY_W }} />
      ))}
    </>
  )

  const renderBlock = (b: ScheduleBlock) => {
    const left = xOf(b.startAbs)
    const width = Math.max(xOf(b.endAbs) - left, 4)
    const dragging = drag !== null && drag.moved && drag.item.id === b.id
    return (
      <div
        key={b.id}
        onPointerDown={e =>
          startDrag(e, {
            id: b.id,
            uid: b.uid,
            workMinutes: b.workMinutes,
            grabOffset: e.clientX - e.currentTarget.getBoundingClientRect().left,
            isBlock: true,
          })
        }
        title={`No.${b.uid}${b.manual ? "（手で配置）" : ""}\n${b.client ?? ""} ${b.title ?? ""}\n品目：${b.hinmoku ?? "—"}\n作業時間：${b.workMinutes}分\n${fmtAbs(b.startAbs)} 〜 ${fmtAbs(b.endAbs)}`}
        className={`absolute top-2 bottom-2 border rounded px-1 text-[11px] leading-tight overflow-hidden whitespace-nowrap select-none cursor-grab hover:brightness-95 ${BLOCK_STYLE[b.status] ?? "bg-gray-200 border-gray-400"} ${b.manual ? "ring-2 ring-gray-700" : ""} ${dragging ? "opacity-40" : ""}`}
        style={{ left, width, touchAction: "none" }}
      >
        <div className="font-medium">{b.uid}</div>
        <div>{b.title ?? ""}</div>
      </div>
    )
  }

  const renderRow = (machine: Machine, rowRef: React.Ref<HTMLDivElement>) => (
    <div className="relative" ref={rowRef} style={{ width: totalW, height: ROW_H }}>
      {renderBackground(machine)}
      {blocks.filter(b => b.machine === machine).map(renderBlock)}
      {drag !== null && drag.moved && drag.target !== null && drag.target.machine === machine && (
        <div
          className="absolute top-2 bottom-2 border-2 border-dashed border-lime-600 bg-lime-100/60 rounded text-[11px] text-lime-800 px-1 pointer-events-none whitespace-nowrap overflow-hidden"
          style={{ left: xOf(drag.target.startAbs), width: Math.max(drag.item.workMinutes * PX_PER_MIN, 4) }}
        >
          {fmtAbs(drag.target.startAbs)}
        </div>
      )}
    </div>
  )

  const manualBlocks = blocks.filter(b => b.manual).sort((a, b) => a.startAbs - b.startAbs)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">CAD作業予定</h1>
      <p className="text-sm text-gray-500 mb-4">
        希望納期から後ろへ積んだ仮置きです。ブロックをドラッグして、メイン機・サブ機の好きな時刻へ動かせます。手で置いたブロック（太い枠）は固定され、自動配置では動きません。灰色は稼働時間外の目安で、CAD/台紙マスタの「稼働時間」で設定できます。
      </p>

      <div className="flex items-center gap-2 mb-3 text-sm">
        <span className="text-gray-500">表示の大きさ</span>
        {SCALES.map((s, i) => (
          <button
            key={s.label}
            onClick={() => setScaleIndex(i)}
            className={`h-8 px-3 rounded border text-sm ${i === scaleIndex ? "bg-lime-600 border-lime-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
          >
            {s.label}
          </button>
        ))}
        {saving && <span className="ml-3 text-gray-400">保存中...</span>}
      </div>

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
                    <button
                      onClick={() => setDialogDay(d)}
                      title="この日の稼働時間を変更"
                      className={`px-2 text-xs font-medium hover:underline ${d === today ? "text-lime-700" : "text-gray-600"}`}
                    >
                      {Number(m)}/{Number(dd)}（{WEEKDAYS[dow]}）{d === today ? " 今日" : ""}
                    </button>
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
              {MACHINE_LABEL.main}
              <div className="text-xs font-normal text-gray-400">メイン</div>
            </div>
            {renderRow("main", mainRowRef)}
          </div>

          <div className="flex">
            <div className="shrink-0 px-3 py-2 text-sm font-medium" style={{ width: LABEL_W }}>
              {MACHINE_LABEL.sub}
              <div className="text-xs font-normal text-gray-400">サブ</div>
            </div>
            {renderRow("sub", subRowRef)}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-bold mb-2">手で置いた予定（{manualBlocks.length}件）</h2>
        {manualBlocks.length === 0 ? (
          <p className="text-sm text-gray-400">手で置いた予定はありません。</p>
        ) : (
          <div className="bg-white border rounded-lg shadow-sm divide-y">
            {manualBlocks.map(b => (
              <div key={b.id} className="px-4 py-2 text-sm flex flex-wrap items-center gap-x-4 gap-y-1">
                <Link href={`/dashboard/cad/requests/${b.id}`} className="text-blue-600 hover:underline font-medium">{b.uid}</Link>
                <span>{b.client ?? ""}</span>
                <span>{b.title ?? ""}</span>
                <span className="text-gray-500">{MACHINE_LABEL[b.machine]}</span>
                <span className="text-gray-500">{fmtAbs(b.startAbs)} 〜 {fmtAbs(b.endAbs)}（{b.workMinutes}分）</span>
                <button
                  onClick={() => void resetPlacement(b.id)}
                  disabled={saving}
                  className="ml-auto h-7 px-3 rounded border text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  自動に戻す
                </button>
              </div>
            ))}
          </div>
        )}
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
                {u.workMinutes !== null ? (
                  <span
                    onPointerDown={e =>
                      startDrag(e, { id: u.id, uid: u.uid, workMinutes: u.workMinutes ?? 0, grabOffset: 0, isBlock: false })
                    }
                    className="ml-auto h-7 px-3 inline-flex items-center rounded border border-lime-600 text-xs text-lime-700 cursor-grab select-none"
                    style={{ touchAction: "none" }}
                  >
                    ドラッグで配置（{u.workMinutes}分）
                  </span>
                ) : (
                  <span className="ml-auto text-xs text-gray-400">作業標準時間を入力すると置けます</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {dialogDay !== null && (
        <DayOverrideDialog
          dayNumber={dialogDay}
          rules={rules}
          overrides={overrides}
          onClose={() => setDialogDay(null)}
          onSaved={load}
        />
      )}

      {drag !== null && drag.moved && (
        <div
          className="fixed z-50 pointer-events-none border rounded bg-lime-200 border-lime-500 text-[11px] px-1 leading-7 whitespace-nowrap overflow-hidden opacity-80"
          style={{
            left: drag.clientX - drag.item.grabOffset,
            top: drag.clientY - 14,
            width: Math.max(drag.item.workMinutes * PX_PER_MIN, 24),
            height: 28,
          }}
        >
          {drag.item.uid}
        </div>
      )}
    </div>
  )
}