"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type TripFormValues = {
  slipDate: string
  title: string
  accountName: string
  accountCode: string
  taxCategory: string
  departmentName: string
  areaPurpose: string
  tripDates: { label: string; date: string; time: string }[]
  transport: { section: string; amount: string }[]
  lodging: { name: string; nights: string; amount: string }[]
  allowance: { days: string; amount: string }[]
}

const TRIP_LABELS = ["現地到着時間", "現地出発時間"]

const today = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const emptyTripForm = (): TripFormValues => ({
  slipDate: today(),
  title: "",
  accountName: "旅費交通費",
  accountCode: "714",
  taxCategory: "4.課税",
  departmentName: "",
  areaPurpose: "",
  tripDates: TRIP_LABELS.map(label => ({ label, date: "", time: "" })),
  transport: Array.from({ length: 8 }, () => ({ section: "", amount: "" })),
  lodging: Array.from({ length: 3 }, () => ({ name: "", nights: "", amount: "" })),
  allowance: Array.from({ length: 2 }, () => ({ days: "", amount: "" })),
})

type SlipForForm = {
  title: string
  slip_date: string
  department_name: string | null
  trip_expense: {
    account_name: string
    account_code: string
    tax_category: string
    area_purpose: string | null
    trip_dates: { label: string; date: string; time: string }[] | null
    transport_items: { section: string; amount: number }[] | null
    lodging_items: { name: string; nights: number; amount: number }[] | null
    allowance_items: { days: number; amount: number }[] | null
  } | null
}

// 保存済みの伝票から、フォームの初期値を作る（行数は様式どおりに揃える）
export function tripFormFromSlip(slip: SlipForForm): TripFormValues {
  const t = slip.trip_expense
  const date = slip.slip_date.slice(0, 10)
  const autoTitle = `出張旅費精算書 ${date.replace(/-/g, "/")}`
  const dateRow = (label: string) => {
    const r = t?.trip_dates?.find(x => x.label === label)
    return { label, date: r?.date ?? "", time: r?.time ?? "" }
  }
  return {
    slipDate: date,
    title: slip.title === autoTitle ? "" : slip.title,
    accountName: t?.account_name ?? "旅費交通費",
    accountCode: t?.account_code ?? "714",
    taxCategory: t?.tax_category ?? "4.課税",
    departmentName: slip.department_name ?? "",
    areaPurpose: t?.area_purpose ?? "",
    tripDates: TRIP_LABELS.map(dateRow),
    transport: Array.from({ length: 8 }, (_, i) => {
      const r = t?.transport_items?.[i]
      return { section: r?.section ?? "", amount: r ? String(r.amount) : "" }
    }),
    lodging: Array.from({ length: 3 }, (_, i) => {
      const r = t?.lodging_items?.[i]
      return { name: r?.name ?? "", nights: r && r.nights ? String(r.nights) : "", amount: r ? String(r.amount) : "" }
    }),
    allowance: Array.from({ length: 2 }, (_, i) => {
      const r = t?.allowance_items?.[i]
      return { days: r && r.days ? String(r.days) : "", amount: r ? String(r.amount) : "" }
    }),
  }
}

// 保存・申請のAPIに送る内容
export function tripFormPayload(v: TripFormValues, submit: boolean) {
  return {
    submit,
    slip_date: v.slipDate,
    title: v.title,
    account_name: v.accountName,
    account_code: v.accountCode,
    tax_category: v.taxCategory,
    department_name: v.departmentName,
    area_purpose: v.areaPurpose,
    trip_dates: v.tripDates,
    transport_items: v.transport,
    lodging_items: v.lodging,
    allowance_items: v.allowance,
  }
}

const num = (s: string) => Number(s || 0)
const digits = (s: string) => s.replace(/\D/g, "").slice(0, 8)
const yen = (n: number) => `${n.toLocaleString()}円`
const setAt = <T,>(arr: T[], i: number, patch: Partial<T>): T[] => arr.map((x, j) => (j === i ? { ...x, ...patch } : x))

type Props = {
  initial: TripFormValues
  saving: boolean
  error: string
  saveLabel?: string
  submitLabel?: string
  onSave: (values: TripFormValues, submit: boolean) => void
  onCancel: () => void
}

