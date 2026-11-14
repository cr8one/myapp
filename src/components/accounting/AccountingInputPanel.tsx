"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// 勘定科目の選択肢（これまでの伝票から拾ったもの。ここにない科目は「その他（直接入力）」で書く）
const ACCOUNTS = [
  { label: "接待交際費 719-1", name: "接待交際費", code: "719-1" },
  { label: "接待交際費 719-2", name: "接待交際費", code: "719-2" },
  { label: "接待交際費 719-3", name: "接待交際費", code: "719-3" },
  { label: "会議費 720", name: "会議費", code: "720" },
]
const OTHER = "__other__"
const TAX = ["4.課税", "0.非外", "6.共通"]

type Split = { name: string; amount: string; tax_category: string }
type Row = {
  label: string
  base: number
  account_name: string
  account_code: string
  tax_category: string
  splits: Split[]
  other: boolean
}

export type PanelItem = {
  type?: string
  payee?: string
  item?: string
  amount: number
  account_name?: string
  account_code?: string
  tax_category?: string
  splits?: { name: string; amount: number; tax_category: string }[]
}

const yen = (n: number) => `${n.toLocaleString()}円`
const LETTERS = ["A", "B", "C", "D", "E"]

// 保存済みの値から、画面の行を作る
function toRows(items: PanelItem[]): Row[] {
  const meals = items.filter(x => x.type !== "other")
  const others = items.filter(x => x.type === "other")
  return [...meals, ...others].map((x, i) => {
    const known = ACCOUNTS.some(a => a.name === x.account_name && a.code === x.account_code)
    return {
      label: `${LETTERS[i]}　${x.type === "other" ? (x.item || "その他") : (x.payee || "飲食費")}`,
      base: x.amount,
      account_name: x.account_name ?? "",
      account_code: x.account_code ?? "",
      tax_category: x.tax_category ?? "",
      splits: (x.splits ?? []).map(s => ({ name: s.name, amount: String(s.amount || ""), tax_category: s.tax_category })),
      other: !!(x.account_name || x.account_code) && !known,
    }
  })
}

type Props = {
  slipId: string
  stepId: string
  items: PanelItem[]
  shortageAccount: string
  onSaved: () => void
}

