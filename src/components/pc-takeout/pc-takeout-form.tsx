"use client"
import { useState, useEffect, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SendMailDialog from "@/components/accounting/send-mail-dialog"
import { PC_ACCESSORIES, PC_SOFTWARE, PC_MAX_PERIOD_DAYS } from "@/lib/pc-takeout"

// PC持ち出し申請の入力フォーム（新規作成と編集で共有する）。
// 新規作成のときは、本人のメイン機が自動で入る（initialDevice が空のときだけ）。複数台を登録している人は、選び直せる
export type PcTakeoutFormValues = {
  request_date: string
  department_name: string
  reason: string
  period_start: string
  period_end: string
  device_id: string
  device_name: string
  model_label: string
  accessories: string[]
  software: string[]
}

type TakeoutDevice = { device_id: number; device_name: string; model_label: string; is_main: boolean }
type Me = { name: string; department_name: string; devices: TakeoutDevice[]; main_device: TakeoutDevice | null }

const today = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const emptyPcTakeoutForm = (): PcTakeoutFormValues => ({
  request_date: today(),
  department_name: "",
  reason: "",
  period_start: "",
  period_end: "",
  device_id: "",
  device_name: "",
  model_label: "",
  accessories: [],
  software: [],
})

// 保存済みの申請から、フォームの初期値を作る
export function pcTakeoutFormFromRequest(r: {
  request_date: string
  department_name: string | null
  reason: string
  period_start: string | null
  period_end: string | null
  device_id: number | null
  device_name: string | null
  model_label: string | null
  accessories: unknown
  software: unknown
}): PcTakeoutFormValues {
  const list = (v: unknown) => (Array.isArray(v) ? v.map(String) : [])
  return {
    request_date: r.request_date.slice(0, 10),
    department_name: r.department_name ?? "",
    reason: r.reason ?? "",
    period_start: r.period_start ? r.period_start.slice(0, 10) : "",
    period_end: r.period_end ? r.period_end.slice(0, 10) : "",
    device_id: r.device_id != null ? String(r.device_id) : "",
    device_name: r.device_name ?? "",
    model_label: r.model_label ?? "",
    accessories: list(r.accessories),
    software: list(r.software),
  }
}

export function pcTakeoutPayload(v: PcTakeoutFormValues, submit: boolean) {
  return { ...v, device_id: v.device_id === "" ? null : Number(v.device_id), submit }
}

const periodDays = (s: string, e: string) => {
  if (!s || !e) return null
  const n = Math.round((Date.parse(`${e}T00:00:00Z`) - Date.parse(`${s}T00:00:00Z`)) / 86400000) + 1
  return isNaN(n) ? null : n
}

type Props = {
  initial: PcTakeoutFormValues
  isNew: boolean // 新規作成のときだけ、本人のメイン機・所属部署を自動で入れる
  saving: boolean
  error: string
  onSave: (values: PcTakeoutFormValues, submit: boolean, sendMail: boolean) => void
  onCancel: () => void
}

const cardClass = "bg-white border rounded-lg p-5 shadow-sm"
const headClass = "text-sm font-semibold text-gray-700 mb-3"
const labelClass = "block text-xs text-gray-500 mb-1"

export default function PcTakeoutForm({ initial, isNew, saving, error, onSave, onCancel }: Props) {
  const [v, setV] = useState<PcTakeoutFormValues>(initial)
  const [me, setMe] = useState<Me | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const set = (p: Partial<PcTakeoutFormValues>) => setV(prev => ({ ...prev, ...p }))

  useEffect(() => {
    let alive = true
    fetch("/api/eapp/pc-takeout/me")
      .then(r => (r.ok ? r.json() : null))
      .then((data: Me | null) => {
        if (!alive || !data) return
        setMe(data)
        if (!isNew) return
        // 新規作成のときだけ：所属部署と、メイン機を自動で入れる（すでに入力済みの項目は、上書きしない）
        setV(prev => ({
          ...prev,
          department_name: prev.department_name || data.department_name,
          ...(prev.device_name === "" && data.main_device
            ? { device_id: String(data.main_device.device_id), device_name: data.main_device.device_name, model_label: data.main_device.model_label }
            : {}),
        }))
      })
      .catch(() => {})
    return () => { alive = false }
  }, [isNew])

  const toggle = (key: "accessories" | "software", name: string) =>
    set({ [key]: v[key].includes(name) ? v[key].filter(x => x !== name) : [...v[key], name] } as Partial<PcTakeoutFormValues>)

  const pickDevice = (idText: string) => {
    const d = me?.devices.find(x => String(x.device_id) === idText)
    if (d) set({ device_id: String(d.device_id), device_name: d.device_name, model_label: d.model_label })
    else set({ device_id: "" })
  }

  const days = periodDays(v.period_start, v.period_end)
  const overDays = days !== null && days > PC_MAX_PERIOD_DAYS

  return (
    <div className="space-y-6">
      {error && <p className="text-sm px-4 py-2 rounded bg-red-50 text-red-600 whitespace-pre-wrap">{error}</p>}

      <div className={cardClass}>
        <p className={headClass}>申請者</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>申請日</label>
            <Input type="date" value={v.request_date} onChange={e => set({ request_date: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>所属部署</label>
            <Input value={v.department_name} maxLength={100} autoComplete="off" onChange={e => set({ department_name: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>申請者氏名</label>
            <p className="h-10 flex items-center text-sm text-gray-800">{me?.name ?? "—"}</p>
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <p className={headClass}>申請理由（申請に必須・1000文字まで）</p>
        <textarea value={v.reason} maxLength={1000} rows={4} autoComplete="off"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          placeholder="例：TWの為" onChange={e => set({ reason: e.target.value })} />
      </div>

      <div className={cardClass}>
        <p className={headClass}>持出期間（申請に必須）</p>
        <div className="flex items-center gap-3 flex-wrap">
          <Input type="date" className="w-44" value={v.period_start} onChange={e => set({ period_start: e.target.value })} />
          <span className="text-gray-500">～</span>
          <Input type="date" className="w-44" value={v.period_end} onChange={e => set({ period_end: e.target.value })} />
          {days !== null && <span className="text-sm text-gray-500">{days}日間</span>}
        </div>
        {overDays && (
          <p className="mt-2 text-xs px-3 py-2 rounded bg-amber-50 text-amber-700">
            持出期間は、原則最長で1週間です（勤務状況により要相談）。このまま申請もできます。
          </p>
        )}
      </div>

      <div className={cardClass}>
        <p className={headClass}>持ち出すPC</p>
        {me && me.devices.length > 1 && (
          <div className="mb-4">
            <label className={labelClass}>登録済みの持ち出し用端末から選ぶ</label>
            <select className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
              value={v.device_id} onChange={e => pickDevice(e.target.value)}>
              <option value="">-- 選んでください --</option>
              {me.devices.map(d => (
                <option key={d.device_id} value={d.device_id}>{d.device_name}{d.model_label ? `（${d.model_label}）` : ""}{d.is_main ? " ★メイン機" : ""}</option>
              ))}
            </select>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>PC管理番号（申請に必須）</label>
            <Input value={v.device_name} maxLength={100} autoComplete="off"
              onChange={e => set({ device_name: e.target.value, device_id: "" })} />
          </div>
          <div>
            <label className={labelClass}>メーカー・型番</label>
            <Input value={v.model_label} maxLength={200} autoComplete="off" onChange={e => set({ model_label: e.target.value })} />
          </div>
        </div>
        {me && me.devices.length === 0 && (
          <p className="mt-2 text-xs text-gray-400">持ち出し用端末が登録されていないため、手で入力してください。</p>
        )}
        <div className="mt-4 space-y-3">
          <div>
            <p className={labelClass}>付属品</p>
            <div className="flex gap-5 flex-wrap">
              {PC_ACCESSORIES.map(n => (
                <label key={n} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="checkbox" checked={v.accessories.includes(n)} onChange={() => toggle("accessories", n)} />{n}
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className={labelClass}>必要ソフト</p>
            <div className="flex gap-5 flex-wrap">
              {PC_SOFTWARE.map(n => (
                <label key={n} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="checkbox" checked={v.software.includes(n)} onChange={() => toggle("software", n)} />{n}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" disabled={saving} onClick={onCancel}>キャンセル</Button>
        <Button variant="outline" disabled={saving} onClick={() => onSave(v, false, false)}>下書き保存</Button>
        <Button disabled={saving} onClick={() => setConfirmOpen(true)}>申請する</Button>
      </div>
      {confirmOpen && (
        <SendMailDialog title="申請の確認" message="最初の承認者に、承認依頼のメールを送りますか。" actionLabel="申請する" busy={saving}
          onSelect={sendMail => { setConfirmOpen(false); onSave(v, true, sendMail) }}
          onCancel={() => setConfirmOpen(false)} />
      )}
    </div>
  )
}