export default function TripExpenseForm({ initial, saving, error, saveLabel = "下書き保存", submitLabel = "申請する", onSave, onCancel }: Props) {
  const [v, setV] = useState<TripFormValues>(initial)
  const set = (patch: Partial<TripFormValues>) => setV(prev => ({ ...prev, ...patch }))

  const transportSubtotal = v.transport.reduce((a, r) => a + num(r.amount), 0)
  const lodgingSubtotal = v.lodging.reduce((a, r) => a + num(r.amount), 0)
  const allowanceSubtotal = v.allowance.reduce((a, r) => a + num(r.amount), 0)
  const total = transportSubtotal + lodgingSubtotal + allowanceSubtotal

  const submit = () => {
    if (!confirm("この内容で申請しますか？")) return
    onSave(v, true)
  }

  const labelClass = "block text-xs text-gray-500 mb-1"
  const cardClass = "bg-white border rounded-lg p-4 mb-4 shadow-sm"
  const headClass = "text-sm font-bold text-gray-700 mb-3"

  return (
    <div>
      <div className={cardClass}>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={labelClass}>日付</label>
            <Input type="date" value={v.slipDate} onChange={e => set({ slipDate: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>タイトル（空欄なら自動で付きます）</label>
            <Input value={v.title} onChange={e => set({ title: e.target.value })} maxLength={100} autoComplete="off" />
          </div>
          <div>
            <label className={labelClass}>勘定科目</label>
            <Input value={v.accountName} onChange={e => set({ accountName: e.target.value })} maxLength={50} autoComplete="off" />
          </div>
          <div>
            <label className={labelClass}>勘定科目コード</label>
            <Input value={v.accountCode} onChange={e => set({ accountCode: e.target.value })} maxLength={20} autoComplete="off" />
          </div>
          <div>
            <label className={labelClass}>課税区分</label>
            <Input value={v.taxCategory} onChange={e => set({ taxCategory: e.target.value })} maxLength={50} autoComplete="off" />
          </div>
          <div className="sm:col-span-3">
            <label className={labelClass}>部署（空欄なら、部門コード・部署・グループから自動で入ります）</label>
            <Input value={v.departmentName} onChange={e => set({ departmentName: e.target.value })} maxLength={100} autoComplete="off" />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <p className={headClass}>出張期間</p>
        <div className="space-y-2">
          {v.tripDates.map((r, i) => (
            <div key={i} className="flex gap-2 items-center flex-wrap">
              <span className="text-sm text-gray-600 w-32">{r.label}</span>
              <Input type="date" className="w-44" value={r.date} onChange={e => set({ tripDates: setAt(v.tripDates, i, { date: e.target.value }) })} />
              <Input type="time" className="w-32" value={r.time} onChange={e => set({ tripDates: setAt(v.tripDates, i, { time: e.target.value }) })} />
            </div>
          ))}
        </div>
        <label className={labelClass + " mt-4"}>出張区域・用</label>
        <textarea className="w-full min-h-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          value={v.areaPurpose} onChange={e => set({ areaPurpose: e.target.value })} maxLength={1000} />
      </div>

      <div className={cardClass}>
        <p className={headClass}>交通費</p>
        <div className="space-y-2">
          {v.transport.map((r, i) => (
            <div key={i} className="flex gap-2">
              <Input className="flex-1" placeholder="区間（例：東京〜静岡）" value={r.section} maxLength={100} autoComplete="off"
                onChange={e => set({ transport: setAt(v.transport, i, { section: e.target.value }) })} />
              <Input className="w-36 text-right" inputMode="numeric" placeholder="金額" value={r.amount} autoComplete="off"
                onChange={e => set({ transport: setAt(v.transport, i, { amount: digits(e.target.value) }) })} />
            </div>
          ))}
        </div>
        <p className="text-right text-sm mt-3">小計　<span className="font-bold">{yen(transportSubtotal)}</span></p>
      </div>

      <div className={cardClass}>
        <p className={headClass}>宿泊費</p>
        <div className="space-y-2">
          {v.lodging.map((r, i) => (
            <div key={i} className="flex gap-2">
              <Input className="flex-1" placeholder="宿泊先" value={r.name} maxLength={100} autoComplete="off"
                onChange={e => set({ lodging: setAt(v.lodging, i, { name: e.target.value }) })} />
              <Input className="w-24 text-right" inputMode="numeric" placeholder="泊数" value={r.nights} autoComplete="off"
                onChange={e => set({ lodging: setAt(v.lodging, i, { nights: digits(e.target.value) }) })} />
              <Input className="w-36 text-right" inputMode="numeric" placeholder="金額" value={r.amount} autoComplete="off"
                onChange={e => set({ lodging: setAt(v.lodging, i, { amount: digits(e.target.value) }) })} />
            </div>
          ))}
        </div>
        <p className="text-right text-sm mt-3">小計　<span className="font-bold">{yen(lodgingSubtotal)}</span></p>
      </div>

      <div className={cardClass}>
        <p className={headClass}>日当</p>
        <div className="space-y-2">
          {v.allowance.map((r, i) => (
            <div key={i} className="flex gap-2">
              <Input className="w-24 text-right" inputMode="numeric" placeholder="日数" value={r.days} autoComplete="off"
                onChange={e => set({ allowance: setAt(v.allowance, i, { days: digits(e.target.value) }) })} />
              <Input className="w-36 text-right" inputMode="numeric" placeholder="金額" value={r.amount} autoComplete="off"
                onChange={e => set({ allowance: setAt(v.allowance, i, { amount: digits(e.target.value) }) })} />
            </div>
          ))}
        </div>
        <p className="text-right text-sm mt-3">小計　<span className="font-bold">{yen(allowanceSubtotal)}</span></p>
      </div>

      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 mb-4 flex items-center justify-between">
        <span className="font-bold text-gray-700">精算合計</span>
        <span className="text-xl font-bold">{yen(total)}</span>
      </div>

      {error && <p className="mb-4 text-sm px-4 py-2 rounded bg-red-50 text-red-600">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" disabled={saving} onClick={onCancel}>キャンセル</Button>
        <Button variant="outline" disabled={saving} onClick={() => onSave(v, false)}>{saveLabel}</Button>
        <Button disabled={saving} onClick={submit}>{submitLabel}</Button>
      </div>
    </div>
  )
}
