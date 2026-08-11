"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Download, FileText, Trash2 } from "lucide-react"

type FileRecord = {
  id: string
  file_key: string
  file_name: string
  file_type: string
  uploaded_at: string
}
type ApprovalStep = {
  id: string
  step_order: number
  position_name: string | null
  approver_name: string | null
  approver_email: string | null
  status: string
  approved_at: string | null
}
type TokuiCreditRequest = {
  id: string
  uid: string
  request_type: string
  status: string
  company_name: string | null
  industry: string | null
  representative_name: string | null
  capital: string | null
  established_year_month: string | null
  annual_revenue: string | null
  employee_count: string | null
  main_bank_name: string | null
  main_bank_branch: string | null
  postal_code: string | null
  address: string | null
  tel: string | null
  fax: string | null
  payment_terms: string | null
  order_contact_dept: string | null
  order_contact_name: string | null
  sales_rep_name: string | null
  order_items: string | null
  order_amount: string | null
  future_prospects: string | null
  requested_credit_limit: string | null
  requested_date: string | null
  manager_comment: string | null
  division_head_comment: string | null
  accounting_comment: string | null
  approved_credit_limit: string | null
  remarks: string | null
  files: FileRecord[]
  approval_steps: ApprovalStep[]
}

const STATUS_STYLE: Record<string, string> = {
  "下書き": "bg-gray-100 text-gray-600",
  "申請済み": "bg-blue-100 text-blue-700",
}
const REQUEST_TYPE_LABEL: Record<string, string> = { NEW: "登録依頼", UPDATE: "修正依頼" }

