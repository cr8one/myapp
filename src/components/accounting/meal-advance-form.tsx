"use client"
import { useState, useEffect, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SendMailDialog from "@/components/accounting/send-mail-dialog"
import { LIMIT, MEAL_KINDS } from "@/lib/accounting-meal-advance-layout"
import { MAX_MEAL_ROWS, MAX_OTHER_ROWS } from "@/lib/accounting-meal-advance"

// 飲食費A・Bの1行分（画面の値は、金額も文字で持つ。サーバー側の入力チェックが数値として検査する）
export type MealRowValues = {
  payee: string
  address: string
  mealDate: string
  tel: string
  kind: string
  headcount: string
  participants: string
  amount: string
}
// その他精算C・D・Eの1行分（カーリース代、高速道路利用代など）
export type OtherRowValues = { item: string; amount: string }

export type MealFormValues = {
  slipDate: string
  departmentCode: string
  departmentName: string
  purpose: string
  remarks: string
  advance: string
  meals: MealRowValues[]
  others: OtherRowValues[]
}

const today = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const emptyMeal = (): MealRowValues => ({ payee: "", address: "", mealDate: "", tel: "", kind: "", headcount: "", participants: "", amount: "" })
const emptyOther = (): OtherRowValues => ({ item: "", amount: "" })

// 初期状態は、飲食費を1行だけ出す（ほとんどが飲食代のため）
export const emptyMealForm = (): MealFormValues => ({
  slipDate: today(),
  departmentCode: "",
  departmentName: "",
  purpose: "",
  remarks: "",
  advance: "",
  meals: [emptyMeal()],
  others: [],
})

type ApiItem = {
  type?: string
  payee?: string
  address?: string
  meal_date?: string
  tel?: string
  kind?: string
  headcount?: number
  participants?: string
  item?: string
  amount?: number
}

type SlipForForm = {
  slip_date: string
  department_code: string | null
  department_name: string | null
  meal_advance: {
    purpose: string | null
    remarks: string | null
    items: ApiItem[] | null
    advance_amount: number
  } | null
}

const numStr = (n?: number) => (n ? String(n) : "")

// 保存済みの伝票から、画面の値に戻す
export function mealFormFromSlip(slip: SlipForForm): MealFormValues {
  const m = slip.meal_advance
  const items = m?.items ?? []
  const meals = items.filter(x => x.type !== "other").map((x): MealRowValues => ({
    payee: x.payee ?? "",
    address: x.address ?? "",
    mealDate: x.meal_date ?? "",
    tel: x.tel ?? "",
    kind: x.kind ?? "",
    headcount: numStr(x.headcount),
    participants: x.participants ?? "",
    amount: numStr(x.amount),
  }))
  const others = items.filter(x => x.type === "other").map((x): OtherRowValues => ({ item: x.item ?? "", amount: numStr(x.amount) }))
  return {
    slipDate: slip.slip_date.slice(0, 10),
    departmentCode: slip.department_code ?? "",
    departmentName: slip.department_name ?? "",
    purpose: m?.purpose ?? "",
    remarks: m?.remarks ?? "",
    advance: numStr(m?.advance_amount),
    meals: meals.length > 0 || others.length > 0 ? meals : [emptyMeal()],
    others,
  }
}

// 画面の値を、APIに送る形にする（飲食費を先に、その他を後に並べる）
export function mealFormPayload(v: MealFormValues, submit: boolean) {
  return {
    submit,
    slip_date: v.slipDate,
    department_code: v.departmentCode,
    department_name: v.departmentName,
    purpose: v.purpose,
    remarks: v.remarks,
    advance_amount: v.advance,
    items: [
      ...v.meals.map(r => ({
        type: "meal",
        payee: r.payee,
        address: r.address,
        meal_date: r.mealDate,
        tel: r.tel,
        kind: r.kind,
        headcount: r.headcount,
        participants: r.participants,
        amount: r.amount,
      })),
      ...v.others.map(r => ({ type: "other", item: r.item, amount: r.amount })),
    ],
  }
}

const num = (s: string) => Number(s || 0)
const digits = (s: string, max = 8) => s.replace(/\D/g, "").slice(0, max)
const yen = (n: number) => `${n.toLocaleString()}円`
const setAt = <T,>(arr: T[], i: number, patch: Partial<T>): T[] => arr.map((x, j) => (j === i ? { ...x, ...patch } : x))

const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦"]
const MEAL_LETTERS = ["A", "B"]
const OTHER_LETTERS = ["C", "D", "E"]

type Props = {
  initial: MealFormValues
  saving: boolean
  error: string
  saveLabel?: string
  submitLabel?: string
  onSave: (values: MealFormValues, submit: boolean, sendMail: boolean) => void
  onCancel: () => void
  attachments?: ReactNode // 添付ファイルの欄（新規作成と編集で、中身が違う）
}

export default function MealAdvanceForm({ initial, saving, error, saveLabel = "下書き保存", submitLabel = "申請する", onSave, onCancel, attachments }: Props) {
  const [v, setV] = useState<MealFormValues>(initial)
  const [confirmOpen, setConfirmOpen] = useState(false)
  // 部署は、開いた時点で、本人のユーザーマスタの値を入れておく（すでに入っている伝票は、そのまま）
  useEffect(() => {
    fetch("/api/eapp/accounting/requester-info").then(r => (r.ok ? r.json() : null)).then(d => {
      if (!d) return
      setV(prev => (prev.departmentCode || prev.departmentName) ? prev : { ...prev, departmentCode: d.department_code ?? "", departmentName: d.department_name ?? "" })
    }).catch(() => {})
  }, [])
  const set = (patch: Partial<MealFormValues>) => setV(prev => ({ ...prev, ...patch }))

  const subtotal = v.meals.reduce((a, r) => a + num(r.amount), 0) + v.others.reduce((a, r) => a + num(r.amount), 0)
  const advance = num(v.advance)
  const shortage = Math.max(subtotal - advance, 0)
  const balance = Math.max(advance - subtotal, 0)

  const submit = () => setConfirmOpen(true)

  const labelClass = "block text-xs text-gray-500 mb-1"
  const cardClass = "bg-white border rounded-lg p-4 mb-4 shadow-sm"
  const headClass = "text-sm font-bold text-gray-700 mb-3"
  const selectClass = "h-9 w-full border rounded px-2 text-sm bg-white"

  return (
    <div>
      <div className={cardClass}>
        <p className={headClass}>基本情報</p>
        <div className="flex flex-wrap gap-3 mb-3">
          <div className="w-44 shrink-0">
            <label className={labelClass}>精算日</label>
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
        <div>
          <label className={labelClass}>使途内容（申請に必須。{LIMIT.purpose}文字まで）</label>
          <Input value={v.purpose} maxLength={LIMIT.purpose} autoComplete="off" onChange={e => set({ purpose: e.target.value })} />
        </div>
      </div>

      <div className={cardClass}>
        <p className={headClass}>飲食費（最大{MAX_MEAL_ROWS}行）</p>
        {v.meals.map((r, i) => (
          <div key={i} className="border rounded-md p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700">飲食費{MEAL_LETTERS[i]}</span>
              <Button variant="outline" className="h-7 px-2 text-xs" disabled={saving}
                onClick={() => set({ meals: v.meals.filter((_, j) => j !== i) })}>この行を削除</Button>
            </div>
            <div className="flex flex-wrap gap-3 mb-2">
              <div className="w-64">
                <label className={labelClass}>支払先名</label>
                <Input value={r.payee} maxLength={LIMIT.payee} autoComplete="off" onChange={e => set({ meals: setAt(v.meals, i, { payee: e.target.value }) })} />
              </div>
              <div className="w-40">
                <label className={labelClass}>種別</label>
                <select className={selectClass} value={r.kind} onChange={e => set({ meals: setAt(v.meals, i, { kind: e.target.value }) })}>
                  <option value="">-- 選んでください --</option>
                  {MEAL_KINDS.map((k, n) => <option key={k} value={k}>{CIRCLED[n]} {k}</option>)}
                </select>
              </div>
              <div className="w-44 shrink-0">
                <label className={labelClass}>飲食日</label>
                <Input type="date" value={r.mealDate} onChange={e => set({ meals: setAt(v.meals, i, { mealDate: e.target.value }) })} />
              </div>
              <div className="w-44">
                <label className={labelClass}>TEL</label>
                <Input inputMode="tel" value={r.tel} maxLength={LIMIT.tel} autoComplete="off"
                  onChange={e => set({ meals: setAt(v.meals, i, { tel: e.target.value.replace(/[^0-9-]/g, "") }) })} />
              </div>
            </div>
            <div className="mb-2">
              <label className={labelClass}>住所</label>
              <Input value={r.address} maxLength={LIMIT.address} autoComplete="off" onChange={e => set({ meals: setAt(v.meals, i, { address: e.target.value }) })} />
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="w-24">
                <label className={labelClass}>参加人数</label>
                <Input className="text-right" inputMode="numeric" placeholder="名" value={r.headcount} autoComplete="off"
                  onChange={e => set({ meals: setAt(v.meals, i, { headcount: digits(e.target.value, 3) }) })} />
              </div>
              <div className="flex-1 min-w-[16rem]">
                <label className={labelClass}>参加者名（{LIMIT.participants}文字まで）</label>
                <Input value={r.participants} maxLength={LIMIT.participants} autoComplete="off" onChange={e => set({ meals: setAt(v.meals, i, { participants: e.target.value }) })} />
              </div>
              <div className="w-40">
                <label className={labelClass}>金額</label>
                <Input className="text-right" inputMode="numeric" placeholder="金額" value={r.amount} autoComplete="off"
                  onChange={e => set({ meals: setAt(v.meals, i, { amount: digits(e.target.value) }) })} />
              </div>
            </div>
          </div>
        ))}
        {v.meals.length < MAX_MEAL_ROWS && (
          <Button variant="outline" disabled={saving} onClick={() => set({ meals: [...v.meals, emptyMeal()] })}>＋ 飲食費を追加</Button>
        )}
      </div>

      <div className={cardClass}>
        <p className={headClass}>その他の精算（カーリース代、高速道路利用代など。最大{MAX_OTHER_ROWS}行）</p>
        {v.others.map((r, i) => (
          <div key={i} className="flex flex-wrap items-end gap-3 mb-3">
            <span className="text-sm font-bold text-gray-700 w-6 pb-2">{OTHER_LETTERS[i]}</span>
            <div className="flex-1 min-w-[16rem]">
              <label className={labelClass}>内容（{LIMIT.otherItem}文字まで）</label>
              <Input placeholder="例：カーリース代、高速道路利用代" value={r.item} maxLength={LIMIT.otherItem} autoComplete="off"
                onChange={e => set({ others: setAt(v.others, i, { item: e.target.value }) })} />
            </div>
            <div className="w-40">
              <label className={labelClass}>金額</label>
              <Input className="text-right" inputMode="numeric" placeholder="金額" value={r.amount} autoComplete="off"
                onChange={e => set({ others: setAt(v.others, i, { amount: digits(e.target.value) }) })} />
            </div>
            <Button variant="outline" className="h-9 px-2 text-xs" disabled={saving}
              onClick={() => set({ others: v.others.filter((_, j) => j !== i) })}>削除</Button>
          </div>
        ))}
        {v.others.length < MAX_OTHER_ROWS && (
          <Button variant="outline" disabled={saving} onClick={() => set({ others: [...v.others, emptyOther()] })}>＋ その他を追加</Button>
        )}
      </div>

      <div className={cardClass}>
        <p className={headClass}>仮払金・備考</p>
        <div className="flex flex-wrap gap-3 mb-3">
          <div className="w-44">
            <label className={labelClass}>仮払金（仮払いがないときは、空欄か0）</label>
            <Input className="text-right" inputMode="numeric" placeholder="0" value={v.advance} autoComplete="off"
              onChange={e => set({ advance: digits(e.target.value) })} />
          </div>
        </div>
        <div>
          <label className={labelClass}>備考（{LIMIT.remarks}文字まで）</label>
          <Input value={v.remarks} maxLength={LIMIT.remarks} autoComplete="off" onChange={e => set({ remarks: e.target.value })} />
        </div>
        <p className="mt-3 text-xs text-gray-400">勘定科目と区分は、経理が入力します。</p>
      </div>

      {attachments && (
        <div className={cardClass}>
          <p className={headClass}>添付ファイル（領収書など）</p>
          {attachments}
        </div>
      )}

      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-700">小計</span>
          <span className="text-xl font-bold">{yen(subtotal)}</span>
        </div>
        <div className="flex gap-6 justify-end mt-2 text-sm text-gray-600">
          <span>不足金　<span className="font-bold">{yen(shortage)}</span></span>
          <span>残金　<span className="font-bold">{yen(balance)}</span></span>
        </div>
      </div>

      {error && <p className="mb-4 text-sm px-4 py-2 rounded bg-red-50 text-red-600">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" disabled={saving} onClick={onCancel}>キャンセル</Button>
        <Button variant="outline" disabled={saving} onClick={() => onSave(v, false, false)}>{saveLabel}</Button>
        <Button disabled={saving} onClick={submit}>{submitLabel}</Button>
      </div>

      {confirmOpen && (
        <SendMailDialog title="申請の確認" message="最初の承認者に、承認依頼のメールを送りますか。" actionLabel="申請する" busy={saving}
          onSelect={sendMail => { setConfirmOpen(false); onSave(v, true, sendMail) }}
          onCancel={() => setConfirmOpen(false)} />
      )}
    </div>
  )
}
