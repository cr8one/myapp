"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Circle, Download, Trash2, Plus, Pencil } from "lucide-react"
import RingiPaperPreview from "./RingiPaperPreview"

type ApprovalStep = {
  id: string
  stage: string
  step_order: number
  position_name: string | null
  category?: string | null
  approver_name: string | null
  approver_email: string | null
  status: string
  approved_at: string | null
}
type RingiFile = {
  id: string
  file_key: string
  file_name: string
}
type Ringi = {
  id: string
  title: string
  content: string
  destination: string | null
  cost: string | null
  requester_names: string
  requester_user_id: string
  requester_department: string | null
  status: string
  reception_number: string | null
  reception_date: string | null
  decision_date: string | null
  decision_result: string | null
  created_at: string
  files: RingiFile[]
  approval_steps: ApprovalStep[]
  planned_related_steps: { step_order: number; position_name?: string; category?: string; approver_user_id?: string }[] | null
  planned_approval_steps: { step_order: number; position_name?: string; approver_user_id?: string }[] | null
}

type UserOption = { id: string; name: string | null }
type ApprovalStepInput = { step_order: number; position_name: string; approver_user_id: string }
type RelatedStepInput = { step_order: number; position_name: string; approver_user_id: string; category: string }
type PositionOption = { id: string; name: string }

const STAGE_LABEL: Record<string, string> = {
  "起案部": "起案部承認",
  "関連部役員社長": "関連部・役員・社長承認",
}

