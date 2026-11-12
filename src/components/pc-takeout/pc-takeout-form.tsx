"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SendMailDialog from "@/components/accounting/send-mail-dialog"
import { PC_DESTINATIONS, PC_MAX_PERIOD_DAYS, PC_PLEDGE_LATEST } from "@/lib/pc-takeout"

// PC持ち出し申請の入力フォーム（新規作成と編集で共有する）。
// - 申請日は、サーバーが保存した日に決める（画面では入力できない）
// - 持ち出すPCは、本人の持ち出し用端末（ユーザーマスタで登録）から選ぶだけ。新規作成のときは、メイン機が自動で入る
// - 申請には、厳守事項への同意のチェックが必須（申請のたびに、毎回取り直す）
export type PcTakeoutFormValues = {
  department_name: string
  reason: string
  destination: string
  period_start: string
  period_end: string
  device_id: string
  device_name: string
  model_label: string
  pledge_agreed: boolean
  pledge_version: number
}

type TakeoutDevice = { device_id: number; device_name: string; model_label: string; is_main: boolean }
type Me = { name: string; department_name: string; devices: TakeoutDevice[]; main_device: TakeoutDevice | null }

const today = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const emptyPcTakeoutForm = (): PcTakeoutFormValues => ({
  department_name: "",
  reason: "",
  destination: "",
  period_start: "",
  period_end: "",
  device_id: "",
  device_name: "",
  model_label: "",
  pledge_agreed: false,
  pledge_version: PC_PLEDGE_LATEST.version,
})