export default function EAppCustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [record, setRecord] = useState<TokuiCreditRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [submitDialog, setSubmitDialog] = useState(false)
  const editableFields = [
    "company_name", "industry", "representative_name", "capital", "established_year_month",
    "annual_revenue", "employee_count", "main_bank_name", "main_bank_branch", "postal_code",
    "address", "tel", "fax", "payment_terms", "order_contact_dept", "order_contact_name",
    "sales_rep_name", "order_items", "order_amount", "future_prospects", "requested_credit_limit",
  ]
  const approvalCommentFields = [
    "manager_comment", "division_head_comment", "accounting_comment", "approved_credit_limit", "remarks",
  ]
  const fetchRecord = async () => {
    setLoading(true)
    const res = await fetch(`/api/eapp/customers/${id}`)
    const data = await res.json()
    setRecord(data)
    const initial: Record<string, string> = {}
    editableFields.forEach(k => { initial[k] = (data as Record<string, unknown>)[k] as string ?? "" })
    approvalCommentFields.forEach(k => { initial[k] = (data as Record<string, unknown>)[k] as string ?? "" })
    setForm(initial)
    setLoading(false)
  }
  useEffect(() => { fetchRecord() }, [id])
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const saveDraft = async () => {
    setSaving(true)
    await fetch(`/api/eapp/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    await fetchRecord()
    setSaving(false)
  }
  const submitRequest = async (sendMail: boolean) => {
    setSubmitDialog(false)
    setSaving(true)
    await fetch(`/api/eapp/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, status: "申請済み", send_mail: sendMail }),
    })
    await fetchRecord()
    setSaving(false)
  }
  const [savingComments, setSavingComments] = useState(false)
  const saveApprovalComments = async () => {
    setSavingComments(true)
    const data: Record<string, string> = {}
    approvalCommentFields.forEach(k => { data[k] = form[k] ?? "" })
    await fetch(`/api/eapp/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    await fetchRecord()
    setSavingComments(false)
  }

  const handleFileSelect = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      const presignRes = await fetch(`/api/eapp/customers/${id}/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name }),
      })
      const { url, key } = await presignRes.json()
      await fetch(url, { method: "PUT", body: file })
      const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
      const fileType = ext === "pdf" ? "PDF" : ["xls", "xlsx"].includes(ext) ? "EXCEL" : ["doc", "docx"].includes(ext) ? "WORD" : "OTHER"
      await fetch(`/api/eapp/customers/${id}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileKey: key, fileName: file.name, fileType }),
      })
      await fetchRecord()
    } catch {
      alert("アップロードに失敗しました")
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (key: string) => {
    const res = await fetch(`/api/eapp/customers/${id}/signed-url?key=${encodeURIComponent(key)}`)
    const { url } = await res.json()
    window.open(url, "_blank")
  }

  const [approving, setApproving] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSystemStaff, setIsSystemStaff] = useState(false)
  const [approveTarget, setApproveTarget] = useState<string | null>(null)
  const [registerDialog, setRegisterDialog] = useState(false)
  const [registering, setRegistering] = useState(false)
  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(s => {
      if (s?.user?.role === "ADMIN") setIsAdmin(true)
      if (s?.user?.id) {
        fetch("/api/eapp/masters/system-staff").then(r => r.json()).then((staff: { user: { id: string } }[]) => {
          if (staff.some(st => st.user.id === s.user.id)) setIsSystemStaff(true)
        })
      }
    })
  }, [])
  const handleRegister = async (notifyRequester: boolean) => {
    setRegistering(true)
    const res = await fetch(`/api/eapp/customers/${id}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notify_requester: notifyRequester }),
    })
    if (res.ok) {
      await fetchRecord()
    } else {
      const data = await res.json()
      alert(data.error ?? "登録済み更新に失敗しました")
    }
    setRegistering(false)
    setRegisterDialog(false)
  }
  const handleApprove = async (stepId: string, sendMail: boolean) => {
    setApproving(true)
    const res = await fetch(`/api/eapp/customers/${id}/approval-steps/${stepId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ send_mail: sendMail }),
    })
    if (res.ok) {
      await fetchRecord()
    } else {
      const data = await res.json()
      alert(data.error ?? "承認に失敗しました")
    }
    setApproving(false)
    setApproveTarget(null)
  }
  const handleRevoke = async (stepId: string) => {
    if (!confirm("この承認を取り消しますか？")) return
    const res = await fetch(`/api/eapp/customers/${id}/approval-steps/${stepId}/revoke`, { method: "POST" })
    if (res.ok) {
      await fetchRecord()
    } else {
      const data = await res.json()
      alert(data.error ?? "取り消しに失敗しました")
    }
  }
  const handleDelete = async () => {
    if (!confirm("この申請を削除しますか？この操作は取り消せません。")) return
    const res = await fetch(`/api/eapp/customers/${id}`, { method: "DELETE" })
    if (res.ok) {
      router.push("/dashboard/eapp/customers")
    } else {
      const data = await res.json()
      alert(data.error ?? "削除に失敗しました")
    }
  }

  const labelCls = "text-xs font-medium text-gray-500 w-28 shrink-0"
  const valueCls = "text-sm text-gray-700 flex-1"
  const rowCls = "flex items-center gap-3 py-1.5"

  if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">読み込み中...</div>
  if (!record) return <div className="p-8 text-center text-gray-500">データが見つかりません</div>
  const isDraft = record.status === "下書き"
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/eapp/customers")}>← 一覧に戻る</Button>
          <h1 className="text-2xl font-bold">得意先申請 詳細</h1>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/api/eapp/customers/pdf?id=${record.id}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">PDF出力</Button>
          </a>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-500 border-red-200 hover:bg-red-50">
              削除
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white border rounded-lg shadow-sm mb-6">
        <div className="border-b px-6 py-4 flex items-center gap-4">
          <span className="text-xs text-gray-400">{record.uid}</span>
          <span className={`text-xs px-2.5 py-1 rounded-full ${STATUS_STYLE[record.status] ?? "bg-gray-100 text-gray-600"}`}>
            {record.status}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
            {REQUEST_TYPE_LABEL[record.request_type] ?? record.request_type}
          </span>
          {isSystemStaff && record.status === "承認完了" && (
            <Button size="sm" onClick={() => setRegisterDialog(true)} disabled={registering}>
              {registering ? "処理中..." : "登録済みにする"}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 divide-x">
          <div className="p-6">
            <h3 className="text-xs font-semibold text-gray-500 mb-2">基本情報</h3>
            {isDraft ? (
              <>
                <div className={rowCls}><span className={labelCls}>会社名</span><Input value={form.company_name ?? ""} onChange={e => set("company_name", e.target.value)} className="flex-1 h-8 text-sm" autoComplete="off" /></div>
                <div className={rowCls}><span className={labelCls}>業種</span><Input value={form.industry ?? ""} onChange={e => set("industry", e.target.value)} className="flex-1 h-8 text-sm" autoComplete="off" /></div>
                <div className={rowCls}><span className={labelCls}>代表者</span><Input value={form.representative_name ?? ""} onChange={e => set("representative_name", e.target.value)} className="flex-1 h-8 text-sm" autoComplete="off" /></div>
                <div className={rowCls}><span className={labelCls}>資本金</span><Input value={form.capital ?? ""} onChange={e => set("capital", e.target.value)} className="flex-1 h-8 text-sm" autoComplete="off" /></div>
                <div className={rowCls}><span className={labelCls}>設立年月</span><Input value={form.established_year_month ?? ""} onChange={e => set("established_year_month", e.target.value)} className="flex-1 h-8 text-sm" autoComplete="off" /></div>
                <div className={rowCls}><span className={labelCls}>年商</span><Input value={form.annual_revenue ?? ""} onChange={e => set("annual_revenue", e.target.value)} className="flex-1 h-8 text-sm" autoComplete="off" /></div>
                <div className={rowCls}><span className={labelCls}>従業員数</span><Input value={form.employee_count ?? ""} onChange={e => set("employee_count", e.target.value)} className="flex-1 h-8 text-sm" autoComplete="off" /></div>
                <div className={rowCls}><span className={labelCls}>主取引銀行</span><Input value={form.main_bank_name ?? ""} onChange={e => set("main_bank_name", e.target.value)} className="flex-1 h-8 text-sm" autoComplete="off" /></div>
                <div className={rowCls}><span className={labelCls}>支店</span><Input value={form.main_bank_branch ?? ""} onChange={e => set("main_bank_branch", e.target.value)} className="flex-1 h-8 text-sm" autoComplete="off" /></div>
                <div className={rowCls}><span className={labelCls}>郵便番号</span><Input value={form.postal_code ?? ""} onChange={e => set("postal_code", e.target.value)} className="flex-1 h-8 text-sm" autoComplete="off" /></div>
                <div className={rowCls}><span className={labelCls}>所在地</span><Input value={form.address ?? ""} onChange={e => set("address", e.target.value)} className="flex-1 h-8 text-sm" autoComplete="off" /></div>
                <div className={rowCls}><span className={labelCls}>TEL</span><Input value={form.tel ?? ""} onChange={e => set("tel", e.target.value)} className="flex-1 h-8 text-sm" autoComplete="off" /></div>
                <div className={rowCls}><span className={labelCls}>FAX</span><Input value={form.fax ?? ""} onChange={e => set("fax", e.target.value)} className="flex-1 h-8 text-sm" autoComplete="off" /></div>
                <div className={rowCls}><span className={labelCls}>支払条件</span><Input value={form.payment_terms ?? ""} onChange={e => set("payment_terms", e.target.value)} className="flex-1 h-8 text-sm" autoComplete="off" /></div>
                <div className={rowCls}><span className={labelCls}>発注担当部署</span><Input value={form.order_contact_dept ?? ""} onChange={e => set("order_contact_dept", e.target.value)} className="flex-1 h-8 text-sm" autoComplete="off" /></div>
                <div className={rowCls}><span className={labelCls}>発注担当者</span><Input value={form.order_contact_name ?? ""} onChange={e => set("order_contact_name", e.target.value)} className="flex-1 h-8 text-sm" autoComplete="off" /></div>
              </>
            ) : (
              <>
                <div className={rowCls}><span className={labelCls}>会社名</span><span className={valueCls}>{record.company_name ?? "-"}</span></div>
                <div className={rowCls}><span className={labelCls}>業種</span><span className={valueCls}>{record.industry ?? "-"}</span></div>
                <div className={rowCls}><span className={labelCls}>代表者</span><span className={valueCls}>{record.representative_name ?? "-"}</span></div>
                <div className={rowCls}><span className={labelCls}>資本金</span><span className={valueCls}>{record.capital ?? "-"}</span></div>
                <div className={rowCls}><span className={labelCls}>設立年月</span><span className={valueCls}>{record.established_year_month ?? "-"}</span></div>
                <div className={rowCls}><span className={labelCls}>年商</span><span className={valueCls}>{record.annual_revenue ?? "-"}</span></div>
                <div className={rowCls}><span className={labelCls}>従業員数</span><span className={valueCls}>{record.employee_count ?? "-"}</span></div>
                <div className={rowCls}><span className={labelCls}>主取引銀行</span><span className={valueCls}>{record.main_bank_name ?? "-"} {record.main_bank_branch ?? ""}</span></div>
                <div className={rowCls}><span className={labelCls}>所在地</span><span className={valueCls}>〒{record.postal_code ?? ""} {record.address ?? ""}</span></div>
                <div className={rowCls}><span className={labelCls}>TEL / FAX</span><span className={valueCls}>{record.tel ?? "-"} / {record.fax ?? "-"}</span></div>
                <div className={rowCls}><span className={labelCls}>支払条件</span><span className={valueCls}>{record.payment_terms ?? "-"}</span></div>
                <div className={rowCls}><span className={labelCls}>発注担当者</span><span className={valueCls}>{record.order_contact_dept ?? ""} {record.order_contact_name ?? ""}</span></div>
              </>
            )}
          </div>
          <div className="p-6">
            <h3 className="text-xs font-semibold text-gray-500 mb-2">申請情報</h3>
            {isDraft ? (
              <>
                <div className={rowCls}><span className={labelCls}>営業担当者</span><Input value={form.sales_rep_name ?? ""} onChange={e => set("sales_rep_name", e.target.value)} className="flex-1 h-8 text-sm" autoComplete="off" /></div>
                <div className={rowCls}><span className={labelCls}>受注品目</span><Input value={form.order_items ?? ""} onChange={e => set("order_items", e.target.value)} className="flex-1 h-8 text-sm" autoComplete="off" /></div>
                <div className={rowCls}><span className={labelCls}>受注金額</span><Input value={form.order_amount ?? ""} onChange={e => set("order_amount", e.target.value)} className="flex-1 h-8 text-sm" autoComplete="off" /></div>
                <div className={rowCls}><span className={labelCls}>取引限度申請額</span><Input value={form.requested_credit_limit ?? ""} onChange={e => set("requested_credit_limit", e.target.value)} className="flex-1 h-8 text-sm" autoComplete="off" /></div>
                <div className="mt-3">
                  <span className="text-xs font-medium text-gray-500 block mb-1">今後の見込み</span>
                  <textarea value={form.future_prospects ?? ""} onChange={e => set("future_prospects", e.target.value)} className="w-full border rounded px-3 py-2 text-sm resize-none" rows={6} autoComplete="off" />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={saveDraft} disabled={saving}>{saving ? "保存中..." : "下書き保存"}</Button>
                  <Button size="sm" onClick={() => setSubmitDialog(true)} disabled={saving}>申請する</Button>
                </div>
              </>
            ) : (
              <>
                <div className={rowCls}><span className={labelCls}>営業担当者</span><span className={valueCls}>{record.sales_rep_name ?? "-"}</span></div>
                <div className={rowCls}><span className={labelCls}>受注品目</span><span className={valueCls}>{record.order_items ?? "-"}</span></div>
                <div className={rowCls}><span className={labelCls}>受注金額</span><span className={valueCls}>{record.order_amount ?? "-"}</span></div>
                <div className={rowCls}><span className={labelCls}>取引限度申請額</span><span className={valueCls}>{record.requested_credit_limit ?? "-"}</span></div>
                <div className={rowCls}><span className={labelCls}>申請日</span><span className={valueCls}>{record.requested_date?.slice(0, 10) ?? "-"}</span></div>
                <div className="mt-3">
                  <span className="text-xs font-medium text-gray-500 block mb-1">今後の見込み</span>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{record.future_prospects ?? "-"}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* テンプレDL */}
      <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">お得意先状況（テンプレート）</h3>
        <div className="flex gap-2">
          <a href="/templates/お得意様先状況.pdf" download="お得意様先状況.pdf">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Download className="w-4 h-4" />PDF形式
            </Button>
          </a>
          <a href="/templates/お得意様先状況.xls" download="お得意様先状況.xls">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Download className="w-4 h-4" />Excel形式
            </Button>
          </a>
        </div>
      </div>

      {/* ファイル添付 */}
      <div className="bg-white border rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">添付ファイル</h3>
          <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-1">
            <Upload className="w-4 h-4" />{uploading ? "アップロード中..." : "ファイルを添付"}
          </Button>
          <input ref={fileInputRef} type="file" accept=".pdf,.xls,.xlsx,.doc,.docx" className="hidden"
            onChange={e => handleFileSelect(e.target.files?.[0])} />
        </div>
        {record.files.length === 0 ? (
          <p className="text-sm text-gray-400">添付ファイルはありません</p>
        ) : (
          <ul className="space-y-2">
            {record.files.map(f => (
              <li key={f.id} className="flex items-center gap-3 border rounded-lg px-3 py-2">
                <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700 flex-1 truncate">{f.file_name}</span>
                <span className="text-xs text-gray-400">{f.file_type}</span>
                <button onClick={() => handleDownload(f.file_key)} className="text-blue-500 hover:text-blue-700 text-xs">
                  ダウンロード
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 承認記入欄 */}
      {record.status !== "下書き" && (
        <div className="bg-white border rounded-lg shadow-sm p-6 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">承認記入欄</h3>
            {(record.status === "承認完了" || record.status === "登録済み") && (
              <span className="text-xs text-gray-400">承認完了のため編集ロック中</span>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">マネージャー所感</label>
              <textarea value={form.manager_comment ?? ""} onChange={e => setForm(f => ({ ...f, manager_comment: e.target.value }))}
                disabled={record.status === "承認完了" || record.status === "登録済み"}
                className="w-full border rounded px-3 py-2 text-sm resize-none disabled:bg-gray-50 disabled:text-gray-400" rows={2} autoComplete="off" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">事業部長及び部長所感</label>
              <textarea value={form.division_head_comment ?? ""} onChange={e => setForm(f => ({ ...f, division_head_comment: e.target.value }))}
                disabled={record.status === "承認完了" || record.status === "登録済み"}
                className="w-full border rounded px-3 py-2 text-sm resize-none disabled:bg-gray-50 disabled:text-gray-400" rows={2} autoComplete="off" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">経理部所感</label>
              <textarea value={form.accounting_comment ?? ""} onChange={e => setForm(f => ({ ...f, accounting_comment: e.target.value }))}
                disabled={record.status === "承認完了" || record.status === "登録済み"}
                className="w-full border rounded px-3 py-2 text-sm resize-none disabled:bg-gray-50 disabled:text-gray-400" rows={2} autoComplete="off" />
            </div>
            <div className={rowCls}>
              <span className={labelCls}>取引限度設定額</span>
              <Input value={form.approved_credit_limit ?? ""} onChange={e => setForm(f => ({ ...f, approved_credit_limit: e.target.value }))}
                disabled={record.status === "承認完了" || record.status === "登録済み"}
                className="flex-1 h-8 text-sm disabled:bg-gray-50 disabled:text-gray-400" autoComplete="off" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">備考</label>
              <textarea value={form.remarks ?? ""} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                disabled={record.status === "承認完了" || record.status === "登録済み"}
                className="w-full border rounded px-3 py-2 text-sm resize-none disabled:bg-gray-50 disabled:text-gray-400" rows={2} autoComplete="off" />
            </div>
            {record.status !== "承認完了" && record.status !== "登録済み" && (
              <div className="flex justify-end">
                <Button size="sm" onClick={saveApprovalComments} disabled={savingComments}>
                  {savingComments ? "保存中..." : "保存"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 承認ステップ */}
      <div className="bg-white border rounded-lg shadow-sm p-6 mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">承認ステップ</h3>
        {record.approval_steps.length === 0 ? (
          <p className="text-sm text-gray-400">承認ステップが設定されていません（申請者・得意先共通のどちらにも承認者設定が未登録です）</p>
        ) : (
          <ol className="space-y-2">
            {record.approval_steps.map((s, idx) => {
              const isNextPending = s.status === "未承認" && record.approval_steps.slice(0, idx).every(p => p.status !== "未承認")
              return (
                <li key={s.id} className="flex items-center gap-3 border rounded-lg px-3 py-2">
                  <span className="text-xs font-bold text-slate-500 w-6">{s.step_order}</span>
                  <span className="text-xs text-gray-400 w-24">{s.position_name ?? "-"}</span>
                  <span className="flex-1 text-sm text-gray-700">{s.approver_name ?? "-"}</span>
                  <span className="text-xs text-gray-400">{s.approver_email ?? ""}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === "承認済み" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{s.status}</span>
                  {isNextPending && (
                    <Button size="sm" onClick={() => setApproveTarget(s.id)} disabled={approving}>
                      {approving ? "処理中..." : "承認"}
                    </Button>
                  )}
                  {isAdmin && s.status === "承認済み" && (
                    <button onClick={() => handleRevoke(s.id)} className="text-xs text-red-500 hover:text-red-700">
                      取り消し
                    </button>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </div>
      {approveTarget && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">承認の確認</h3>
            <p className="text-sm text-gray-600 mb-4">このステップを承認します。次の承認者（またはシステム担当者）にメールで通知しますか？</p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => handleApprove(approveTarget, true)} disabled={approving}>送信して承認する</Button>
              <Button variant="outline" onClick={() => handleApprove(approveTarget, false)} disabled={approving}>送信せず承認する</Button>
              <button onClick={() => setApproveTarget(null)} className="text-xs text-gray-400 hover:text-gray-600 mt-1">キャンセル</button>
            </div>
          </div>
        </div>
      )}
      {registerDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">登録済みへの変更確認</h3>
            <p className="text-sm text-gray-600 mb-4">PRINSERへの登録が完了しました。申請者にメールで通知しますか？</p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => handleRegister(true)} disabled={registering}>送信して登録済みにする</Button>
              <Button variant="outline" onClick={() => handleRegister(false)} disabled={registering}>送信せず登録済みにする</Button>
              <button onClick={() => setRegisterDialog(false)} className="text-xs text-gray-400 hover:text-gray-600 mt-1">キャンセル</button>
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
              <Button onClick={() => submitRequest(true)} disabled={saving}>送信して申請する</Button>
              <Button variant="outline" onClick={() => submitRequest(false)} disabled={saving}>送信せず申請する</Button>
              <button onClick={() => setSubmitDialog(false)} className="text-xs text-gray-400 hover:text-gray-600 mt-1">キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
