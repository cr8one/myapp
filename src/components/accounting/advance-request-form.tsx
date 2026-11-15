"use client"
import { useState, useEffect, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SendMailDialog from "@/components/accounting/send-mail-dialog"
import { LIMIT } from "@/lib/accounting-advance-request-layout"

// 画面の値は、金額も文字で持つ。サーバー側の入力チェックが数値として検査する
export type AdvanceFormValues = {
  slipDate: string
  departmentCode: string
  departmentName: string
  purpose: string
  dueDate: string
  amount: string
}

const today = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const emptyAdvanceForm = (): AdvanceFormValues => ({
  slipDate: today(),
  departmentCode: "",
  departmentName: "",
  purpose: "",
  dueDate: "",
  amount: "",
})

type SlipForForm = {
  slip_date: string
  department_code: string | null
  department_name: string | null
  advance_request: {
    purpose: string | null
    due_date: string | null
    advance_amount: number
  } | null
}

// 保存済みの伝票から、画面の値に戻す
export function advanceFormFromSlip(slip: SlipForForm): AdvanceFormValues {
  const a = slip.advance_request
  return {
    slipDate: slip.slip_date.slice(0, 10),
    departmentCode: slip.department_code ?? "",
    departmentName: slip.department_name ?? "",
    purpose: a?.purpose ?? "",
    dueDate: a?.due_date ? a.due_date.slice(0, 10) : "",
    amount: a?.advance_amount ? String(a.advance_amount) : "",
  }
}

// 画面の値を、APIに送る形にする
export function advanceFormPayload(v: AdvanceFormValues, submit: boolean) {
  return {
    submit,
    slip_date: v.slipDate,
    department_code: v.departmentCode,
    department_name: v.departmentName,
    purpose: v.purpose,
    due_date: v.dueDate,
    advance_amount: v.amount,
  }
}

const num = (s: string) => Number(s || 0)
const digits = (s: string, max = 8) => s.replace(/\D/g, "").slice(0, max)
const yen = (n: number) => `${n.toLocaleString()}円`

type Props = {
  initial: AdvanceFormValues
  saving: boolean
  error: string
  saveLabel?: string
  submitLabel?: string
  onSave: (values: AdvanceFormValues, submit: boolean, sendMail: boolean) => void
  onCancel: () => void
  attachments?: ReactNode // 添付ファイルの欄（新規作成と編集で、中身が違う）
}

export default function AdvanceRequestForm({ initial, saving, error, saveLabel = "下書き保存", submitLabel = "申請する", onSave, onCancel, attachments }: Props) {
  const [v, setV] = useState<AdvanceFormValues>(initial)
  const [confirmOpen, setConfirmOpen] = useState(false)
  // 部署は、開いた時点で、本人のユーザーマスタの値を入れておく（すでに入っている伝票は、そのまま）
  useEffect(() => {
    fetch("/api/eapp/accounting/requester-info").then(r => (r.ok ? r.json() : null)).then(d => {
      if (!d) return
      setV(prev => (prev.departmentCode || prev.departmentName) ? prev : { ...prev, departmentCode: d.department_code ?? "", departmentName: d.department_name ?? "" })
    }).catch(() => {})
  }, [])
  const set = (patch: Partial<AdvanceFormValues>) => setV(prev => ({ ...prev, ...patch }))

  const labelClass = "block text-xs text-gray-500 mb-1"
  const cardClass = "bg-white border rounded-lg p-4 mb-4 shadow-sm"
  const headClass = "text-sm font-bold text-gray-700 mb-3"

  return (
    <div>
      <div className={cardClass}>
        <p className={headClass}>基本情報</p>
        <div className="flex flex-wrap gap-3">
          <div className="w-44 shrink-0">
            <label className={labelClass}>日付</label>
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
        <p className={headClass}>請求内容</p>
        <div className="mb-3">
          <label className={labelClass}>使途内容（申請に必須。{LIMIT.purpose}文字まで）</label>
          <textarea className="w-full min-h-[8rem] border rounded px-3 py-2 text-sm" value={v.purpose} maxLength={LIMIT.purpose}
            onChange={e => set({ purpose: e.target.value })} />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="w-44 shrink-0">
            <label className={labelClass}>精算予定日（申請に必須）</label>
            <Input type="date" value={v.dueDate} onChange={e => set({ dueDate: e.target.value })} />
          </div>
          <div className="w-44">
            <label className={labelClass}>仮払金額（申請に必須）</label>
            <Input className="text-right" inputMode="numeric" placeholder="金額" value={v.amount} autoComplete="off"
              onChange={e => set({ amount: digits(e.target.value) })} />
          </div>
        </div>
      </div>

      {attachments && (
        <div className={cardClass}>
          <p className={headClass}>添付ファイル</p>
          {attachments}
        </div>
      )}

      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 mb-4 flex items-center justify-between">
        <span className="font-bold text-gray-700">仮払金額</span>
        <span className="text-xl font-bold">{yen(num(v.amount))}</span>
      </div>

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
