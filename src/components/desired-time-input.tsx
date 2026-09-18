"use client"

export { DESIRED_TIME_KBN_OPTIONS, desiredTimeSortKey, parseDesiredTimeLabel, desiredTimeLabel } from "@/lib/desired-time"
import { DESIRED_TIME_KBN_OPTIONS } from "@/lib/desired-time"

export function DesiredTimeInput({
  kbn, time, onChange, className,
}: {
  kbn: number
  time: string
  onChange: (kbn: number, time: string) => void
  className?: string
}) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <select
        value={kbn}
        onChange={e => {
          const newKbn = Number(e.target.value)
          onChange(newKbn, newKbn === 1 ? time : "")
        }}
        className="h-8 border rounded px-2 text-sm bg-white"
      >
        {DESIRED_TIME_KBN_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <input
        type="time"
        value={time}
        onChange={e => onChange(1, e.target.value)}
        disabled={kbn !== 1}
        className="h-8 text-sm w-24 border rounded px-2 disabled:bg-gray-100 disabled:text-gray-400"
      />
    </div>
  )
}
