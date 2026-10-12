export const WORK_START_MIN = 9 * 60 + 30
export const WORK_END_MIN = 18 * 60
export const BREAK_START_MIN = 12 * 60
export const BREAK_END_MIN = 12 * 60 + 50

const DAY_MIN = 24 * 60
const DAY_MS = 24 * 60 * 60 * 1000

export function dateKeyToDayNumber(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS)
}

export function dayNumberToDateKey(dayNumber: number): string {
  return new Date(dayNumber * DAY_MS).toISOString().slice(0, 10)
}

export function isWorkingDay(dayNumber: number): boolean {
  const dow = new Date(dayNumber * DAY_MS).getUTCDay()
  return dow !== 0 && dow !== 6
}

export function deadlineMinutes(kbn: number, time: string | null): number | null {
  switch (kbn) {
    case 1: {
      if (!time) return null
      const m = /^(\d{1,2}):(\d{2})$/.exec(time)
      if (!m) return null
      return Number(m[1]) * 60 + Number(m[2])
    }
    case 2: return 12 * 60
    case 3: return 18 * 60
    case 4: return DAY_MIN
    default: return null
  }
}

export function toAbsoluteMinutes(dayNumber: number, minutesOfDay: number): number {
  return dayNumber * DAY_MIN + minutesOfDay
}

export function fromAbsoluteMinutes(abs: number): { dayNumber: number; minutesOfDay: number } {
  const dayNumber = Math.floor(abs / DAY_MIN)
  return { dayNumber, minutesOfDay: abs - dayNumber * DAY_MIN }
}

type Segment = { start: number; end: number }

function workSegmentsOfDay(dayNumber: number): Segment[] {
  if (isWorkingDay(dayNumber) === false) return []
  return [
    { start: toAbsoluteMinutes(dayNumber, WORK_START_MIN), end: toAbsoluteMinutes(dayNumber, BREAK_START_MIN) },
    { start: toAbsoluteMinutes(dayNumber, BREAK_END_MIN), end: toAbsoluteMinutes(dayNumber, WORK_END_MIN) },
  ]
}

export function subtractWorkMinutes(endAbs: number, workMinutes: number): number {
  let remaining = workMinutes
  let cursor = endAbs
  let dayNumber = fromAbsoluteMinutes(endAbs).dayNumber
  let guard = 0

  while (remaining > 0 && guard < 400) {
    guard += 1
    const segments = workSegmentsOfDay(dayNumber)
    for (let i = segments.length - 1; i >= 0 && remaining > 0; i--) {
      const seg = segments[i]
      const segEnd = Math.min(cursor, seg.end)
      if (segEnd <= seg.start) continue
      const available = segEnd - seg.start
      if (remaining <= available) {
        cursor = segEnd - remaining
        remaining = 0
      } else {
        remaining -= available
        cursor = seg.start
      }
    }
    if (remaining > 0) {
      dayNumber -= 1
      cursor = toAbsoluteMinutes(dayNumber, DAY_MIN)
    }
  }
  return cursor
}

export function snapBackToWork(abs: number): number {
  let dayNumber = fromAbsoluteMinutes(abs).dayNumber
  let cursor = abs
  let guard = 0
  while (guard < 400) {
    guard += 1
    const segments = workSegmentsOfDay(dayNumber)
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i]
      if (cursor > seg.start) return Math.min(cursor, seg.end)
    }
    dayNumber -= 1
    cursor = toAbsoluteMinutes(dayNumber, DAY_MIN)
  }
  return abs
}

export type WorkRuleLite = {
  machine: string
  valid_from: string
  valid_to: string | null
  start_min: number
  end_min: number
  break_start: number | null
  break_end: number | null
  working_days: string
}

export type DayOverrideLite = {
  machine: string
  date: string
  is_off: boolean
  start_min: number | null
  end_min: number | null
  break_start: number | null
  break_end: number | null
}

export type DayHours = {
  off: boolean
  start: number
  end: number
  breakStart: number | null
  breakEnd: number | null
}