export default function AccountingInputPanel({ slipId, stepId, items, shortageAccount, onSaved }: Props) {
  const [rows, setRows] = useState<Row[]>(() => toRows(items))
  const [shortage, setShortage] = useState(shortageAccount)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  const setRow = (i: number, patch: Partial<Row>) => { setSaved(false); setRows(prev => prev.map((r, j) => (j === i ? { ...r, ...patch } : r))) }
  const setSplit = (i: number, k: number, patch: Partial<Split>) =>
    setRow(i, { splits: rows[i].splits.map((s, j) => (j === k ? { ...s, ...patch } : s)) })

  const pickAccount = (i: number, v: string) => {
    if (v === OTHER) { setRow(i, { other: true }); return }
    const a = ACCOUNTS.find(x => x.label === v)
    if (a) setRow(i, { other: false, account_name: a.name, account_code: a.code })
    else setRow(i, { other: false, account_name: "", account_code: "" })
  }
  const selectValue = (r: Row) => {
    if (r.other) return OTHER
    const a = ACCOUNTS.find(x => x.name === r.account_name && x.code === r.account_code)
    return a ? a.label : ""
  }
  const splitTotal = (r: Row) => r.splits.reduce((s, x) => s + Number(x.amount || 0), 0)
  const mismatch = (r: Row) => r.splits.length > 0 && splitTotal(r) !== r.base

  const save = async () => {
    if (rows.some(mismatch)) { setError("内訳の合計が、行の金額と一致しない行があります"); return }
    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/api/eapp/accounting/slips/${slipId}/accounting-input`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step_id: stepId,
          shortage_account_name: shortage,
          items: rows.map(r => ({
            account_name: r.account_name,
            account_code: r.account_code,
            tax_category: r.tax_category,
            splits: r.splits.map(s => ({ name: s.name, amount: Number(s.amount || 0), tax_category: s.tax_category })),
          })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "保存に失敗しました")
      setSaved(true)
      onSaved()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const selectClass = "h-9 border rounded px-2 text-sm bg-white"
  const labelClass = "block text-xs text-gray-500 mb-1"

  return (
    <div className="bg-white border border-slate-300 rounded-lg p-4 mb-4 shadow-sm">
      <p className="text-sm font-bold text-gray-700 mb-1">経理：勘定科目・区分の入力</p>
      <p className="text-xs text-gray-400 mb-3">起案者には表示されません。ゴルフ場利用税など、課税区分が違うものは、「内訳」に分けて入れます（内訳の合計は、行の金額と同じにします）。</p>
      {rows.map((r, i) => (
        <div key={i} className="border rounded-md p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-700">{r.label}</span>
            <span className="text-sm">{yen(r.base)}</span>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className={labelClass}>勘定科目</label>
              <select className={`${selectClass} w-52`} value={selectValue(r)} onChange={e => pickAccount(i, e.target.value)}>
                <option value="">-- 選んでください --</option>
                {ACCOUNTS.map(a => <option key={a.label} value={a.label}>{a.label}</option>)}
                <option value={OTHER}>その他（直接入力）</option>
              </select>
            </div>
            {r.other && (
              <>
                <div className="w-40">
                  <label className={labelClass}>科目名</label>
                  <Input value={r.account_name} maxLength={20} autoComplete="off" onChange={e => setRow(i, { account_name: e.target.value })} />
                </div>
                <div className="w-28">
                  <label className={labelClass}>コード</label>
                  <Input value={r.account_code} maxLength={10} autoComplete="off" onChange={e => setRow(i, { account_code: e.target.value.replace(/[^0-9-]/g, "") })} />
                </div>
              </>
            )}
            <div>
              <label className={labelClass}>区分</label>
              <select className={`${selectClass} w-32`} value={r.tax_category} onChange={e => setRow(i, { tax_category: e.target.value })}>
                <option value="">--</option>
                {TAX.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {r.splits.map((s, k) => (
            <div key={k} className="flex flex-wrap items-end gap-3 mt-2 pl-4">
              <div className="w-44">
                <label className={labelClass}>内訳の名前</label>
                <Input value={s.name} maxLength={20} autoComplete="off" placeholder="例：ゴルフ場利用税" onChange={e => setSplit(i, k, { name: e.target.value })} />
              </div>
              <div className="w-32">
                <label className={labelClass}>金額</label>
                <Input className="text-right" inputMode="numeric" value={s.amount} autoComplete="off"
                  onChange={e => setSplit(i, k, { amount: e.target.value.replace(/\D/g, "").slice(0, 8) })} />
              </div>
              <div>
                <label className={labelClass}>区分</label>
                <select className={`${selectClass} w-28`} value={s.tax_category} onChange={e => setSplit(i, k, { tax_category: e.target.value })}>
                  <option value="">--</option>
                  {TAX.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <Button variant="outline" className="h-9 px-2 text-xs" onClick={() => setRow(i, { splits: r.splits.filter((_, j) => j !== k) })}>削除</Button>
            </div>
          ))}
          <div className="mt-2 flex items-center gap-3">
            {r.splits.length < 4 && (
              <Button variant="outline" className="h-8 px-3 text-xs"
                onClick={() => setRow(i, { splits: [...r.splits, { name: "", amount: "", tax_category: "" }] })}>＋ 内訳を追加</Button>
            )}
            {r.splits.length > 0 && (
              <span className={`text-xs ${mismatch(r) ? "text-red-600" : "text-gray-500"}`}>
                内訳の合計 {yen(splitTotal(r))}{mismatch(r) ? `（行の金額 ${yen(r.base)} と合いません）` : ""}
              </span>
            )}
          </div>
        </div>
      ))}
      <div className="mb-3 w-72">
        <label className={labelClass}>仮払金不足の勘定科目</label>
        <Input value={shortage} maxLength={20} autoComplete="off" onChange={e => { setSaved(false); setShortage(e.target.value) }} />
      </div>
      {error && <p className="mb-3 text-sm px-3 py-2 rounded bg-red-50 text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <Button size="sm" disabled={saving} onClick={save}>{saving ? "保存中..." : "勘定科目・区分を保存"}</Button>
        {saved && <span className="text-xs text-green-700">保存しました</span>}
      </div>
    </div>
  )
}
