"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import SendMailDialog from "@/components/accounting/send-mail-dialog"
import { openAccountingFile } from "@/lib/accounting-slip-files-client"
import { slipTypeLabel, statusBadgeClass } from "@/lib/accounting-slip-types"

type Step = { id: string; stage: string; step_order: number; position_name: string | null; approver_name: string | null; status: string; approved_at: string | null }
type History = { id: string; action: string; actor_name: string; comment: string | null; created_at: string }
type Trip = {
  account_name: string; account_code: string; tax_category: string; area_purpose: string | null
  trip_area: string | null; trip_purpose: string | null
  trip_dates: { label: string; date: string; time: string }[] | null
  transport_items: { category?: string; section: string; amount: number }[] | null
  lodging_items: { name: string; nights: number; amount: number }[] | null
  allowance_items: { days: number; amount: number }[] | null
  transport_subtotal: number; lodging_subtotal: number; allowance_subtotal: number; total_amount: number
}
type MealItemView = {
  type?: string; payee?: string; address?: string; meal_date?: string; tel?: string; kind?: string
  headcount?: number; participants?: string; item?: string; amount: number
  account_name?: string; account_code?: string; tax_category?: string
}
type Meal = {
  purpose: string | null; remarks: string | null; items: MealItemView[] | null
  subtotal: number; advance_amount: number; shortage_amount: number; balance_amount: number
  shortage_account_name: string | null
}
type Slip = {
  id: string; slip_no: number; slip_type: string; title: string; status: string
  slip_date: string; amount: number; requester_name: string; department_code: string | null; department_name: string | null
  submitted_at: string | null; created_at: string
  approval_steps: Step[]; histories: History[]; trip_expense: Trip | null; meal_advance: Meal | null
  files: { id: string; file_name: string; file_type: string; uploaded_at: string }[]
  is_owner: boolean; approvable_step_id: string | null
  can_edit: boolean; can_delete: boolean; can_withdraw: boolean; can_pdf: boolean
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
  const router = useRouter()
  const [slip, setSlip] = useState<Slip | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState("")
  const [decision, setDecision] = useState<{ stepId: string; action: "return" | "reject" } | null>(null)
  const [reason, setReason] = useState("")
  const [approveStepId, setApproveStepId] = useState<string | null>(null)
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false)

  const load = async () => {
    const res = await fetch(`/api/eapp/accounting/slips/${id}`)
    if (res.status === 404) setNotFound(true)
    else if (res.ok) setSlip(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [id])

  // 操作のAPIを呼ぶ共通処理。失敗したときは、メッセージを出して、画面を最新に更新する
  const run = async (url: string, method: string, body?: unknown): Promise<boolean> => {
    setBusy(true)
    setActionError("")
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "操作に失敗しました")
      return true
    } catch (e: any) {
      setActionError(e.message)
      await load()
      return false
    } finally {
      setBusy(false)
    }
  }

  // 承認したあと、次の順序に進むときだけ、次の承認者へ依頼メールを送る。その場合は3択、そうでなければ普通の確認
  const nextApproverNames = (stepId: string): string[] | null => {
    if (!slip) return null
    const me = slip.approval_steps.find(s => s.id === stepId)
    if (!me) return null
    const remaining = slip.approval_steps.filter(s => s.id !== stepId && s.status !== "承認済み")
    if (remaining.length === 0 || remaining.some(s => s.step_order === me.step_order)) return null
    const nextOrder = Math.min(...remaining.map(s => s.step_order))
    return remaining.filter(s => s.step_order === nextOrder).map(s => s.approver_name ?? "未設定")
  }
  const startApprove = async (stepId: string) => {
    if (nextApproverNames(stepId)) { setApproveStepId(stepId); return }
    if (!confirm("この内容を承認しますか？")) return
    await doApprove(stepId, false)
  }
  const doApprove = async (stepId: string, sendMail: boolean) => {
    setApproveStepId(null)
    if (await run(`/api/eapp/accounting/slips/${id}/approval-steps/${stepId}/approve`, "POST", { send_mail: sendMail })) await load()
  }
  const submitDecision = () => {
    if (!decision) return
    if (!reason.trim()) { setActionError("理由を入力してください"); return }
    setActionError("")
    setDecisionDialogOpen(true)
  }
  const doDecision = async (sendMail: boolean) => {
    if (!decision) return
    setDecisionDialogOpen(false)
    const ok = await run(`/api/eapp/accounting/slips/${id}/approval-steps/${decision.stepId}/decision`, "POST", { action: decision.action, comment: reason, send_mail: sendMail })
    if (ok) { setDecision(null); setReason(""); await load() }
  }
  const withdraw = async () => {
    if (!confirm("取り下げると、承認の進み具合は消えて、下書きに戻ります。取り下げますか？")) return
    if (await run(`/api/eapp/accounting/slips/${id}/withdraw`, "POST")) await load()
  }
  const remove = async () => {
    if (!confirm("この下書きを削除しますか？元に戻せません。")) return
    if (await run(`/api/eapp/accounting/slips/${id}`, "DELETE")) router.push("/dashboard/eapp/accounting")
  }

  const openFile = async (fileId: string) => {
    const err = await openAccountingFile(id, fileId)
    if (err) setActionError(err)
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
  const m = slip.meal_advance
  const mealItems = (m?.items ?? []).filter(x => x.type !== "other")
  const otherItems = (m?.items ?? []).filter(x => x.type === "other")
  const acct = (x: MealItemView) => [x.account_name, x.account_code, x.tax_category].filter(Boolean).join("　") || "—"
  const lastDecision = [...slip.histories].reverse().find(h => h.action === "差戻し" || h.action === "却下")
  const showReason = (slip.status === "差戻し" || slip.status === "却下") && !!lastDecision?.comment
  const cardClass = "bg-white border rounded-lg p-4 mb-4 shadow-sm"
  const headClass = "text-sm font-bold text-gray-700 mb-3"
  const rowClass = "flex justify-between gap-4 py-1.5 border-b border-gray-100 text-sm"
  const dash = <span className="text-gray-300">—</span>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {back}
      {approveStepId && (
        <SendMailDialog title="承認の確認"
          message={`次の承認者（${(nextApproverNames(approveStepId) ?? []).join("、")}）に、承認依頼のメールを送りますか。`}
          actionLabel="承認する" busy={busy}
          onSelect={sendMail => doApprove(approveStepId, sendMail)}
          onCancel={() => setApproveStepId(null)} />
      )}
      {decisionDialogOpen && decision && (
        <SendMailDialog title={`${decision.action === "return" ? "差戻し" : "却下"}の確認`}
          message="起案者に、結果と理由をメールで知らせますか。"
          actionLabel={`${decision.action === "return" ? "差戻し" : "却下"}を実行する`} busy={busy}
          onSelect={sendMail => doDecision(sendMail)}
          onCancel={() => setDecisionDialogOpen(false)} />
      )}
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <p className="text-xs text-gray-400">{slipTypeLabel(slip.slip_type)}　伝票番号 {slip.slip_no}</p>
          <h1 className="text-2xl font-bold mt-1">{slip.title}</h1>
        </div>
        <span className={`text-xs px-2 py-1 rounded shrink-0 ${statusBadgeClass(slip.status)}`}>{slip.status}</span>
      </div>

      {(slip.can_edit || slip.can_withdraw || slip.can_delete || slip.can_pdf) && (
        <div className="flex gap-2 mb-4">
          {slip.can_pdf && (
            <a href={`/api/eapp/accounting/slips/${id}/pdf`} target="_blank" rel="noopener noreferrer">
              <Button size="sm">PDFを開く</Button>
            </a>
          )}
          {slip.can_edit && (
            <Link href={`/dashboard/eapp/accounting/${id}/edit`}>
              <Button size="sm">{slip.status === "差戻し" ? "直して再申請する" : "編集・申請する"}</Button>
            </Link>
          )}
          {slip.can_withdraw && <Button variant="outline" size="sm" disabled={busy} onClick={withdraw}>取り下げる</Button>}
          {slip.can_delete && <Button variant="outline" size="sm" disabled={busy} onClick={remove} className="text-red-600">削除</Button>}
        </div>
      )}

      {actionError && <p className="mb-4 text-sm px-4 py-2 rounded bg-red-50 text-red-600">{actionError}</p>}

      {showReason && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${slip.status === "却下" ? "border-red-200 bg-red-50 text-red-800" : "border-orange-200 bg-orange-50 text-orange-800"}`}>
          <p className="font-bold mb-1">{slip.status}の理由（{lastDecision!.actor_name}）</p>
          <p className="whitespace-pre-wrap">{lastDecision!.comment}</p>
        </div>
      )}

      <div className={cardClass}>
        <div className="grid gap-x-6 sm:grid-cols-2">
          <div className={rowClass}><span className="text-gray-500">日付</span><span>{fmtDate(slip.slip_date)}</span></div>
          <div className={rowClass}><span className="text-gray-500">起案者</span><span>{slip.requester_name}</span></div>
          <div className={rowClass}><span className="text-gray-500">部署</span><span>{[slip.department_code, slip.department_name].filter(Boolean).join(" ") || dash}</span></div>
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
          </div>

          <div className={cardClass}>
            <p className={headClass}>出張区域・目的</p>
            {t.trip_area || t.trip_purpose ? (
              <>
                <div className={rowClass}><span className="text-gray-500">出張区域</span><span>{t.trip_area || "—"}</span></div>
                <div className={rowClass}><span className="text-gray-500">出張目的</span><span>{t.trip_purpose || "—"}</span></div>
              </>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{t.area_purpose || "—"}</p>
            )}
          </div>

          <div className={cardClass}>
            <p className={headClass}>交通費</p>
            {(t.transport_items ?? []).length === 0 ? dash : (t.transport_items ?? []).map((r, i) => (
              <div key={i} className={rowClass}><span>{r.category && <span className="text-gray-500 mr-2">{r.category}</span>}{r.section || "—"}</span><span>{yen(r.amount)}</span></div>
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

      {m && (
        <>
          <div className={cardClass}>
            <p className={headClass}>使途内容</p>
            <p className="text-sm whitespace-pre-wrap">{m.purpose || dash}</p>
          </div>
          <div className={cardClass}>
            <p className={headClass}>飲食費</p>
            {mealItems.length === 0 ? dash : mealItems.map((r, i) => (
              <div key={i} className="border rounded-md p-3 mb-3 text-sm">
                <p className="font-bold text-gray-700 mb-1">飲食費{["A", "B"][i]}</p>
                <div className={rowClass}><span className="text-gray-500">支払先名</span><span>{r.payee || "—"}</span></div>
                <div className={rowClass}><span className="text-gray-500">種別</span><span>{r.kind || "—"}</span></div>
                <div className={rowClass}><span className="text-gray-500">住所</span><span>{r.address || "—"}</span></div>
                <div className={rowClass}><span className="text-gray-500">飲食日</span><span>{fmtDate(r.meal_date ?? null)}</span></div>
                <div className={rowClass}><span className="text-gray-500">TEL</span><span>{r.tel || "—"}</span></div>
                <div className={rowClass}><span className="text-gray-500">参加人数</span><span>{r.headcount ? `${r.headcount}名` : "—"}</span></div>
                <div className={rowClass}><span className="text-gray-500">参加者名</span><span>{r.participants || "—"}</span></div>
                <div className={rowClass}><span className="text-gray-500">金額</span><span className="font-bold">{yen(r.amount)}</span></div>
                <div className={rowClass}><span className="text-gray-500">勘定科目・区分</span><span>{acct(r)}</span></div>
              </div>
            ))}
          </div>
          <div className={cardClass}>
            <p className={headClass}>その他の精算</p>
            {otherItems.length === 0 ? dash : otherItems.map((r, i) => (
              <div key={i} className={rowClass}>
                <span>{["C", "D", "E"][i]}　{r.item || "—"}<span className="text-gray-400 text-xs ml-3">{acct(r)}</span></span>
                <span className="font-bold">{yen(r.amount)}</span>
              </div>
            ))}
          </div>
          {m.remarks && (
            <div className={cardClass}>
              <p className={headClass}>備考</p>
              <p className="text-sm whitespace-pre-wrap">{m.remarks}</p>
            </div>
          )}
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700">小計</span>
              <span className="text-xl font-bold">{yen(m.subtotal)}</span>
            </div>
            <div className="flex gap-6 justify-end mt-2 text-sm text-gray-600">
              <span>仮払金　<span className="font-bold">{yen(m.advance_amount)}</span></span>
              <span>不足金　<span className="font-bold">{yen(m.shortage_amount)}</span></span>
              <span>残金　<span className="font-bold">{yen(m.balance_amount)}</span></span>
            </div>
          </div>
        </>
      )}

      <div className={cardClass}>
        <p className={headClass}>添付ファイル</p>
        {slip.files.length === 0 ? (
          <p className="text-sm text-gray-400">添付はありません。</p>
        ) : (
          <div className="space-y-1">
            {slip.files.map(f => (
              <div key={f.id} className="flex items-center gap-3 text-sm border-b border-gray-100 py-2">
                <span className="flex-1 truncate">{f.file_name}</span>
                <button onClick={() => openFile(f.id)} className="text-xs text-blue-500 hover:text-blue-700">開く</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={cardClass}>
        <p className={headClass}>承認</p>
        {slip.approval_steps.length === 0 ? (
          <p className="text-sm text-gray-400">まだ申請されていません（下書きです）。</p>
        ) : (
          <div className="space-y-1">
            {slip.approval_steps.map(s => (
              <div key={s.id} className="flex items-center gap-3 text-sm border-b border-gray-100 py-2 flex-wrap">
                <span className="text-xs text-slate-500 w-6">{s.step_order}</span>
                <span className="text-xs text-gray-400 w-14">{s.stage}</span>
                <span className="text-xs text-gray-400 w-24">{s.position_name ?? "—"}</span>
                <span className="flex-1">{s.approver_name ?? "—"}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${s.status === "承認済み" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{s.status}</span>
                <span className="text-xs text-gray-400 w-32 text-right">{s.approved_at ? fmtDateTime(s.approved_at) : ""}</span>
                {s.id === slip.approvable_step_id && (
                  <div className="flex gap-1">
                    <button disabled={busy} onClick={() => startApprove(s.id)}
                      className="text-xs px-3 py-1 bg-slate-700 text-white rounded hover:bg-slate-800 disabled:opacity-50">承認する</button>
                    <button disabled={busy} onClick={() => { setDecision({ stepId: s.id, action: "return" }); setReason(""); setActionError("") }}
                      className="text-xs px-3 py-1 border border-orange-300 text-orange-700 rounded hover:bg-orange-50 disabled:opacity-50">差戻し</button>
                    <button disabled={busy} onClick={() => { setDecision({ stepId: s.id, action: "reject" }); setReason(""); setActionError("") }}
                      className="text-xs px-3 py-1 border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-50">却下</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {decision && (
          <div className="mt-3 p-3 rounded-lg bg-slate-50 border">
            <p className="text-sm font-medium mb-2">{decision.action === "return" ? "差戻し" : "却下"}の理由（必須）</p>
            <textarea className="w-full min-h-20 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              value={reason} onChange={e => setReason(e.target.value)} maxLength={1000} />
            {decision.action === "reject" && <p className="text-xs text-gray-500 mt-1">却下した伝票は終了です。再申請はできません。</p>}
            <div className="flex gap-2 justify-end mt-2">
              <Button variant="outline" size="sm" disabled={busy} onClick={() => { setDecision(null); setReason("") }}>やめる</Button>
              <Button size="sm" disabled={busy} onClick={submitDecision}>{decision.action === "return" ? "差戻し" : "却下"}を実行</Button>
            </div>
          </div>
        )}
      </div>

      <div className={cardClass}>
        <p className={headClass}>履歴</p>
        {slip.histories.length === 0 ? (
          <p className="text-sm text-gray-400">まだ履歴がありません。</p>
        ) : (
          <div className="space-y-1">
            {slip.histories.map(h => (
              <div key={h.id} className="border-b border-gray-100 py-2 text-sm">
                <div className="flex gap-3 items-center">
                  <span className="text-xs text-gray-400 w-32">{fmtDateTime(h.created_at)}</span>
                  <span className="font-medium w-16">{h.action}</span>
                  <span className="text-gray-600">{h.actor_name}</span>
                </div>
                {h.comment && <p className="text-xs text-gray-500 mt-1 ml-[8.75rem] whitespace-pre-wrap">{h.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
