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

  const fetchRecord = async () => {
    setLoading(true)
    const res = await fetch(`/api/eapp/customers/${id}`)
    const data = await res.json()
    setRecord(data)
    setLoading(false)
  }
  useEffect(() => { fetchRecord() }, [id])

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

  const labelCls = "text-xs font-medium text-gray-500 w-28 shrink-0"
  const valueCls = "text-sm text-gray-700 flex-1"
  const rowCls = "flex items-center gap-3 py-1.5"

  if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">読み込み中...</div>
  if (!record) return <div className="p-8 text-center text-gray-500">データが見つかりません</div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/eapp/customers")}>← 一覧に戻る</Button>
          <h1 className="text-2xl font-bold">得意先申請 詳細</h1>
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
        </div>
        <div className="grid grid-cols-2 divide-x">
          <div className="p-6">
            <h3 className="text-xs font-semibold text-gray-500 mb-2">基本情報</h3>
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
          </div>
          <div className="p-6">
            <h3 className="text-xs font-semibold text-gray-500 mb-2">申請情報</h3>
            <div className={rowCls}><span className={labelCls}>営業担当者</span><span className={valueCls}>{record.sales_rep_name ?? "-"}</span></div>
            <div className={rowCls}><span className={labelCls}>受注品目</span><span className={valueCls}>{record.order_items ?? "-"}</span></div>
            <div className={rowCls}><span className={labelCls}>受注金額</span><span className={valueCls}>{record.order_amount ?? "-"}</span></div>
            <div className={rowCls}><span className={labelCls}>取引限度申請額</span><span className={valueCls}>{record.requested_credit_limit ?? "-"}</span></div>
            <div className={rowCls}><span className={labelCls}>申請日</span><span className={valueCls}>{record.requested_date?.slice(0, 10) ?? "-"}</span></div>
            <div className="mt-3">
              <span className="text-xs font-medium text-gray-500 block mb-1">今後の見込み</span>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{record.future_prospects ?? "-"}</p>
            </div>
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

      {/* 承認ステップ */}
      <div className="bg-white border rounded-lg shadow-sm p-6 mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">承認ステップ</h3>
        {record.approval_steps.length === 0 ? (
          <p className="text-sm text-gray-400">承認ステップが設定されていません（申請者・得意先共通のどちらにも承認者設定が未登録です）</p>
        ) : (
          <ol className="space-y-2">
            {record.approval_steps.map(s => (
              <li key={s.id} className="flex items-center gap-3 border rounded-lg px-3 py-2">
                <span className="text-xs font-bold text-slate-500 w-6">{s.step_order}</span>
                <span className="text-xs text-gray-400 w-24">{s.position_name ?? "-"}</span>
                <span className="flex-1 text-sm text-gray-700">{s.approver_name ?? "-"}</span>
                <span className="text-xs text-gray-400">{s.approver_email ?? ""}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{s.status}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
