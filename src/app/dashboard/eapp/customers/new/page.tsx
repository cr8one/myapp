"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type UserOption = { id: string; name: string | null }

function today() { return new Date().toISOString().slice(0, 10) }

export default function EAppCustomerNewPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<UserOption[]>([])
  const [requesterUserId, setRequesterUserId] = useState("")
  useEffect(() => {
    fetch("/api/users/list").then(r => r.json()).then(setUsers)
    fetch("/api/auth/session").then(r => r.json()).then(s => {
      if (s?.user?.id) setRequesterUserId(s.user.id)
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

  const handleSubmit = async (asDraft: boolean) => {
    if (!form.sales_rep_name) { alert("営業担当者を入力してください"); return }
    if (!requesterUserId) { alert("申請者を選択してください"); return }
    setSaving(true)
    const res = await fetch("/api/eapp/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        requester_user_id: requesterUserId,
        status: asDraft ? "下書き" : "申請済み",
        requested_date: form.requested_date || null,
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
            <select value={requesterUserId} onChange={e => setRequesterUserId(e.target.value)}
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
              <Input value={form.sales_rep_name} onChange={e => set("sales_rep_name", e.target.value)} className={inputCls} autoComplete="off" />
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
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={() => router.back()}>キャンセル</Button>
        <Button variant="outline" onClick={() => handleSubmit(true)} disabled={saving}>
          {saving ? "保存中..." : "下書き保存"}
        </Button>
        <Button onClick={() => handleSubmit(false)} disabled={saving}>
          {saving ? "登録中..." : "申請する"}
        </Button>
      </div>
    </div>
  )
}
