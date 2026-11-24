"use client"
import { useState, useEffect, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SendMailDialog from "@/components/accounting/send-mail-dialog"
import { LIMIT } from "@/lib/accounting-reception-layout"

// 画面の値は、金額も文字で持つ。サーバー側の入力チェックが数値として検査する
export type ReceptionFormValues = {
  slipDate: string
  departmentCode: string
  departmentName: string
  clientName: string
  contactName: string
  receptionDate: string
  content: string
  place: string
  reason: string
  budget: string
  advanceNeeded: boolean
}

const today = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const emptyReceptionForm = (): ReceptionFormValues => ({
  slipDate: today(),
  departmentCode: "",
  departmentName: "",
  clientName: "",
  contactName: "",
  receptionDate: "",
  content: "",
  place: "",
  reason: "",
  budget: "",
  advanceNeeded: false,
})

type SlipForForm = {
  slip_date: string
  department_code: string | null
  department_name: string | null
  reception_approval: {
    client_name: string | null
    contact_name: string | null
    reception_date: string | null
    content: string | null
    place: string | null
    reason: string | null
    budget_amount: number
    advance_needed: boolean
  } | null
}

// 保存済みの伝票から、画面の値に戻す
export function receptionFormFromSlip(slip: SlipForForm): ReceptionFormValues {
  const r = slip.reception_approval
  return {
    slipDate: slip.slip_date.slice(0, 10),
    departmentCode: slip.department_code ?? "",
    departmentName: slip.department_name ?? "",
    clientName: r?.client_name ?? "",
    contactName: r?.contact_name ?? "",
    receptionDate: r?.reception_date ? r.reception_date.slice(0, 10) : "",
    content: r?.content ?? "",
    place: r?.place ?? "",
    reason: r?.reason ?? "",
    budget: r?.budget_amount ? String(r.budget_amount) : "",
    advanceNeeded: r?.advance_needed ?? false,
  }
}

// 画面の値を、APIに送る形にする
export function receptionFormPayload(v: ReceptionFormValues, submit: boolean) {
  return {
    submit,
    slip_date: v.slipDate,
    department_code: v.departmentCode,
    department_name: v.departmentName,
    client_name: v.clientName,
    contact_name: v.contactName,
    reception_date: v.receptionDate,
    content: v.content,
    place: v.place,
    reason: v.reason,
    budget_amount: v.budget,
    advance_needed: v.advanceNeeded,
  }
}

const digits = (s: string, max = 8) => s.replace(/\D/g, "").slice(0, max)

type Props = {
  initial: ReceptionFormValues
  saving: boolean
  error: string
  saveLabel?: string
  submitLabel?: string
  onSave: (values: ReceptionFormValues, submit: boolean, sendMail: boolean) => void
  onCancel: () => void
  attachments?: ReactNode // 添付ファイルの欄（新規作成と編集で、中身が違う）
}

export default function ReceptionForm({ initial, saving, error, saveLabel = "下書き保存", submitLabel = "申請する", onSave, onCancel, attachments }: Props) {
  const [v, setV] = useState<ReceptionFormValues>(initial)
  const [confirmOpen, setConfirmOpen] = useState(false)
  // 部署は、開いた時点で、本人のユーザーマスタの値を入れておく（すでに入っている伝票は、そのまま）
  useEffect(() => {
    fetch("/api/eapp/accounting/requester-info").then(r => (r.ok ? r.json() : null)).then(d => {
      if (!d) return
      setV(prev => (prev.departmentCode || prev.departmentName) ? prev : { ...prev, departmentCode: d.department_code ?? "", departmentName: d.department_name ?? "" })
    }).catch(() => {})
  }, [])
  const set = (patch: Partial<ReceptionFormValues>) => setV(prev => ({ ...prev, ...patch }))

  const labelClass = "block text-xs text-gray-500 mb-1"
  const cardClass = "bg-white border rounded-lg p-4 mb-4 shadow-sm"
  const headClass = "text-sm font-bold text-gray-700 mb-3"
  const areaClass = "w-full min-h-[4rem] border rounded px-3 py-2 text-sm"

  return (
    <div>
      <div className={cardClass}>
        <p className={headClass}>基本情報</p>
        <div className="flex flex-wrap gap-3">
          <div className="w-44 shrink-0">
            <label className={labelClass}>提出日</label>
            <Input type="date" value={v.slipDate} onChange={e => set({ slipDate: e.target.value })} />
          </div>
          <div className="w-28">
            <label className={labelClass}>部門コード</label>
            <Input inputMode="numeric" placeholder="3桁" value={v.departmentCode} autoComplete="off"
              onChange={e => set({ departmentCode: digits(e.target.value, 3) })} />
          </div>
          <div className="flex-1 min-w-[14rem]">
            <label className={labelClass}>部署</label>
            <Input value={v.departmentName} maxLength={100} autoComplete="off" onChange={e => set({ departmentName: e.target.value })} />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <p className={headClass}>接待先</p>
        <div className="flex flex-wrap gap-3 mb-3">
          <div className="flex-1 min-w-[16rem]">
            <label className={labelClass}>得意先名（申請に必須。{LIMIT.client}文字まで）</label>
            <Input value={v.clientName} maxLength={LIMIT.client} autoComplete="off" onChange={e => set({ clientName: e.target.value })} />
          </div>
          <div className="w-60">
            <label className={labelClass}>氏名（{LIMIT.contact}文字まで）</label>
            <Input value={v.contactName} maxLength={LIMIT.contact} autoComplete="off" onChange={e => set({ contactName: e.target.value })} />
          </div>
        </div>
        <div className="w-44 shrink-0">
          <label className={labelClass}>接待日（申請に必須）</label>
          <Input type="date" value={v.receptionDate} onChange={e => set({ receptionDate: e.target.value })} />
        </div>
      </div>

      <div className={cardClass}>
        <p className={headClass}>接待の内容</p>
        <div className="mb-3">
          <label className={labelClass}>内容（申請に必須。{LIMIT.content}文字まで）</label>
          <textarea className={areaClass} value={v.content} maxLength={LIMIT.content} onChange={e => set({ content: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className={labelClass}>場所（申請に必須。{LIMIT.place}文字まで）</label>
          <textarea className={areaClass} value={v.place} maxLength={LIMIT.place} onChange={e => set({ place: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>理由（申請に必須。{LIMIT.reason}文字まで）</label>
          <textarea className={areaClass} value={v.reason} maxLength={LIMIT.reason} onChange={e => set({ reason: e.target.value })} />
        </div>
      </div>

      <div className={cardClass}>
        <p className={headClass}>予算</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-44">
            <label className={labelClass}>予算額（申請に必須）</label>
            <Input className="text-right" inputMode="numeric" placeholder="金額" value={v.budget} autoComplete="off"
              onChange={e => set({ budget: digits(e.target.value) })} />
          </div>
          <div className="w-44">
            <label className={labelClass}>仮払</label>
            <select className="h-9 w-full border rounded px-2 text-sm bg-white" value={v.advanceNeeded ? "yes" : "no"}
              onChange={e => set({ advanceNeeded: e.target.value === "yes" })}>
              <option value="no">不要</option>
              <option value="yes">要</option>
            </select>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400">実際額は、承認が完了したあと、接待のあとに記録します。</p>
      </div>

      {attachments && (
        <div className={cardClass}>
          <p className={headClass}>添付ファイル</p>
          {attachments}
        </div>
      )}

      {error && <p className="mb-4 text-sm px-4 py-2 rounded bg-red-50 text-red-600">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" disabled={saving} onClick={onCancel}>キャンセル</Button>
        <Button variant="outline" disabled={saving} onClick={() => onSave(v, false, false)}>{saveLabel}</Button>
        <Button disabled={saving} onClick={() => setConfirmOpen(true)}>{submitLabel}</Button>
      </div>

      {confirmOpen && (
        <SendMailDialog title="申請の確認" message="最初の承認者に、承認依頼のメールを送りますか。" actionLabel="申請する" busy={saving}
          onSelect={sendMail => { setConfirmOpen(false); onSave(v, true, sendMail) }}
          onCancel={() => setConfirmOpen(false)} />
      )}
    </div>
  )
}
