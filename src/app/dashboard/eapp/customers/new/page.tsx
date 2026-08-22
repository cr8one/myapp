"use client"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus } from "lucide-react"

type UserOption = { id: string; name: string | null }
type ApprovalStepInput = { step_order: number; position_name: string; approver_user_id: string }

function today() { return new Date().toISOString().slice(0, 10) }

export default function EAppCustomerNewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isArchiveMode = searchParams.get("archive") === "1"
  const [archiveFile, setArchiveFile] = useState<File | null>(null)
  const [archiveKey, setArchiveKey] = useState("")
  const [ocrLoading, setOcrLoading] = useState(false)
  const [archiveRecordId, setArchiveRecordId] = useState("")
  const handleArchiveFileChange = async (file: File) => {
    setArchiveFile(file)
    setOcrLoading(true)
    try {
      const createRes = await fetch("/api/eapp/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_type: "ARCHIVE", status: "下書き", send_mail: false }),
      })
      if (!createRes.ok) throw new Error("レコード作成に失敗")
      const created = await createRes.json()
      setArchiveRecordId(created.id)

      const presignRes = await fetch(`/api/eapp/customers/${created.id}/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name }),
      })
      const { url, key } = await presignRes.json()
      await fetch(url, { method: "PUT", body: file })
      setArchiveKey(key)

      await fetch(`/api/eapp/customers/${created.id}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileKey: key, fileName: file.name, fileType: "pdf" }),
      })

      const ocrRes = await fetch(`/api/eapp/customers/${created.id}/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      })
      if (ocrRes.ok) {
        const { extracted } = await ocrRes.json()
        setForm(f => ({ ...f, ...extracted }))
      } else {
        alert("OCR処理に失敗しました。内容を手入力してください。")
      }
    } catch (e) {
      console.error(e)
      alert("アップロードに失敗しました")
    } finally {
      setOcrLoading(false)
    }
  }

  const submitArchive = async () => {
    if (!archiveRecordId) {
      alert("先にPDFをアップロードしてください")
      return
    }
    setSaving(true)
    const res = await fetch(`/api/eapp/customers/${archiveRecordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        status: "登録済み",
        requested_date: form.requested_date || null,
        send_mail: false,
      }),
    })
    if (res.ok) {
      router.push(`/dashboard/eapp/customers/${archiveRecordId}`)
    } else {
      alert("登録に失敗しました")
      setSaving(false)
    }
  }
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<UserOption[]>([])
  const [requesterUserId, setRequesterUserId] = useState("")
  const [approvalSteps, setApprovalSteps] = useState<ApprovalStepInput[]>([])

  const loadApproverSettings = async (userId: string) => {
    const [userRes, commonRes] = await Promise.all([
      fetch(`/api/users/${userId}/approver-settings?service_type=tokui_credit`),
      fetch(`/api/eapp/masters/approval-routes?service_type=tokui_credit`),
    ])
    const userSteps = await userRes.json()
    const commonSteps = await commonRes.json()
    type RawStep = { position?: { name: string }; approver?: { id: string } }
    const combined = [...userSteps, ...commonSteps].map((s: RawStep, idx: number) => ({
      step_order: idx + 1,
      position_name: s.position?.name ?? "",
      approver_user_id: s.approver?.id ?? "",
    }))
    setApprovalSteps(combined)
  }
  const handleRequesterChange = (userId: string) => {
    setRequesterUserId(userId)
    if (userId) loadApproverSettings(userId)
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

  useEffect(() => {
    fetch("/api/users/list").then(r => r.json()).then(setUsers)
    fetch("/api/auth/session").then(r => r.json()).then(s => {
      if (s?.user?.id) {
        setRequesterUserId(s.user.id)
        loadApproverSettings(s.user.id)
      }
      if (s?.user?.name) setForm(f => ({ ...f, sales_rep_name: s.user.name }))
    })
  }, [])
  const [form, setForm] = useState({
    request_type: "NEW",
    company_name: "",
    industry: "",
    representative_name: "",
    capital: "",
    established_year_month: "",
    annual_revenue: "",
    employee_count: "",
    main_bank_name: "",
    main_bank_branch: "",
    postal_code: "",
    address: "",
    tel: "",
    fax: "",
    payment_terms: "",
    order_contact_dept: "",
    order_contact_name: "",
    sales_rep_name: "",
    order_items: "",
    order_amount: "",
    future_prospects: "",
    requested_credit_limit: "",
    requested_date: today(),
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const [confirmDialog, setConfirmDialog] = useState(false)
  const submit = async (asDraft: boolean, sendMail: boolean) => {
    setConfirmDialog(false)
    setSaving(true)
    const res = await fetch("/api/eapp/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        requester_user_id: requesterUserId,
        status: asDraft ? "下書き" : "申請済み",
        requested_date: form.requested_date || null,
        send_mail: sendMail,
        approval_steps: asDraft ? undefined : approvalSteps,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      router.push(`/dashboard/eapp/customers/${data.id}`)
    } else {
      alert("登録に失敗しました")
      setSaving(false)
    }
  }
  const labelCls = "text-xs font-medium text-gray-500 w-28 shrink-0 pt-2"
  const inputCls = "h-8 text-sm flex-1"
  const rowCls = "flex items-center gap-3"

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>← 戻る</Button>
          <h1 className="text-2xl font-bold">得意先申請 新規登録</h1>
        </div>
      </div>
      <div className="bg-white border rounded-lg shadow-sm">
        {isArchiveMode && (
          <div className="border-b px-6 py-4 bg-amber-50">
            <label className="text-xs font-medium text-gray-500 block mb-1">アーカイブPDFアップロード</label>
            <input
              type="file"
              accept="application/pdf"
              disabled={ocrLoading || !!archiveKey}
              onChange={e => e.target.files?.[0] && handleArchiveFileChange(e.target.files[0])}
              className="text-sm"
            />
            {ocrLoading && <p className="text-xs text-amber-700 mt-2">アップロード・OCR処理中です...少々お待ちください</p>}
            {archiveKey && !ocrLoading && (
              <p className="text-xs text-green-700 mt-2">アップロード・OCR読み取り完了。下記の内容を確認・修正してください（手書きの場合は誤読の可能性があります）</p>
            )}
          </div>
        )}
        {/* ヘッダー：種別・申請日 */}
        <div className="border-b px-6 py-4 flex items-center gap-6">
          <div className={rowCls}>
            <label className={labelCls + " pt-0"}>申請種別</label>
            <select value={form.request_type} onChange={e => set("request_type", e.target.value)}
              className="h-8 border rounded px-2 text-sm bg-white w-32">
              <option value="NEW">登録依頼</option>
              <option value="UPDATE">修正依頼</option>
            </select>
          </div>
          <div className={rowCls}>
            <label className={labelCls + " pt-0"}>申請日</label>
            <Input type="date" value={form.requested_date} onChange={e => set("requested_date", e.target.value)} className="h-8 text-sm w-40" autoComplete="off" />
          </div>
          <div className={rowCls}>
            <label className={labelCls + " pt-0"}>申請者</label>
            <select value={requesterUserId} onChange={e => handleRequesterChange(e.target.value)}
              className="h-8 border rounded px-2 text-sm bg-white w-40">
              <option value="">-- 選択してください --</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>
        {/* 本体：2カラム */}
        <div className="grid grid-cols-2 divide-x">
          {/* 左カラム：基本情報（客先ヒアリング項目） */}
          <div className="p-6 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 mb-1">基本情報（客先ヒアリング）</h3>
            <div className={rowCls}>
              <label className={labelCls}>会社名</label>
              <Input value={form.company_name} onChange={e => set("company_name", e.target.value)} className={inputCls} autoComplete="off" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>業種</label>
              <Input value={form.industry} onChange={e => set("industry", e.target.value)} className={inputCls} autoComplete="off" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>代表者</label>
              <Input value={form.representative_name} onChange={e => set("representative_name", e.target.value)} className={inputCls} autoComplete="off" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>資本金</label>
              <Input value={form.capital} onChange={e => set("capital", e.target.value)} className={inputCls} autoComplete="off" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>設立年月</label>
              <Input value={form.established_year_month} onChange={e => set("established_year_month", e.target.value)} className={inputCls} autoComplete="off" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>年商</label>
              <Input value={form.annual_revenue} onChange={e => set("annual_revenue", e.target.value)} className={inputCls} autoComplete="off" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>従業員数</label>
              <Input value={form.employee_count} onChange={e => set("employee_count", e.target.value)} className={inputCls} autoComplete="off" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>主取引銀行</label>
              <Input value={form.main_bank_name} onChange={e => set("main_bank_name", e.target.value)} className={inputCls} autoComplete="off" placeholder="銀行名" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>支店</label>
              <Input value={form.main_bank_branch} onChange={e => set("main_bank_branch", e.target.value)} className={inputCls} autoComplete="off" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>郵便番号</label>
              <Input value={form.postal_code} onChange={e => set("postal_code", e.target.value)} className={inputCls} autoComplete="off" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>所在地</label>
              <Input value={form.address} onChange={e => set("address", e.target.value)} className={inputCls} autoComplete="off" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>TEL</label>
              <Input value={form.tel} onChange={e => set("tel", e.target.value)} className={inputCls} autoComplete="off" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>FAX</label>
              <Input value={form.fax} onChange={e => set("fax", e.target.value)} className={inputCls} autoComplete="off" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>支払条件</label>
              <Input value={form.payment_terms} onChange={e => set("payment_terms", e.target.value)} className={inputCls} autoComplete="off" placeholder="毎月20日締め翌月末払い" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>発注担当部署</label>
              <Input value={form.order_contact_dept} onChange={e => set("order_contact_dept", e.target.value)} className={inputCls} autoComplete="off" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>発注担当者</label>
              <Input value={form.order_contact_name} onChange={e => set("order_contact_name", e.target.value)} className={inputCls} autoComplete="off" />
            </div>
          </div>
          {/* 右カラム：申請情報 */}
          <div className="p-6 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 mb-1">申請情報</h3>
            <div className={rowCls}>
              <label className={labelCls}>営業担当者 <span className="text-red-500">*</span></label>
              <select value={form.sales_rep_name} onChange={e => set("sales_rep_name", e.target.value)}
                className="flex-1 h-8 border rounded px-2 text-sm bg-white">
                <option value="">-- 選択してください --</option>
                {users.map(u => <option key={u.id} value={u.name ?? ""}>{u.name}</option>)}
              </select>
            </div>
            <div className={rowCls}>
              <label className={labelCls}>受注品目</label>
              <Input value={form.order_items} onChange={e => set("order_items", e.target.value)} className={inputCls} autoComplete="off" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>受注金額</label>
              <Input value={form.order_amount} onChange={e => set("order_amount", e.target.value)} className={inputCls} autoComplete="off" />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>取引限度申請額</label>
              <Input value={form.requested_credit_limit} onChange={e => set("requested_credit_limit", e.target.value)} className={inputCls} autoComplete="off" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">今後の見込み</label>
              <textarea
                value={form.future_prospects}
                onChange={e => set("future_prospects", e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm resize-none"
                rows={8}
                autoComplete="off"
              />
            </div>
          </div>
        </div>
        {!isArchiveMode && (
          <div className="border-t px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500">承認ステップ（承認者設定から自動入力・その場で追加・削除・編集できます）</label>
              <button onClick={addStep} className="flex items-center gap-1 text-xs px-2 py-1 bg-slate-700 text-white rounded hover:bg-slate-800">
                <Plus className="w-3 h-3" /> ステップ追加
              </button>
            </div>
            {approvalSteps.length === 0 ? (
              <p className="text-xs text-gray-400">承認ステップがありません。「ステップ追加」から追加してください。</p>
            ) : (
              <div className="space-y-2">
                {approvalSteps.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-3 py-2">
                    <Input autoComplete="off" type="number" className="w-16 h-8 text-sm" value={s.step_order} onChange={e => updateStep(idx, { step_order: Number(e.target.value) })} />
                    <Input autoComplete="off" className="w-24 h-8 text-sm" placeholder="役職(任意)" value={s.position_name} onChange={e => updateStep(idx, { position_name: e.target.value })} />
                    <select className="flex-1 h-8 border rounded px-2 text-sm bg-white" value={s.approver_user_id} onChange={e => updateStep(idx, { approver_user_id: e.target.value })}>
                      <option value="">-- 承認者(氏名) --</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <button onClick={() => removeStep(idx)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={() => router.back()}>キャンセル</Button>
        {isArchiveMode ? (
          <Button onClick={submitArchive} disabled={saving || !archiveKey}>
            {saving ? "登録中..." : "登録する"}
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={() => submit(true, false)} disabled={saving}>
              {saving ? "保存中..." : "下書き保存"}
            </Button>
            <Button onClick={() => setConfirmDialog(true)} disabled={saving}>
              {saving ? "登録中..." : "申請する"}
            </Button>
          </>
        )}
      </div>
      {!isArchiveMode && confirmDialog && (
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
