"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import SendMailDialog from "@/components/accounting/send-mail-dialog"
import {
  PC_ROLE_CONFIRMER, PC_ROLE_ISMS, PC_STATUS_RETURNED, PC_STATUS_REJECTED, PC_MAX_PERIOD_DAYS,
  formatPcRequestNo, pcStatusBadgeClass,
} from "@/lib/pc-takeout"

type Step = {
  id: string; role: string; step_order: number; position_name: string | null
  approver_name: string | null; status: string; approved_at: string | null; inkan_image_url: string | null
}
type History = { id: string; action: string; actor_name: string; comment: string | null; created_at: string }
type Detail = {
  id: string; request_no: number; status: string; request_date: string
  requester_name: string; department_name: string | null; reason: string
  period_start: string | null; period_end: string | null
  device_name: string | null; model_label: string | null
  accessories: unknown; software: unknown
  requester_inkan_url: string | null
  approval_steps: Step[]; histories: History[]
  is_owner: boolean; approvable_step_id: string | null
  can_edit: boolean; can_delete: boolean; can_withdraw: boolean
}

const fmtDate = (s: string | null) => (s ? s.slice(0, 10).replace(/-/g, "/") : "—")
const fmtDateTime = (s: string) => {
  const d = new Date(s)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`
}
const list = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : [])
const periodDays = (s: string | null, e: string | null) => {
  if (!s || !e) return null
  const n = Math.round((Date.parse(`${e.slice(0, 10)}T00:00:00Z`) - Date.parse(`${s.slice(0, 10)}T00:00:00Z`)) / 86400000) + 1
  return isNaN(n) ? null : n
}

export default function PcTakeoutDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [req, setReq] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState("")
  const [decision, setDecision] = useState<{ stepId: string; action: "return" | "reject" } | null>(null)
  const [reason, setReason] = useState("")
  const [approveStepId, setApproveStepId] = useState<string | null>(null)
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false)

  const load = async () => {
    const res = await fetch(`/api/eapp/pc-takeout/${id}`)
    if (res.status === 404) { setNotFound(true); setLoading(false); return }
    if (res.ok) setReq(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [id])

  const run = async (url: string, method: string, body?: unknown): Promise<boolean> => {
    setBusy(true)
    setActionError("")
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setActionError(data.error || "操作に失敗しました"); return false }
      return true
    } finally {
      setBusy(false)
    }
  }

  // 次の順序の承認者の名前（今の順序が、自分の承認で完了するときだけ。最後の承認のときは、null）
  const nextApproverNames = (stepId: string): string[] | null => {
    if (!req) return null
    const mine = req.approval_steps.find(s => s.id === stepId)
    if (!mine) return null
    const others = req.approval_steps.filter(s => s.id !== stepId && s.status !== "承認済み")
    if (others.some(s => s.step_order === mine.step_order)) return null
    if (others.length === 0) return null
    const nextOrder = Math.min(...others.map(s => s.step_order))
    return others.filter(s => s.step_order === nextOrder).map(s => s.approver_name ?? "—")
  }

  const startApprove = async (stepId: string) => {
    if (nextApproverNames(stepId)) { setApproveStepId(stepId); return }
    if (!confirm("この内容を承認しますか？")) return
    await doApprove(stepId, false)
  }
  const doApprove = async (stepId: string, sendMail: boolean) => {
    setApproveStepId(null)
    if (await run(`/api/eapp/pc-takeout/${id}/approval-steps/${stepId}/approve`, "POST", { send_mail: sendMail })) await load()
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
    const ok = await run(`/api/eapp/pc-takeout/${id}/approval-steps/${decision.stepId}/decision`, "POST", { action: decision.action, comment: reason, send_mail: sendMail })
    if (ok) { setDecision(null); setReason(""); await load() }
  }
  const withdraw = async () => {
    if (!confirm("取り下げると、承認の進み具合は消えて、下書きに戻ります。取り下げますか？")) return
    if (await run(`/api/eapp/pc-takeout/${id}/withdraw`, "POST")) await load()
  }
  const remove = async () => {
    if (!confirm("この下書きを削除しますか？元に戻せません。")) return
    if (await run(`/api/eapp/pc-takeout/${id}`, "DELETE")) router.push("/dashboard/eapp/pc-takeout")
  }

  const back = (
    <Link href="/dashboard/eapp/pc-takeout" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
      <ChevronLeft className="w-4 h-4" />PC持ち出し申請の一覧に戻る
    </Link>
  )

  if (loading) return <div className="p-6"><p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p></div>
  if (notFound || !req) {
    return <div className="p-6 max-w-3xl mx-auto">{back}<p className="text-center text-gray-500 py-8">申請が見つかりません。</p></div>
  }

  const lastDecision = [...req.histories].reverse().find(h => h.action === "差戻し" || h.action === "却下")
  const showReason = (req.status === PC_STATUS_RETURNED || req.status === PC_STATUS_REJECTED) && !!lastDecision?.comment
  const days = periodDays(req.period_start, req.period_end)
  const overDays = days !== null && days > PC_MAX_PERIOD_DAYS
  const confirmerStep = req.approval_steps.find(s => s.role === PC_ROLE_CONFIRMER)
  const ismsStep = req.approval_steps.find(s => s.role === PC_ROLE_ISMS)
  const cardClass = "bg-white border rounded-lg p-5 mb-4 shadow-sm"
  const headClass = "text-sm font-bold text-gray-700 mb-2"
  const accessories = list(req.accessories)
  const software = list(req.software)

  // 押印の枠：名前と、承認済みの印影
  const StampBox = ({ title, name, url, done }: { title: string; name: string | null; url: string | null; done: boolean }) => (
    <div className="border border-gray-800 w-24 text-center">
      <div className="border-b border-gray-800 text-xs py-1 bg-gray-50">{title}</div>
      <div className="h-20 flex items-center justify-center">
        {done && url ? <img src={url} alt={`${title}の印影`} className="w-14 h-14 object-contain" /> : done ? <span className="text-xs text-gray-500">{name ?? "承認済み"}</span> : null}
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-3xl mx-auto">
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
          message="申請者に、結果と理由をメールで知らせますか。"
          actionLabel={`${decision.action === "return" ? "差戻し" : "却下"}を実行する`} busy={busy}
          onSelect={sendMail => doDecision(sendMail)}
          onCancel={() => setDecisionDialogOpen(false)} />
      )}

      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <p className="text-xs text-gray-400">PC持ち出し申請</p>
          <h1 className="text-2xl font-bold mt-1">{formatPcRequestNo(req.request_no)}</h1>
        </div>
        <span className={`text-xs px-2 py-1 rounded shrink-0 ${pcStatusBadgeClass(req.status)}`}>{req.status}</span>
      </div>

      {(req.can_edit || req.can_withdraw || req.can_delete) && (
        <div className="flex gap-2 mb-4">
          {req.can_edit && (
            <Link href={`/dashboard/eapp/pc-takeout/${id}/edit`}>
              <Button variant="outline" size="sm" className="flex items-center gap-1"><Pencil className="w-3.5 h-3.5" />編集</Button>
            </Link>
          )}
          {req.can_withdraw && <Button variant="outline" size="sm" disabled={busy} onClick={withdraw}>取り下げる</Button>}
          {req.can_delete && <Button variant="outline" size="sm" disabled={busy} onClick={remove} className="text-red-600">削除</Button>}
        </div>
      )}

      {actionError && <p className="mb-4 text-sm px-4 py-2 rounded bg-red-50 text-red-600">{actionError}</p>}
      {showReason && (
        <div className="mb-4 text-sm px-4 py-3 rounded bg-orange-50 text-orange-800">
          <p className="font-bold mb-1">{req.status}の理由（{lastDecision!.actor_name}）</p>
          <p className="whitespace-pre-wrap">{lastDecision!.comment}</p>
        </div>
      )}

      <div className={cardClass}>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div><dt className="text-gray-500">申請日</dt><dd>{fmtDate(req.request_date)}</dd></div>
          <div><dt className="text-gray-500">申請者氏名</dt><dd className="font-medium">{req.requester_name}</dd></div>
          <div className="sm:col-span-2"><dt className="text-gray-500">所属部署</dt><dd>{req.department_name || "—"}</dd></div>
        </dl>
      </div>

      <div className={cardClass}>
        <p className={headClass}>申請理由</p>
        <p className="text-sm whitespace-pre-wrap">{req.reason || "—"}</p>
      </div>

      <div className={cardClass}>
        <p className={headClass}>持出期間</p>
        <p className="text-sm">{fmtDate(req.period_start)} ～ {fmtDate(req.period_end)}{days !== null && <span className="ml-2 text-gray-500">（{days}日間）</span>}</p>
        {overDays && <p className="mt-2 text-xs px-3 py-2 rounded bg-amber-50 text-amber-700">原則最長1週間を超える持出期間です。</p>}
      </div>

      <div className={cardClass}>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div><dt className="text-gray-500">PC管理番号</dt><dd className="font-medium">{req.device_name || "—"}</dd></div>
          <div><dt className="text-gray-500">メーカー・型番</dt><dd>{req.model_label || "—"}</dd></div>
          <div><dt className="text-gray-500">付属品</dt><dd>{accessories.length > 0 ? accessories.join("、") : "なし"}</dd></div>
          <div><dt className="text-gray-500">必要ソフト</dt><dd>{software.length > 0 ? software.join("、") : "なし"}</dd></div>
        </dl>
      </div>

      <div className={cardClass}>
        <p className={headClass}>承認</p>
        <div className="flex justify-between items-end">
          <StampBox title={ismsStep?.position_name || PC_ROLE_ISMS} name={ismsStep?.approver_name ?? null} url={ismsStep?.inkan_image_url ?? null} done={ismsStep?.status === "承認済み"} />
          <div className="flex gap-0">
            {confirmerStep && (
              <StampBox title="確認者" name={confirmerStep.approver_name} url={confirmerStep.inkan_image_url} done={confirmerStep.status === "承認済み"} />
            )}
            <StampBox title="申請者" name={req.requester_name} url={req.requester_inkan_url} done={req.status !== "下書き"} />
          </div>
        </div>

        {req.approval_steps.length > 0 && (
          <div className="mt-4 space-y-1">
            {req.approval_steps.map(s => (
              <div key={s.id} className="flex items-center gap-3 text-sm border-b border-gray-100 py-1.5">
                <span className="text-xs text-gray-400 w-6">{s.step_order}</span>
                <span className="w-24 text-gray-500">{s.position_name || s.role}</span>
                <span className="flex-1">{s.approver_name ?? "—"}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${s.status === "承認済み" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>{s.status}</span>
                {s.id === req.approvable_step_id && (
                  <span className="flex gap-2">
                    <Button size="sm" disabled={busy} onClick={() => startApprove(s.id)}>承認</Button>
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => { setDecision({ stepId: s.id, action: "return" }); setReason("") }}>差戻し</Button>
                    <Button size="sm" variant="outline" disabled={busy} className="text-red-600" onClick={() => { setDecision({ stepId: s.id, action: "reject" }); setReason("") }}>却下</Button>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {decision && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <p className="text-sm font-medium text-slate-700">{decision.action === "return" ? "差戻し" : "却下"}の理由（必須）</p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} maxLength={1000}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" autoComplete="off" />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" disabled={busy} onClick={() => { setDecision(null); setReason(""); setActionError("") }}>やめる</Button>
              <Button size="sm" disabled={busy} onClick={submitDecision}>{decision.action === "return" ? "差戻す" : "却下する"}</Button>
            </div>
          </div>
        )}
      </div>

      <div className={cardClass}>
        <p className={headClass}>履歴</p>
        {req.histories.length === 0 ? (
          <p className="text-sm text-gray-400">履歴がありません</p>
        ) : (
          <div className="space-y-1">
            {req.histories.map(h => (
              <div key={h.id} className="text-sm">
                <div className="flex gap-3 py-1">
                  <span className="text-xs text-gray-400 w-32 shrink-0">{fmtDateTime(h.created_at)}</span>
                  <span className="w-16 shrink-0 font-medium">{h.action}</span>
                  <span className="text-gray-600">{h.actor_name}</span>
                </div>
                {h.comment && <p className="text-xs text-gray-500 mb-1 ml-[8.75rem] whitespace-pre-wrap">{h.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