// 保存済みの申請から、フォームの初期値を作る（同意のチェックは、毎回、取り直す）
export function pcTakeoutFormFromRequest(r: {
  department_name: string | null
  reason: string
  destination: string | null
  period_start: string | null
  period_end: string | null
  device_id: number | null
  device_name: string | null
  model_label: string | null
}): PcTakeoutFormValues {
  return {
    department_name: r.department_name ?? "",
    reason: r.reason ?? "",
    destination: r.destination ?? "",
    period_start: r.period_start ? r.period_start.slice(0, 10) : "",
    period_end: r.period_end ? r.period_end.slice(0, 10) : "",
    device_id: r.device_id != null ? String(r.device_id) : "",
    device_name: r.device_name ?? "",
    model_label: r.model_label ?? "",
    pledge_agreed: false,
    pledge_version: PC_PLEDGE_LATEST.version,
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
const selectClass = "w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"

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
        // 新規作成のときだけ：所属部署と、メイン機（1台だけ登録の人は、その端末）を自動で入れる。すでに入力済みの項目は、上書きしない
        const pick = data.main_device ?? (data.devices.length === 1 ? data.devices[0] : null)
        setV(prev => ({
          ...prev,
          department_name: prev.department_name || data.department_name,
          ...(prev.device_id === "" && pick
            ? { device_id: String(pick.device_id), device_name: pick.device_name, model_label: pick.model_label }
            : {}),
        }))
      })
      .catch(() => {})
    return () => { alive = false }
  }, [isNew])

  const pickDevice = (idText: string) => {
    const d = me?.devices.find(x => String(x.device_id) === idText)
    if (d) set({ device_id: String(d.device_id), device_name: d.device_name, model_label: d.model_label })
    else set({ device_id: "", device_name: "", model_label: "" })
  }

  const days = periodDays(v.period_start, v.period_end)
  const overDays = days !== null && days > PC_MAX_PERIOD_DAYS
  const noDevices = me !== null && me.devices.length === 0
  const selectedInList = !!me && me.devices.some(d => String(d.device_id) === v.device_id)
  const staleDevice = !!me && v.device_id !== "" && !selectedInList // 保存済みの端末が、いまの持ち出し用端末に、登録されていない

  return (
    <div className="space-y-6">
      {error && <p className="text-sm px-4 py-2 rounded bg-red-50 text-red-600 whitespace-pre-wrap">{error}</p>}

      <div className={cardClass}>
        <p className={headClass}>申請者</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>申請日</label>
            <p className="h-10 flex items-center text-sm text-gray-800">{today().replace(/-/g, "/")}</p>
            <p className="text-xs text-gray-400">保存・申請した日が、自動で入ります</p>
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
        <p className={headClass}>持出先・持出期間（申請に必須）</p>
        <div className="mb-4 max-w-xs">
          <label className={labelClass}>持出先</label>
          <select className={selectClass} value={v.destination} onChange={e => set({ destination: e.target.value })}>
            <option value="">-- 選んでください --</option>
            {PC_DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="w-44 shrink-0">
            <label className={labelClass}>開始日</label>
            <Input type="date" min={today()} value={v.period_start} onChange={e => set({ period_start: e.target.value })} />
          </div>
          <span className="pb-2 text-gray-500">～</span>
          <div className="w-44 shrink-0">
            <label className={labelClass}>返却予定日</label>
            <Input type="date" min={v.period_start || today()} value={v.period_end} onChange={e => set({ period_end: e.target.value })} />
          </div>
          {days !== null && <span className="pb-2 text-sm text-gray-500">{days}日間</span>}
        </div>
        <p className="mt-2 text-xs text-gray-400">持出期間の開始日は、今日以降に限ります（事後の申請は、できません）。</p>
        {overDays && (
          <p className="mt-2 text-xs px-3 py-2 rounded bg-amber-50 text-amber-700">
            持出期間は、原則最長で1週間です（勤務状況により要相談）。このまま申請もできます。
          </p>
        )}
      </div>

      <div className={cardClass}>
        <p className={headClass}>持ち出すPC（申請に必須）</p>
        {noDevices ? (
          <p className="text-sm px-3 py-2 rounded bg-amber-50 text-amber-700">
            持ち出し用端末が、登録されていません。システム管理者に、ユーザーマスタの「持ち出し用端末」への登録を依頼してください。登録されるまで、申請はできません（下書きの保存はできます）。
          </p>
        ) : (
          <>
            <label className={labelClass}>持ち出し用端末から選ぶ</label>
            <select className={selectClass} value={selectedInList ? v.device_id : ""} onChange={e => pickDevice(e.target.value)}>
              <option value="">-- 選んでください --</option>
              {me?.devices.map(d => (
                <option key={d.device_id} value={d.device_id}>{d.device_name}{d.model_label ? `（${d.model_label}）` : ""}{d.is_main ? " ★メイン機" : ""}</option>
              ))}
            </select>
            {staleDevice && (
              <p className="mt-2 text-xs px-3 py-2 rounded bg-amber-50 text-amber-700">
                保存済みの端末（{v.device_name || "不明"}）は、いまの持ち出し用端末に登録されていません。登録済みの端末から、選び直してください。
              </p>
            )}
            {selectedInList && (
              <dl className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2 text-sm">
                <div><dt className="text-xs text-gray-500">PC管理番号</dt><dd>{v.device_name}</dd></div>
                <div><dt className="text-xs text-gray-500">メーカー・型番</dt><dd>{v.model_label || "—"}</dd></div>
              </dl>
            )}
          </>
        )}
      </div>

      <div className={cardClass}>
        <p className={headClass}>厳守事項（申請に必須）</p>
        <div className="text-sm text-gray-700 space-y-1 mb-3">
          {PC_PLEDGE_LATEST.intro.map((t, i) => <p key={i}>{t}</p>)}
        </div>
        <div className="border border-gray-300 rounded-md p-4 text-sm bg-gray-50">
          <p className="font-bold mb-1">●厳守事項</p>
          <ol className="list-decimal pl-5 space-y-1">
            {PC_PLEDGE_LATEST.rules.map((t, i) => <li key={i}>{t}</li>)}
          </ol>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input type="checkbox" checked={v.pledge_agreed} onChange={e => set({ pledge_agreed: e.target.checked })} />
          上記の厳守事項に同意し、遵守することを誓約します
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" disabled={saving} onClick={onCancel}>キャンセル</Button>
        <Button variant="outline" disabled={saving} onClick={() => onSave(v, false, false)}>下書き保存</Button>
        <Button disabled={saving || !v.pledge_agreed || noDevices} onClick={() => setConfirmOpen(true)}>申請する</Button>
      </div>
      {!v.pledge_agreed && <p className="text-right text-xs text-gray-400">申請するには、厳守事項への同意のチェックが必要です。</p>}
      {confirmOpen && (
        <SendMailDialog title="申請の確認" message="最初の承認者に、承認依頼のメールを送りますか。" actionLabel="申請する" busy={saving}
          onSelect={sendMail => { setConfirmOpen(false); onSave(v, true, sendMail) }}
          onCancel={() => setConfirmOpen(false)} />
      )}
    </div>
  )
}
