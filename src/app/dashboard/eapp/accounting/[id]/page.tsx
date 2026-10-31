"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { slipTypeLabel, statusBadgeClass } from "@/lib/accounting-slip-types"

type Step = { id: string; stage: string; step_order: number; position_name: string | null; approver_name: string | null; status: string; approved_at: string | null }
type Trip = {
  account_name: string; account_code: string; tax_category: string; area_purpose: string | null
  trip_dates: { label: string; date: string; time: string }[] | null
  transport_items: { section: string; amount: number }[] | null
  lodging_items: { name: string; nights: number; amount: number }[] | null
  allowance_items: { days: number; amount: number }[] | null
  transport_subtotal: number; lodging_subtotal: number; allowance_subtotal: number; total_amount: number
}
type Slip = {
  id: string; slip_no: number; slip_type: string; title: string; status: string
  slip_date: string; amount: number; requester_name: string; department_name: string | null
  submitted_at: string | null; created_at: string
  approval_steps: Step[]; trip_expense: Trip | null; is_owner: boolean; approvable_step_id: string | null
}

const yen = (n: number) => `${n.toLocaleString()}円`
const fmtDate = (s: string | null) => (s ? s.slice(0, 10).replace(/-/g, "/") : "—")
const fmtDateTime = (s: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export default function AccountingSlipDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [slip, setSlip] = useState<Slip | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [approving, setApproving] = useState(false)
  const [actionError, setActionError] = useState("")

  const load = async () => {
    const res = await fetch(`/api/eapp/accounting/slips/${id}`)
    if (res.status === 404) setNotFound(true)
    else if (res.ok) setSlip(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [id])

  const approve = async (stepId: string) => {
    if (!confirm("この内容を承認しますか？")) return
    setApproving(true)
    setActionError("")
    try {
      const res = await fetch(`/api/eapp/accounting/slips/${id}/approval-steps/${stepId}/approve`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "承認に失敗しました")
      await load()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setApproving(false)
    }
  }

  const back = (
    <Link href="/dashboard/eapp/accounting" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
      <ChevronLeft className="w-4 h-4" />経理精算の一覧に戻る
    </Link>
  )

  if (loading) return <div className="p-6"><p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p></div>
  if (notFound || !slip) {
    return <div className="p-6 max-w-4xl mx-auto">{back}<p className="text-center text-gray-500 py-8">伝票が見つかりません。</p></div>
  }

  const t = slip.trip_expense
  const cardClass = "bg-white border rounded-lg p-4 mb-4 shadow-sm"
  const headClass = "text-sm font-bold text-gray-700 mb-3"
  const rowClass = "flex justify-between gap-4 py-1.5 border-b border-gray-100 text-sm"
  const dash = <span className="text-gray-300">—</span>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {back}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <p className="text-xs text-gray-400">{slipTypeLabel(slip.slip_type)}　伝票番号 {slip.slip_no}</p>
          <h1 className="text-2xl font-bold mt-1">{slip.title}</h1>
        </div>
        <span className={`text-xs px-2 py-1 rounded shrink-0 ${statusBadgeClass(slip.status)}`}>{slip.status}</span>
      </div>

      <div className={cardClass}>
        <div className="grid gap-x-6 sm:grid-cols-2">
          <div className={rowClass}><span className="text-gray-500">日付</span><span>{fmtDate(slip.slip_date)}</span></div>
          <div className={rowClass}><span className="text-gray-500">起案者</span><span>{slip.requester_name}</span></div>
          <div className={rowClass}><span className="text-gray-500">部署</span><span>{slip.department_name ?? dash}</span></div>
          <div className={rowClass}><span className="text-gray-500">申請日時</span><span>{fmtDateTime(slip.submitted_at)}</span></div>
          {t && <div className={rowClass}><span className="text-gray-500">勘定科目</span><span>{t.account_name}　{t.account_code}</span></div>}
          {t && <div className={rowClass}><span className="text-gray-500">課税区分</span><span>{t.tax_category}</span></div>}
        </div>
      </div>

      {t && (
        <>
          <div className={cardClass}>
            <p className={headClass}>出張期間</p>
            {(t.trip_dates ?? []).length === 0 ? dash : (t.trip_dates ?? []).map((r, i) => (
              <div key={i} className={rowClass}><span className="text-gray-500">{r.label}</span><span>{fmtDate(r.date || null)}　{r.time}</span></div>
            ))}
            <p className="text-xs text-gray-500 mt-4 mb-1">出張区域・用</p>
            <p className="text-sm whitespace-pre-wrap">{t.area_purpose || "—"}</p>
          </div>

          <div className={cardClass}>
            <p className={headClass}>交通費</p>
            {(t.transport_items ?? []).length === 0 ? dash : (t.transport_items ?? []).map((r, i) => (
              <div key={i} className={rowClass}><span>{r.section || "—"}</span><span>{yen(r.amount)}</span></div>
            ))}
            <p className="text-right text-sm mt-3">小計　<span className="font-bold">{yen(t.transport_subtotal)}</span></p>
          </div>

          <div className={cardClass}>
            <p className={headClass}>宿泊費</p>
            {(t.lodging_items ?? []).length === 0 ? dash : (t.lodging_items ?? []).map((r, i) => (
              <div key={i} className={rowClass}><span>{r.name || "—"}　{r.nights}泊</span><span>{yen(r.amount)}</span></div>
            ))}
            <p className="text-right text-sm mt-3">小計　<span className="font-bold">{yen(t.lodging_subtotal)}</span></p>
          </div>

          <div className={cardClass}>
            <p className={headClass}>日当</p>
            {(t.allowance_items ?? []).length === 0 ? dash : (t.allowance_items ?? []).map((r, i) => (
              <div key={i} className={rowClass}><span>{r.days}日</span><span>{yen(r.amount)}</span></div>
            ))}
            <p className="text-right text-sm mt-3">小計　<span className="font-bold">{yen(t.allowance_subtotal)}</span></p>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 mb-4 flex items-center justify-between">
            <span className="font-bold text-gray-700">精算合計</span>
            <span className="text-xl font-bold">{yen(t.total_amount)}</span>
          </div>
        </>
      )}

      <div className={cardClass}>
        <p className={headClass}>承認</p>
        {actionError && <p className="mb-2 text-sm px-3 py-2 rounded bg-red-50 text-red-600">{actionError}</p>}
        {slip.approval_steps.length === 0 ? (
          <p className="text-sm text-gray-400">まだ申請されていません（下書きです）。</p>
        ) : (
          <div className="space-y-1">
            {slip.approval_steps.map(s => (
              <div key={s.id} className="flex items-center gap-3 text-sm border-b border-gray-100 py-2">
                <span className="text-xs text-slate-500 w-6">{s.step_order}</span>
                <span className="text-xs text-gray-400 w-14">{s.stage}</span>
                <span className="text-xs text-gray-400 w-24">{s.position_name ?? "—"}</span>
                <span className="flex-1">{s.approver_name ?? "—"}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${s.status === "承認済み" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{s.status}</span>
                <span className="text-xs text-gray-400 w-32 text-right">{s.approved_at ? fmtDateTime(s.approved_at) : ""}</span>
                {s.id === slip.approvable_step_id && (
                  <button disabled={approving} onClick={() => approve(s.id)}
                    className="text-xs px-3 py-1 bg-slate-700 text-white rounded hover:bg-slate-800 disabled:opacity-50">承認する</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
