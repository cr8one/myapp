"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const today = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
const num = (s: string) => Number(s || 0)
const digits = (s: string) => s.replace(/\D/g, "").slice(0, 8)
const yen = (n: number) => `${n.toLocaleString()}円`
const setAt = <T,>(arr: T[], i: number, patch: Partial<T>): T[] => arr.map((x, j) => (j === i ? { ...x, ...patch } : x))

type TripRow = { label: string; date: string; time: string }
type TransportRow = { section: string; amount: string }
type LodgingRow = { name: string; nights: string; amount: string }
type AllowanceRow = { days: string; amount: string }

export default function TripExpenseNewPage() {
  const router = useRouter()
  const [slipDate, setSlipDate] = useState(today())
  const [title, setTitle] = useState("")
  const [accountName, setAccountName] = useState("旅費交通費")
  const [accountCode, setAccountCode] = useState("714")
  const [taxCategory, setTaxCategory] = useState("4.課税")
  const [departmentName, setDepartmentName] = useState("")
  const [areaPurpose, setAreaPurpose] = useState("")
  const [tripDates, setTripDates] = useState<TripRow[]>([
    { label: "現地到着時間", date: "", time: "" },
    { label: "現地出発時間", date: "", time: "" },
  ])
  const [transport, setTransport] = useState<TransportRow[]>(Array.from({ length: 8 }, () => ({ section: "", amount: "" })))
  const [lodging, setLodging] = useState<LodgingRow[]>(Array.from({ length: 3 }, () => ({ name: "", nights: "", amount: "" })))
  const [allowance, setAllowance] = useState<AllowanceRow[]>(Array.from({ length: 2 }, () => ({ days: "", amount: "" })))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const transportSubtotal = transport.reduce((a, r) => a + num(r.amount), 0)
  const lodgingSubtotal = lodging.reduce((a, r) => a + num(r.amount), 0)
  const allowanceSubtotal = allowance.reduce((a, r) => a + num(r.amount), 0)
  const total = transportSubtotal + lodgingSubtotal + allowanceSubtotal

  const save = async (submit: boolean) => {
    if (submit && !confirm("この内容で申請しますか？")) return
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/eapp/accounting/slips/trip-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submit,
          slip_date: slipDate,
          title,
          account_name: accountName,
          account_code: accountCode,
          tax_category: taxCategory,
          department_name: departmentName,
          area_purpose: areaPurpose,
          trip_dates: tripDates,
          transport_items: transport,
          lodging_items: lodging,
          allowance_items: allowance,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "保存に失敗しました")
      router.push("/dashboard/eapp/accounting")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const labelClass = "block text-xs text-gray-500 mb-1"
  const cardClass = "bg-white border rounded-lg p-4 mb-4 shadow-sm"
  const headClass = "text-sm font-bold text-gray-700 mb-3"

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/dashboard/eapp/accounting/new" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ChevronLeft className="w-4 h-4" />種類の選択に戻る
      </Link>
      <h1 className="text-2xl font-bold mb-6">出金伝票（出張旅費精算書）</h1>

      <div className={cardClass}>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={labelClass}>日付</label>
            <Input type="date" value={slipDate} onChange={e => setSlipDate(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>タイトル（空欄なら自動で付きます）</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} maxLength={100} autoComplete="off" />
          </div>
          <div>
            <label className={labelClass}>勘定科目</label>
            <Input value={accountName} onChange={e => setAccountName(e.target.value)} maxLength={50} autoComplete="off" />
          </div>
          <div>
            <label className={labelClass}>勘定科目コード</label>
            <Input value={accountCode} onChange={e => setAccountCode(e.target.value)} maxLength={20} autoComplete="off" />
          </div>
          <div>
            <label className={labelClass}>課税区分</label>
            <Input value={taxCategory} onChange={e => setTaxCategory(e.target.value)} maxLength={50} autoComplete="off" />
          </div>
          <div className="sm:col-span-3">
            <label className={labelClass}>部署（空欄なら、部門コード・部署・グループから自動で入ります）</label>
            <Input value={departmentName} onChange={e => setDepartmentName(e.target.value)} maxLength={100} autoComplete="off" />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <p className={headClass}>出張期間</p>
        <div className="space-y-2">
          {tripDates.map((r, i) => (
            <div key={i} className="flex gap-2 items-center flex-wrap">
              <span className="text-sm text-gray-600 w-32">{r.label}</span>
              <Input type="date" className="w-44" value={r.date} onChange={e => setTripDates(setAt(tripDates, i, { date: e.target.value }))} />
              <Input type="time" className="w-32" value={r.time} onChange={e => setTripDates(setAt(tripDates, i, { time: e.target.value }))} />
            </div>
          ))}
        </div>
        <label className={labelClass + " mt-4"}>出張区域・用</label>
        <textarea className="w-full min-h-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          value={areaPurpose} onChange={e => setAreaPurpose(e.target.value)} maxLength={1000} />
      </div>

      <div className={cardClass}>
        <p className={headClass}>交通費</p>
        <div className="space-y-2">
          {transport.map((r, i) => (
            <div key={i} className="flex gap-2">
              <Input className="flex-1" placeholder="区間（例：東京〜静岡）" value={r.section} maxLength={100} autoComplete="off"
                onChange={e => setTransport(setAt(transport, i, { section: e.target.value }))} />
              <Input className="w-36 text-right" inputMode="numeric" placeholder="金額" value={r.amount} autoComplete="off"
                onChange={e => setTransport(setAt(transport, i, { amount: digits(e.target.value) }))} />
            </div>
          ))}
        </div>
        <p className="text-right text-sm mt-3">小計　<span className="font-bold">{yen(transportSubtotal)}</span></p>
      </div>

      <div className={cardClass}>
        <p className={headClass}>宿泊費</p>
        <div className="space-y-2">
          {lodging.map((r, i) => (
            <div key={i} className="flex gap-2">
              <Input className="flex-1" placeholder="宿泊先" value={r.name} maxLength={100} autoComplete="off"
                onChange={e => setLodging(setAt(lodging, i, { name: e.target.value }))} />
              <Input className="w-24 text-right" inputMode="numeric" placeholder="泊数" value={r.nights} autoComplete="off"
                onChange={e => setLodging(setAt(lodging, i, { nights: digits(e.target.value) }))} />
              <Input className="w-36 text-right" inputMode="numeric" placeholder="金額" value={r.amount} autoComplete="off"
                onChange={e => setLodging(setAt(lodging, i, { amount: digits(e.target.value) }))} />
            </div>
          ))}
        </div>
        <p className="text-right text-sm mt-3">小計　<span className="font-bold">{yen(lodgingSubtotal)}</span></p>
      </div>

      <div className={cardClass}>
        <p className={headClass}>日当</p>
        <div className="space-y-2">
          {allowance.map((r, i) => (
            <div key={i} className="flex gap-2">
              <Input className="w-24 text-right" inputMode="numeric" placeholder="日数" value={r.days} autoComplete="off"
                onChange={e => setAllowance(setAt(allowance, i, { days: digits(e.target.value) }))} />
              <Input className="w-36 text-right" inputMode="numeric" placeholder="金額" value={r.amount} autoComplete="off"
                onChange={e => setAllowance(setAt(allowance, i, { amount: digits(e.target.value) }))} />
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
        <Button variant="outline" disabled={saving} onClick={() => router.push("/dashboard/eapp/accounting")}>キャンセル</Button>
        <Button variant="outline" disabled={saving} onClick={() => save(false)}>下書き保存</Button>
        <Button disabled={saving} onClick={() => save(true)}>申請する</Button>
      </div>
    </div>
  )
}