export default function RingiDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const [data, setData] = useState<Ringi | null>(null)
  const [loading, setLoading] = useState(true)
  const [myEmail, setMyEmail] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [receptionNumber, setReceptionNumber] = useState("")
  const [receptionDate, setReceptionDate] = useState("")
  const [processing, setProcessing] = useState(false)
  const [users, setUsers] = useState<UserOption[]>([])
  const [positions, setPositions] = useState<PositionOption[]>([])

  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ title: "", content: "", requester_names: "", requester_department: "" })
  const [requesterUserId, setRequesterUserId] = useState("")
  const [approvalSteps, setApprovalSteps] = useState<ApprovalStepInput[]>([])
  const [relatedSteps, setRelatedSteps] = useState<RelatedStepInput[]>([])
  const [saving, setSaving] = useState(false)
  const [submitDialog, setSubmitDialog] = useState(false)

  const applyDraftFormFromData = (d: Ringi) => {
    setForm({
      title: d.title ?? "",
      content: d.content ?? "",
      requester_names: d.requester_names ?? "",
      requester_department: d.requester_department ?? "",
    })
    setRequesterUserId(d.requester_user_id ?? "")
    setApprovalSteps((d.planned_approval_steps ?? []).map(s => ({
      step_order: s.step_order,
      position_name: s.position_name ?? "",
      approver_user_id: s.approver_user_id ?? "",
    })))
    setRelatedSteps((d.planned_related_steps ?? []).map(s => ({
      step_order: s.step_order,
      position_name: s.position_name ?? "",
      approver_user_id: s.approver_user_id ?? "",
      category: s.category ?? "",
    })))
  }

  const fetchData = async () => {
    const res = await fetch(`/api/eapp/ringi/${id}`)
    const d = await res.json()
    setData(d)
    if (d.status === "下書き") {
      applyDraftFormFromData(d)
    }
    setLoading(false)
  }
  useEffect(() => {
    fetchData()
    fetch("/api/auth/session").then(r => r.json()).then(s => { setMyEmail(s?.user?.email ?? ""); if (s?.user?.role === "ADMIN") setIsAdmin(true) })
    fetch("/api/users/list").then(r => r.json()).then(setUsers)
    fetch("/api/masters/positions").then(r => r.json()).then(setPositions)
  }, [id])

  const handleDelete = async () => {
    if (!confirm("この稟議書を削除しますか？この操作は取り消せません。")) return
    const res = await fetch(`/api/eapp/ringi/${id}`, { method: "DELETE" })
    if (res.ok) {
      router.push("/dashboard/eapp/ringi")
    } else {
      const data = await res.json()
      alert(data.error ?? "削除に失敗しました")
    }
  }
  const [approveTarget, setApproveTarget] = useState<string | null>(null)
  const [decisionResult, setDecisionResult] = useState("可")
  const [approveIsFinal, setApproveIsFinal] = useState(false)
  const approve = async (stepId: string, sendMail: boolean, isFinal: boolean) => {
    setApproveTarget(null)
    setProcessing(true)
    const res = await fetch(`/api/eapp/ringi/${id}/approval-steps/${stepId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ send_mail: sendMail, decision_result: isFinal ? decisionResult : undefined }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(err.error ?? "承認に失敗しました")
    }
    await fetchData()
    setProcessing(false)
    setDecisionResult("可")
  }


  const [receptionConfirmDialog, setReceptionConfirmDialog] = useState(false)
  const submitReception = async (sendMail: boolean) => {
    setReceptionConfirmDialog(false)
    setProcessing(true)
    const res = await fetch(`/api/eapp/ringi/${id}/reception`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reception_number: receptionNumber, reception_date: receptionDate, send_mail: sendMail }),
    })
    if (!res.ok) {
      alert("受付処理に失敗しました")
    }
    await fetchData()
    setProcessing(false)
  }

  const downloadFile = async (key: string, name: string) => {
    const res = await fetch(`/api/eapp/ringi/${id}/signed-url?key=${encodeURIComponent(key)}`)
    const { url } = await res.json()
    const a = document.createElement("a")
    a.href = url
    a.download = name
    a.click()
  }

  const formatDate = (str: string | null) => {
    if (!str) return "-"
    const d = new Date(str)
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
  }

  const setF = (key: keyof typeof form, value: string) => setForm(f => ({ ...f, [key]: value }))
  const addStep = () => setApprovalSteps(prev => [...prev, { step_order: prev.length > 0 ? Math.max(...prev.map(s => s.step_order)) + 1 : 1, position_name: "", approver_user_id: "" }])
  const updateStep = (idx: number, patch: Partial<ApprovalStepInput>) => setApprovalSteps(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s))
  const removeStep = (idx: number) => setApprovalSteps(prev => prev.filter((_, i) => i !== idx))
  const addRelatedStep = () => setRelatedSteps(prev => [...prev, { step_order: prev.length > 0 ? Math.max(...prev.map(s => s.step_order)) + 1 : 1, position_name: "", approver_user_id: "", category: "" }])
  const updateRelatedStep = (idx: number, patch: Partial<RelatedStepInput>) => setRelatedSteps(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s))
  const removeRelatedStep = (idx: number) => setRelatedSteps(prev => prev.filter((_, i) => i !== idx))

  const handleRequesterChange = async (userId: string) => {
    setRequesterUserId(userId)
    if (!userId) return
    const [userRes, commonRes] = await Promise.all([
      fetch(`/api/users/${userId}/approver-settings?service_type=ringi`),
      fetch(`/api/eapp/masters/approval-routes?service_type=ringi`),
    ])
    const userSteps = await userRes.json()
    const commonSteps = await commonRes.json()
    type RawUserStep = { step_order: number; position?: { name: string }; approver?: { id: string } }
    type RawCommonStep = { step_order: number; category?: string | null; position?: { name: string }; approver?: { id: string } }
    setApprovalSteps(userSteps.map((s: RawUserStep, idx: number) => ({
      step_order: s.step_order ?? idx + 1,
      position_name: s.position?.name ?? "",
      approver_user_id: s.approver?.id ?? "",
    })))
    setRelatedSteps(commonSteps.map((s: RawCommonStep) => ({
      step_order: s.step_order,
      position_name: s.position?.name ?? "",
      approver_user_id: s.approver?.id ?? "",
      category: s.category ?? "",
    })))
  }

  const enterEditMode = () => {
    if (data) applyDraftFormFromData(data)
    setEditMode(true)
  }
  const cancelEditMode = () => {
    if (data) applyDraftFormFromData(data)
    setEditMode(false)
  }

  const saveDraft = async () => {
    setSaving(true)
    await fetch(`/api/eapp/ringi/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, requester_user_id: requesterUserId, planned_related_steps: relatedSteps, planned_approval_steps: approvalSteps, status: "下書き" }),
    })
    await fetchData()
    setSaving(false)
    setEditMode(false)
  }
  const submitRingi = async (sendMail: boolean) => {
    setSubmitDialog(false)
    setSaving(true)
    await fetch(`/api/eapp/ringi/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, requester_user_id: requesterUserId, planned_related_steps: relatedSteps, planned_approval_steps: approvalSteps, status: "起案部承認中", approval_steps: approvalSteps, send_mail: sendMail }),
    })
    await fetchData()
    setSaving(false)
    setEditMode(false)
  }

  if (loading || !data) return <div className="p-8 text-gray-400">読み込み中...</div>

  const isDraft = data.status === "下書き"
  const isEditing = isDraft && editMode
  const stages = ["起案部", "関連部役員社長"] as const
  const labelCls = "text-xs font-medium text-gray-500 w-24 shrink-0"
  const rowCls = "flex items-start gap-3 py-1.5"

  const previewSteps = [
    ...approvalSteps.map((s, idx) => ({
      id: `draft-${idx}`,
      stage: "起案部",
      step_order: s.step_order,
      position_name: s.position_name || null,
      category: null,
      approver_name: users.find(u => u.id === s.approver_user_id)?.name ?? null,
      status: "未承認",
      approved_at: null,
    })),
    ...relatedSteps.map((s, idx) => ({
      id: `related-${idx}`,
      stage: "関連部役員社長",
      step_order: s.step_order,
      position_name: s.position_name || null,
      category: s.category || null,
      approver_name: users.find(u => u.id === s.approver_user_id)?.name ?? null,
      status: "未承認",
      approved_at: null,
    })),
  ]

  const draftPreviewSteps = [
    ...(data.planned_approval_steps ?? []).map((s, idx) => ({
      id: `dp-${idx}`,
      stage: "起案部",
      step_order: s.step_order,
      position_name: s.position_name || null,
      category: null,
      approver_name: users.find(u => u.id === s.approver_user_id)?.name ?? null,
      status: "未承認",
      approved_at: null,
    })),
    ...(data.planned_related_steps ?? []).map((s, idx) => ({
      id: `dr-${idx}`,
      stage: "関連部役員社長",
      step_order: s.step_order,
      position_name: s.position_name || null,
      category: s.category || null,
      approver_name: users.find(u => u.id === s.approver_user_id)?.name ?? null,
      status: "未承認",
      approved_at: null,
    })),
  ]

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/eapp/ringi")}>← 一覧へ</Button>
          <h1 className="text-2xl font-bold">{data.title || "（無題の下書き）"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600">{data.status}</span>
          {!isDraft && (
            <a href={`/api/eapp/ringi/pdf?id=${id}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="flex items-center gap-1"><Download className="w-3 h-3" />PDF出力</Button>
            </a>
          )}
          {isDraft && !isEditing && (
            <Button variant="outline" size="sm" onClick={enterEditMode} className="flex items-center gap-1"><Pencil className="w-3 h-3" />編集</Button>
          )}
          {isAdmin && (
            <button onClick={handleDelete} className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded px-2 py-1 hover:bg-red-50">削除</button>
          )}
        </div>
      </div>

      {isDraft && !isEditing && (
        <div className="flex gap-6 items-start">
          <div className="overflow-x-auto">
            <RingiPaperPreview
              title={data.title}
              content={data.content}
              destination={data.destination}
              cost={data.cost}
              requester_names={data.requester_names}
              requester_department={data.requester_department}
              reception_number={data.reception_number}
              reception_date={data.reception_date}
              decision_date={data.decision_date}
              decision_result={data.decision_result}
              created_at={data.created_at}
              approval_steps={draftPreviewSteps}
            />
          </div>
          <div className="w-80 shrink-0 space-y-4">
            {data.files.length > 0 && (
              <div className="bg-white border rounded-lg shadow-sm p-4">
                <h3 className="text-xs font-semibold text-gray-500 mb-2">添付ファイル</h3>
                <div className="space-y-1">
                  {data.files.map(f => (
                    <button key={f.id} onClick={() => downloadFile(f.file_key, f.file_name)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                      <Download className="w-3 h-3" />{f.file_name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isEditing && (
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            <div className="bg-white border rounded-lg shadow-sm p-6 space-y-4">
              <div className={rowCls}>
                <span className={labelCls}>タイトル</span>
                <Input value={form.title} onChange={e => setF("title", e.target.value)} className="flex-1 h-8 text-sm" autoComplete="off" />
              </div>
              <div className={rowCls}>
                <span className={labelCls}>起案者</span>
                <Input value={form.requester_names} onChange={e => setF("requester_names", e.target.value)} className="flex-1 h-8 text-sm" autoComplete="off" placeholder="連名の場合はカンマ区切り" />
              </div>
              <div className={rowCls}>
                <span className={labelCls}>起案部</span>
                <Input value={form.requester_department} onChange={e => setF("requester_department", e.target.value)} className="flex-1 h-8 text-sm" autoComplete="off" />
              </div>
              <div className={rowCls}>
                <span className={labelCls}>承認ルート設定</span>
                <select value={requesterUserId} onChange={e => handleRequesterChange(e.target.value)} className="flex-1 h-8 border rounded px-2 text-sm bg-white">
                  <option value="">-- 選択してください --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">内容（目的・依頼先・費用等、自由に記入してください）</label>
                <textarea value={form.content} onChange={e => setF("content", e.target.value)} className="w-full border rounded px-3 py-2 text-sm resize-none" rows={14} autoComplete="off" />
              </div>
              {data.files.length > 0 && (
                <div className={rowCls}>
                  <span className={labelCls}>添付ファイル</span>
                  <div className="flex-1 space-y-1">
                    {data.files.map(f => (
                      <button key={f.id} onClick={() => downloadFile(f.file_key, f.file_name)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                        <Download className="w-3 h-3" />{f.file_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-500">起案部承認ステップ（承認者設定から自動入力・その場で追加・削除・編集できます）</label>
                  <button onClick={addStep} className="flex items-center gap-1 text-xs px-2 py-1 bg-slate-700 text-white rounded hover:bg-slate-800">
                    <Plus className="w-3 h-3" /> ステップ追加
                  </button>
                </div>
                {approvalSteps.length === 0 ? (
                  <p className="text-xs text-gray-400">承認ステップがありません。「ステップ追加」から追加してください。</p>
                ) : (
                  <div className="space-y-2">
                    {approvalSteps.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-2 flex-wrap bg-slate-50 border border-slate-200 rounded px-3 py-2">
                        <Input autoComplete="off" type="number" className="w-20 h-8 text-sm shrink-0" value={s.step_order} onChange={e => updateStep(idx, { step_order: Number(e.target.value) })} />
                        <select className="w-28 h-8 border rounded px-2 text-sm bg-white shrink-0" value={s.position_name} onChange={e => updateStep(idx, { position_name: e.target.value })}>
                          <option value="">-- 役職(任意) --</option>
                          {positions.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                        <select className="flex-1 min-w-[160px] h-8 border rounded px-2 text-sm bg-white" value={s.approver_user_id} onChange={e => updateStep(idx, { approver_user_id: e.target.value })}>
                          <option value="">-- 承認者(氏名) --</option>
                          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                        <button onClick={() => removeStep(idx)} className="p-1 text-gray-400 hover:text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-500">関連部・役員・社長 承認ステップ（その場で追加・削除・編集できます）</label>
                  <button onClick={addRelatedStep} className="flex items-center gap-1 text-xs px-2 py-1 bg-slate-700 text-white rounded hover:bg-slate-800">
                    <Plus className="w-3 h-3" /> ステップ追加
                  </button>
                </div>
                {relatedSteps.length === 0 ? (
                  <p className="text-xs text-gray-400">承認ステップがありません。「ステップ追加」から追加してください。</p>
                ) : (
                  <div className="space-y-2">
                    {relatedSteps.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-2 flex-wrap bg-slate-50 border border-slate-200 rounded px-3 py-2">
                        <Input autoComplete="off" type="number" className="w-20 h-8 text-sm shrink-0" value={s.step_order} onChange={e => updateRelatedStep(idx, { step_order: Number(e.target.value) })} />
                        <select className="w-28 h-8 border rounded px-2 text-sm bg-white shrink-0" value={s.position_name} onChange={e => updateRelatedStep(idx, { position_name: e.target.value })}>
                          <option value="">-- 役職(任意) --</option>
                          {positions.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                        <select className="w-24 h-8 border rounded px-2 text-sm bg-white shrink-0" value={s.category} onChange={e => updateRelatedStep(idx, { category: e.target.value })}>
                          <option value="">-- 区分 --</option>
                          <option value="関連部">関連部</option>
                          <option value="役員">役員</option>
                          <option value="社長">社長</option>
                        </select>
                        <select className="flex-1 min-w-[160px] h-8 border rounded px-2 text-sm bg-white" value={s.approver_user_id} onChange={e => updateRelatedStep(idx, { approver_user_id: e.target.value })}>
                          <option value="">-- 承認者(氏名) --</option>
                          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                        <button onClick={() => removeRelatedStep(idx)} className="p-1 text-gray-400 hover:text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={cancelEditMode} className="text-xs text-gray-400 hover:text-gray-600 px-2">キャンセル</button>
              <Button variant="outline" onClick={saveDraft} disabled={saving}>{saving ? "保存中..." : "下書き保存"}</Button>
              <Button onClick={() => setSubmitDialog(true)} disabled={saving}>{saving ? "登録中..." : "申請する"}</Button>
            </div>
          </div>

          <div className="shrink-0">
            <p className="text-xs text-gray-400 mb-1">プレビュー（確認用）</p>
            <div style={{ width: 460, overflow: "hidden" }}>
              <div style={{ zoom: 0.55 }}>
                <RingiPaperPreview
                  title={form.title}
                  content={form.content}
                  destination={null}
                  cost={null}
                  requester_names={form.requester_names}
                  requester_department={form.requester_department}
                  reception_number={data.reception_number}
                  reception_date={data.reception_date}
                  decision_date={data.decision_date}
                  decision_result={data.decision_result}
                  created_at={data.created_at}
                  approval_steps={previewSteps}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {!isDraft && (
        <div className="flex gap-6 items-start">
          <div className="overflow-x-auto">
            <RingiPaperPreview
              title={data.title}
              content={data.content}
              destination={data.destination}
              cost={data.cost}
              requester_names={data.requester_names}
              requester_department={data.requester_department}
              reception_number={data.reception_number}
              reception_date={data.reception_date}
              decision_date={data.decision_date}
              decision_result={data.decision_result}
              created_at={data.created_at}
              approval_steps={data.approval_steps}
            />
          </div>

          <div className="w-80 shrink-0 space-y-4">
            {data.files.length > 0 && (
              <div className="bg-white border rounded-lg shadow-sm p-4">
                <h3 className="text-xs font-semibold text-gray-500 mb-2">添付ファイル</h3>
                <div className="space-y-1">
                  {data.files.map(f => (
                    <button key={f.id} onClick={() => downloadFile(f.file_key, f.file_name)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                      <Download className="w-3 h-3" />{f.file_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {stages.map(stage => {
              const steps = data.approval_steps.filter(s => s.stage === stage)
              if (steps.length === 0) return null
              return (
                <div key={stage} className="bg-white border rounded-lg shadow-sm p-4">
                  <h3 className="text-xs font-semibold text-gray-500 mb-2">{STAGE_LABEL[stage] ?? stage}</h3>
                  <div className="space-y-2">
                    {steps.map(s => {
                      const isMine = s.approver_email === myEmail
                      const isEligible = s.status === "未承認" && !steps.some(x => x.step_order < s.step_order && x.status !== "承認済み")
                      return (
                        <div key={s.id} className="flex items-center gap-2 border-b py-1.5 last:border-0">
                          {s.status === "承認済み" ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <Circle className="w-4 h-4 text-gray-300 shrink-0" />}
                          <span className="text-xs flex-1">{s.approver_name ?? s.position_name ?? "-"}</span>
                          {isMine && isEligible && (
                            <Button size="sm" onClick={() => { setApproveTarget(s.id); setApproveIsFinal(s.step_order === Math.max(...steps.map(x => x.step_order))) }} disabled={processing}>承認する</Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {data.status === "受付待ち" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-amber-800 mb-3">受付処理</h3>
                <div className="space-y-2 mb-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">受付番号</label>
                    <Input value={receptionNumber} onChange={e => setReceptionNumber(e.target.value)} className="h-8 text-sm w-full" autoComplete="off" placeholder="R08-004" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">受付日</label>
                    <Input type="date" value={receptionDate} onChange={e => setReceptionDate(e.target.value)} className="h-8 text-sm w-full" autoComplete="off" />
                  </div>
                </div>
                <Button className="w-full" onClick={() => setReceptionConfirmDialog(true)} disabled={processing}>受付する</Button>
              </div>
            )}

            {data.status === "決裁済み" && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-emerald-800 mb-2">決裁完了</h3>
                <p className="text-xs text-gray-700">決裁日: {formatDate(data.decision_date)} ／ 決裁結果: {data.decision_result ?? "-"}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {approveTarget && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">承認の確認</h3>
            {approveIsFinal ? (
              <>
                <p className="text-sm text-gray-600 mb-2">最終承認です。決裁結果を選択してください。</p>
                <div className="flex gap-2 mb-4">
                  {["可", "差戻", "否"].map(r => (
                    <button key={r} onClick={() => setDecisionResult(r)}
                      className={`text-xs px-3 py-1.5 rounded border ${decisionResult === r ? "bg-slate-700 text-white border-slate-700" : "bg-white text-gray-600 border-gray-300"}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-600 mb-4">このステップを承認します。次の承認者にメールで通知しますか？</p>
            )}
            <div className="flex flex-col gap-2">
              <Button onClick={() => approve(approveTarget, true, approveIsFinal)} disabled={processing}>送信して承認する</Button>
              <Button variant="outline" onClick={() => approve(approveTarget, false, approveIsFinal)} disabled={processing}>送信せず承認する</Button>
              <button onClick={() => setApproveTarget(null)} className="text-xs text-gray-400 hover:text-gray-600 mt-1">キャンセル</button>
            </div>
          </div>
        </div>
      )}
      {receptionConfirmDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">受付処理の確認</h3>
            <p className="text-sm text-gray-600 mb-4">受付処理を行います。関連部・役員・社長の最初の承認者にメールで通知しますか？</p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => submitReception(true)} disabled={processing}>送信して受付する</Button>
              <Button variant="outline" onClick={() => submitReception(false)} disabled={processing}>送信せず受付する</Button>
              <button onClick={() => setReceptionConfirmDialog(false)} className="text-xs text-gray-400 hover:text-gray-600 mt-1">キャンセル</button>
            </div>
          </div>
        </div>
      )}
      {submitDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">申請の確認</h3>
            <p className="text-sm text-gray-600 mb-4">最初の承認者にメールで通知しますか？</p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => submitRingi(true)}>送信して申請する</Button>
              <Button variant="outline" onClick={() => submitRingi(false)}>送信せず申請する</Button>
              <button onClick={() => setSubmitDialog(false)} className="text-xs text-gray-400 hover:text-gray-600 mt-1">キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}