export function resolveDayHours(
  machine: string,
  dayNumber: number,
  rules: WorkRuleLite[],
  overrides: DayOverrideLite[],
): DayHours {
  const dateKey = dayNumberToDateKey(dayNumber)
  const dow = new Date(dayNumber * DAY_MS).getUTCDay()

  const ov = overrides.find(o => o.machine === machine && o.date === dateKey)
  if (ov) {
    if (ov.is_off || ov.start_min === null || ov.end_min === null) {
      return { off: true, start: WORK_START_MIN, end: WORK_END_MIN, breakStart: null, breakEnd: null }
    }
    return { off: false, start: ov.start_min, end: ov.end_min, breakStart: ov.break_start, breakEnd: ov.break_end }
  }

  const matched = rules
    .filter(r => r.machine === machine && r.valid_from <= dateKey && (r.valid_to === null || dateKey <= r.valid_to))
    .sort((a, b) => (a.valid_from < b.valid_from ? 1 : a.valid_from > b.valid_from ? -1 : 0))[0]
  if (matched) {
    if (matched.working_days[dow] !== "1") {
      return { off: true, start: matched.start_min, end: matched.end_min, breakStart: matched.break_start, breakEnd: matched.break_end }
    }
    return { off: false, start: matched.start_min, end: matched.end_min, breakStart: matched.break_start, breakEnd: matched.break_end }
  }

  return {
    off: isWorkingDay(dayNumber) === false,
    start: WORK_START_MIN,
    end: WORK_END_MIN,
    breakStart: BREAK_START_MIN,
    breakEnd: BREAK_END_MIN,
  }
}

export type ScheduleSource = {
  id: string
  uid: string
  title: string | null
  client: string | null
  hinmoku: string | null
  status: string
  requestAt: number
  workMinutes: number | null
  desiredDateKey: string | null
  desiredTimeKbn: number
  desiredTime: string | null
}

export type ScheduleBlock = {
  id: string
  uid: string
  title: string | null
  client: string | null
  hinmoku: string | null
  status: string
  workMinutes: number
  startAbs: number
  endAbs: number
  machine: "main" | "sub"
  manual: boolean
}

export type UnscheduledItem = {
  id: string
  uid: string
  title: string | null
  client: string | null
  hinmoku: string | null
  status: string
  workMinutes: number | null
  reason: string
}

export function buildMainSchedule(items: ScheduleSource[]): { blocks: ScheduleBlock[]; unscheduled: UnscheduledItem[] } {
  const unscheduled: UnscheduledItem[] = []
  const targets: (ScheduleSource & { deadlineAbs: number; workMinutes: number })[] = []

  for (const it of items) {
    const base = { id: it.id, uid: it.uid, title: it.title, client: it.client, hinmoku: it.hinmoku, status: it.status, workMinutes: it.workMinutes }
    if (it.workMinutes === null) {
      unscheduled.push({ ...base, reason: "作業標準時間が未入力" })
      continue
    }
    if (it.desiredDateKey === null) {
      unscheduled.push({ ...base, reason: "希望納期日が未入力" })
      continue
    }
    const dl = deadlineMinutes(it.desiredTimeKbn, it.desiredTime)
    if (dl === null) {
      unscheduled.push({ ...base, reason: "納期の時刻が未指定" })
      continue
    }
    targets.push({
      ...it,
      workMinutes: it.workMinutes,
      deadlineAbs: toAbsoluteMinutes(dateKeyToDayNumber(it.desiredDateKey), dl),
    })
  }

  targets.sort((a, b) => b.deadlineAbs - a.deadlineAbs || b.requestAt - a.requestAt)

  const blocks: ScheduleBlock[] = []
  let limit = Number.POSITIVE_INFINITY
  for (const t of targets) {
    const endAbs = Math.min(t.deadlineAbs, limit)
    const startAbs = endAbs - t.workMinutes
    blocks.push({
      id: t.id, uid: t.uid, title: t.title, client: t.client, hinmoku: t.hinmoku, status: t.status,
      workMinutes: t.workMinutes, startAbs, endAbs,
      machine: "main", manual: false,
    })
    limit = startAbs
  }

  blocks.reverse()
  return { blocks, unscheduled }
}