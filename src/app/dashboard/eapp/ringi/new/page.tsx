"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus } from "lucide-react"
import RingiPaperPreview from "../[id]/RingiPaperPreview"
import { SingleSelectModal } from "@/components/ui/searchable-select-modal"

type UserOption = { id: string; name: string | null; furiganaLastName?: string | null }
type UploadedFile = { fileKey: string; fileName: string }
type ApprovalStepInput = { step_order: number; position_name: string; approver_user_id: string }
type RelatedStepInput = { step_order: number; position_name: string; approver_user_id: string; category: string }
type PositionOption = { id: string; name: string }

export default function RingiNewPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [users, setUsers] = useState<UserOption[]>([])
  const [positions, setPositions] = useState<PositionOption[]>([])
  const [requesterUserId, setRequesterUserId] = useState("")
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [recordId, setRecordId] = useState("")
  const [approvalSteps, setApprovalSteps] = useState<ApprovalStepInput[]>([])
  const [relatedSteps, setRelatedSteps] = useState<RelatedStepInput[]>([])
  const userOptions = users.map(u => ({ id: u.id, label: u.name ?? "", kana: u.furiganaLastName ?? undefined }))

  useEffect(() => {
    fetch("/api/users/list").then(r => r.json()).then(setUsers)
    fetch("/api/masters/positions").then(r => r.json()).then(setPositions)
    fetch("/api/auth/session").then(r => r.json()).then(s => {
      if (s?.user?.id) {
        setRequesterUserId(s.user.id)
        loadApproverSettings(s.user.id)
        loadRelatedSettings(s.user.id)
      }
      if (s?.user?.name) setForm(f => ({ ...f, requester_names: s.user.name }))
    })
  }, [])

  const loadApproverSettings = async (userId: string) => {
    const res = await fetch(`/api/users/${userId}/approver-settings?service_type=ringi`)
    const data = await res.json()
    setApprovalSteps(data.map((s: { step_order: number; position?: { name: string }; approver?: { id: string } }) => ({
      step_order: s.step_order,
      position_name: s.position?.name ?? "",
      approver_user_id: s.approver?.id ?? "",
    })))
  }
  const loadRelatedSettings = async (userId: string) => {
    const res = await fetch(`/api/eapp/masters/approval-routes?service_type=ringi`)
    const commonSteps = await res.json()
    type RawStep = { step_order: number; category?: string | null; position?: { name: string }; approver?: { id: string } }
    const combined = commonSteps.map((s: RawStep) => ({
      step_order: s.step_order,
      position_name: s.position?.name ?? "",
      approver_user_id: s.approver?.id ?? "",
      category: s.category ?? "",
    }))
    setRelatedSteps(combined)
  }
  const handleRequesterChange = (userId: string) => {
    setRequesterUserId(userId)
    if (userId) {
      loadApproverSettings(userId)
      loadRelatedSettings(userId)
    }
  }

  const addStep = () => {
    setApprovalSteps(prev => [...prev, { step_order: prev.length > 0 ? Math.max(...prev.map(s => s.step_order)) + 1 : 1, position_name: "", approver_user_id: "" }])
  }
  const updateStep = (idx: number, patch: Partial<ApprovalStepInput>) => {
    setApprovalSteps(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s))
  }
  const removeStep = (idx: number) => {
    setApprovalSteps(prev => prev.filter((_, i) => i !== idx))
  }

  const addRelatedStep = () => {
    setRelatedSteps(prev => [...prev, { step_order: prev.length > 0 ? Math.max(...prev.map(s => s.step_order)) + 1 : 1, position_name: "", approver_user_id: "", category: "" }])
  }
  const updateRelatedStep = (idx: number, patch: Partial<RelatedStepInput>) => {
    setRelatedSteps(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s))
  }
  const removeRelatedStep = (idx: number) => {
    setRelatedSteps(prev => prev.filter((_, i) => i !== idx))
  }

  const [form, setForm] = useState({
    title: "",
    content: "",
    requester_names: "",
    requester_department: "",
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  // 添付ファイルは、レコード未作成の状態でも選択できるよう、先に下書きレコードを作成してIDを確保する
  const ensureRecordId = async () => {
    if (recordId) return recordId
    const res = await fetch("/api/eapp/ringi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, requester_user_id: requesterUserId, status: "下書き", send_mail: false }),
    })
    const data = await res.json()
    setRecordId(data.id)
    return data.id
  }

  const handleFileChange = async (fileList: FileList) => {
    setUploading(true)
    try {
      const id = await ensureRecordId()
      for (const file of Array.from(fileList)) {
        const presignRes = await fetch(`/api/eapp/ringi/${id}/presign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name }),
        })
        const { url, key } = await presignRes.json()
        await fetch(url, { method: "PUT", body: file })
        setFiles(prev => [...prev, { fileKey: key, fileName: file.name }])
        await fetch(`/api/eapp/ringi/${id}/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileKey: key, fileName: file.name, fileType: file.type || "file" }),
        })
      }
    } catch (e) {
      console.error(e)
      alert("ファイルのアップロードに失敗しました")
    } finally {
      setUploading(false)
    }
  }

  const [confirmDialog, setConfirmDialog] = useState(false)
  const submit = async (asDraft: boolean, sendMail: boolean) => {
    setConfirmDialog(false)
    setSaving(true)
    const id = recordId || await ensureRecordId()
    const res = await fetch(`/api/eapp/ringi/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        requester_user_id: requesterUserId,
        status: asDraft ? "下書き" : "起案部承認中",
        send_mail: sendMail,
        approval_steps: asDraft ? undefined : approvalSteps,
        planned_related_steps: relatedSteps,
        planned_approval_steps: approvalSteps,
      }),
    })
    if (res.ok) {
      router.push(`/dashboard/eapp/ringi/${id}`)
    } else {
      alert("登録に失敗しました")
      setSaving(false)
    }
  }

  const labelCls = "text-xs font-medium text-gray-500 w-28 shrink-0 pt-2"
  const inputCls = "h-8 text-sm flex-1"
  const rowCls = "flex items-center gap-3"

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

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>← 戻る</Button>
          <h1 className="text-2xl font-bold">稟議書 新規作成</h1>
        </div>
      </div>
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          <div className="bg-white border rounded-lg shadow-sm p-6 space-y-4">
            <div className={rowCls}>
              <label className={labelCls}>件名 <span className="text-red-500">*</span></label>
              <Input value={form.title} onChange={e => set("title", e.target.value)} className={inputCls} autoComplete="off" placeholder="〇〇のご提案の件" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>起案者</label>
              <Input value={form.requester_names} onChange={e => set("requester_names", e.target.value)} className={inputCls} autoComplete="off" placeholder="連名の場合はカンマ区切り" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>起案部</label>
              <Input value={form.requester_department} onChange={e => set("requester_department", e.target.value)} className={inputCls} autoComplete="off" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>承認ルート設定</label>
              <div className="flex-1">
                <SingleSelectModal label="承認ルート設定" options={userOptions} value={requesterUserId}
                  onChange={handleRequesterChange} indexFilter placeholder="-- 選択してください --" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">内容（目的・依頼先・費用等、自由に記入してください）</label>
              <textarea
                value={form.content}
                onChange={e => set("content", e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm resize-none"
                rows={16}
                autoComplete="off"
                placeholder={"例：\n給与明細電子化のご提案\n\n1. 目的\n...\n\n2. 依頼先\n株式会社〇〇\n\n3. 費用\n初期費用〇〇円＋月額〇〇円"}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">添付ファイル（見積書・カタログ等）</label>
              <input
                type="file"
                multiple
                disabled={uploading}
                onChange={e => e.target.files && e.target.files.length > 0 && handleFileChange(e.target.files)}
                className="text-sm"
              />
              {uploading && <p className="text-xs text-amber-700 mt-1">アップロード中...</p>}
              {files.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {files.map(f => (
                    <li key={f.fileKey} className="text-xs text-gray-600 flex items-center gap-1">
                      <span>{f.fileName}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

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
                      <div className="flex-1 min-w-[160px]">
                        <SingleSelectModal label="承認者" options={userOptions} value={s.approver_user_id}
                          onChange={(id) => updateStep(idx, { approver_user_id: id })} indexFilter placeholder="-- 承認者(氏名) --" />
                      </div>
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
                      <div className="flex-1 min-w-[160px]">
                        <SingleSelectModal label="承認者" options={userOptions} value={s.approver_user_id}
                          onChange={(id) => updateRelatedStep(idx, { approver_user_id: id })} indexFilter placeholder="-- 承認者(氏名) --" />
                      </div>
                      <button onClick={() => removeRelatedStep(idx)} className="p-1 text-gray-400 hover:text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => router.back()}>キャンセル</Button>
            <Button variant="outline" onClick={() => submit(true, false)} disabled={saving}>
              {saving ? "保存中..." : "下書き保存"}
            </Button>
            <Button onClick={() => setConfirmDialog(true)} disabled={saving}>
              {saving ? "登録中..." : "申請する"}
            </Button>
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
                reception_number={null}
                reception_date={null}
                decision_date={null}
                decision_result={null}
                created_at={new Date().toISOString()}
                approval_steps={previewSteps}
              />
            </div>
          </div>
        </div>
      </div>
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">申請の確認</h3>
            <p className="text-sm text-gray-600 mb-4">最初の承認者にメールで通知しますか？</p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => submit(false, true)}>送信して申請する</Button>
              <Button variant="outline" onClick={() => submit(false, false)}>送信せず申請する</Button>
              <button onClick={() => setConfirmDialog(false)} className="text-xs text-gray-400 hover:text-gray-600 mt-1">キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}