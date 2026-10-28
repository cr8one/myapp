"use client"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Correction = {
  id: string
  request_no: number
  requested_date: string
  requester_name: string | null
  voucher_id: string | null
  voucher_file_no: number
  voucher_doc_type: string | null
  voucher_partner_name: string | null
  action: string
  detail: string | null
  reason: string
  status: string
  approver_name: string | null
  approved_at: string | null
  decision_comment: string | null
  processed_date: string | null
  processor_name: string | null
}
type Me = { is_manager: boolean; is_processor: boolean }
type Option = { id: string; category: string; value: string }
type Base = { id: string; name: string }
type VoucherForm = {
  doc_type: string
  direction: string
  media_type: string
  transaction_date: string
  partner_name: string
  amount: string
  remarks: string
  payment_method: string
  transfer_method: string
  base_name: string
}

const STATUSES = ["申請中", "承認済み", "却下", "処理済"]
const STATUS_COLOR: Record<string, string> = {
  "申請中": "bg-amber-50 text-amber-700",
  "承認済み": "bg-sky-50 text-sky-700",
  "却下": "bg-red-50 text-red-600",
  "処理済": "bg-emerald-50 text-emerald-700",
}
const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
const pad = (n: number, w: number) => String(n).padStart(w, "0")
const fmtDate = (s: string | null) => (s ? s.slice(0, 10).replace(/-/g, "/") : "")

async function request(url: string, method = "GET", body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  return { ok: res.ok, data }
}

export default function VoucherCorrectionsPage() {
  const router = useRouter()
  const [records, setRecords] = useState<Correction[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [me, setMe] = useState<Me | null>(null)
  const [options, setOptions] = useState<Option[]>([])
  const [bases, setBases] = useState<Base[]>([])

  const [decideTarget, setDecideTarget] = useState<{ c: Correction; decision: "承認" | "却下" } | null>(null)
  const [comment, setComment] = useState("")
  const [processTarget, setProcessTarget] = useState<Correction | null>(null)
  const [form, setForm] = useState<VoucherForm | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async (p: number, st: string) => {
    setLoading(true)
    setError("")
    const q = new URLSearchParams({ page: String(p) })
    if (st) q.set("status", st)
    const r = await request(`/api/voucher/corrections?${q.toString()}`)
    if (!r.ok) {
      setError(r.data?.error ?? "読み込みに失敗しました")
      setRecords([])
      setTotal(0)
    } else {
      setRecords(r.data.records)
      setTotal(r.data.total)
      setPageSize(r.data.page_size)
      setPage(p)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load(1, "")
    request("/api/voucher/me").then(r => { if (r.ok) setMe(r.data) })
    request("/api/voucher/masters/options").then(r => setOptions(r.ok && Array.isArray(r.data) ? r.data : []))
    request("/api/masters/bases").then(r => setBases(r.ok && Array.isArray(r.data) ? r.data : []))
  }, [load])

  const optionsOf = (category: string) => options.filter(o => o.category === category)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const openDecide = (c: Correction, decision: "承認" | "却下") => {
    setComment("")
    setDecideTarget({ c, decision })
  }

  const submitDecide = async () => {
    if (!decideTarget) return
    setBusy(true)
    setError("")
    const r = await request(`/api/voucher/corrections/${decideTarget.c.id}/decide`, "POST", {
      decision: decideTarget.decision,
      comment,
    })
    setBusy(false)
    if (!r.ok) {
      setError(r.data?.error ?? "操作に失敗しました")
      setDecideTarget(null)
      return
    }
    setDecideTarget(null)
    await load(page, status)
  }

  const openProcess = async (c: Correction) => {
    setError("")
    if (c.action === "削除") {
      setForm(null)
      setProcessTarget(c)
      return
    }
    if (!c.voucher_id) {
      setError("対象の証憑が見つかりません")
      return
    }
    const r = await request(`/api/voucher/${c.voucher_id}`)
    if (!r.ok) {
      setError(r.data?.error ?? "証憑の読み込みに失敗しました")
      return
    }
    const v = r.data
    setForm({
      doc_type: v.doc_type ?? "",
      direction: v.direction ?? "受領",
      media_type: v.media_type ?? "",
      transaction_date: String(v.transaction_date).slice(0, 10),
      partner_name: v.partner_name ?? "",
      amount: String(v.amount),
      remarks: v.remarks ?? "",
      payment_method: v.payment_method ?? "",
      transfer_method: v.transfer_method ?? "",
      base_name: v.base_name ?? "",
    })
    setProcessTarget(c)
  }

  const submitProcess = async () => {
    if (!processTarget) return
    if (processTarget.action === "訂正" && form && !/^\d+$/.test(form.amount)) {
      setError("金額は数字で入力してください")
      return
    }
    setBusy(true)
    setError("")
    const body = processTarget.action === "訂正" && form
      ? { changes: { ...form, amount: Number(form.amount) } }
      : {}
    const r = await request(`/api/voucher/corrections/${processTarget.id}/process`, "POST", body)
    setBusy(false)
    if (!r.ok) {
      setError(r.data?.error ?? "実施に失敗しました")
      return
    }
    setProcessTarget(null)
    setForm(null)
    await load(page, status)
  }

  const setF = (k: keyof VoucherForm, v: string) => setForm(prev => (prev ? { ...prev, [k]: v } : prev))

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">訂正・削除記録簿</h1>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">進捗</label>
          <select
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
            value={status}
            onChange={e => { setStatus(e.target.value); load(1, e.target.value) }}
          >
            <option value="">すべて</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <p className="mb-4 text-xs text-gray-400">
        保存した証憑の訂正・削除は、原則として禁止です。やむを得ない場合のみ、証憑の詳細画面から依頼し、管理責任者の承認を経て、処理責任者が実施します。
      </p>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="border border-gray-200 rounded-xl bg-white overflow-x-auto">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col style={{ width: 84 }} /><col style={{ width: 56 }} /><col style={{ width: 92 }} /><col style={{ width: 92 }} />
            <col style={{ width: 72 }} /><col style={{ width: 80 }} /><col /><col style={{ width: 56 }} />
            <col style={{ width: 170 }} /><col style={{ width: 170 }} /><col style={{ width: 92 }} />
            <col style={{ width: 92 }} /><col style={{ width: 92 }} /><col style={{ width: 130 }} />
          </colgroup>
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="px-2 py-2 text-left">進捗</th><th className="px-2 py-2 text-left">No</th>
              <th className="px-2 py-2 text-left">申請日</th><th className="px-2 py-2 text-left">申請者</th>
              <th className="px-2 py-2 text-left">書類区分</th><th className="px-2 py-2 text-left">ファイルNo</th>
              <th className="px-2 py-2 text-left">取引先名</th><th className="px-2 py-2 text-left">内容</th>
              <th className="px-2 py-2 text-left">訂正する内容</th><th className="px-2 py-2 text-left">理由</th>
              <th className="px-2 py-2 text-left">承認者</th><th className="px-2 py-2 text-left">処理日</th>
              <th className="px-2 py-2 text-left">処理担当</th><th className="px-2 py-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={14} className="px-3 py-6 text-center text-gray-400">読み込み中...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={14} className="px-3 py-6 text-center text-gray-400">該当する依頼がありません。</td></tr>
            ) : records.map(c => (
              <tr
                key={c.id}
                onClick={() => { if (c.voucher_id) router.push(`/dashboard/voucher/${c.voucher_id}`) }}
                className="border-t border-gray-100 hover:bg-slate-50 cursor-pointer"
              >
                <td className="px-2 py-2"><span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLOR[c.status] ?? "bg-gray-100 text-gray-500"}`}>{c.status}</span></td>
                <td className="px-2 py-2 font-mono">{pad(c.request_no, 3)}</td>
                <td className="px-2 py-2">{fmtDate(c.requested_date)}</td>
                <td className="px-2 py-2 truncate">{c.requester_name ?? ""}</td>
                <td className="px-2 py-2">{c.voucher_doc_type ?? ""}</td>
                <td className="px-2 py-2 font-mono">{pad(c.voucher_file_no, 6)}</td>
                <td className="px-2 py-2 truncate" title={c.voucher_partner_name ?? ""}>{c.voucher_partner_name ?? ""}</td>
                <td className="px-2 py-2">{c.action}</td>
                <td className="px-2 py-2 text-xs text-gray-600 line-clamp-2" title={c.detail ?? ""}>{c.detail ?? ""}</td>
                <td className="px-2 py-2 text-xs text-gray-600 line-clamp-2" title={c.reason}>{c.reason}</td>
                <td className="px-2 py-2 truncate" title={c.decision_comment ?? ""}>{c.approver_name ?? ""}</td>
                <td className="px-2 py-2">{fmtDate(c.processed_date)}</td>
                <td className="px-2 py-2 truncate">{c.processor_name ?? ""}</td>
                <td className="px-2 py-2" onClick={e => e.stopPropagation()}>
                  {c.status === "申請中" && me?.is_manager && (
                    <div className="flex gap-1">
                      <button onClick={() => openDecide(c, "承認")} className="px-2 py-1 bg-slate-700 text-white text-xs rounded-lg hover:bg-slate-800">承認</button>
                      <button onClick={() => openDecide(c, "却下")} className="px-2 py-1 border border-gray-300 text-xs text-gray-700 rounded-lg hover:bg-gray-50">却下</button>
                    </div>
                  )}
                  {c.status === "承認済み" && me?.is_processor && (
                    <button onClick={() => openProcess(c)} className="px-3 py-1 bg-slate-700 text-white text-xs rounded-lg hover:bg-slate-800">実施</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
        <span>{total.toLocaleString("ja-JP")}件</span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1 || loading} onClick={() => load(page - 1, status)} className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40">前へ</button>
          <span>{page} / {totalPages}</span>
          <button disabled={page >= totalPages || loading} onClick={() => load(page + 1, status)} className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40">次へ</button>
        </div>
      </div>

      {decideTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 w-[460px] space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-gray-900">
              依頼No.{pad(decideTarget.c.request_no, 3)} を{decideTarget.decision}します
            </h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>対象：{pad(decideTarget.c.voucher_file_no, 6)}　{decideTarget.c.voucher_partner_name ?? ""}（{decideTarget.c.action}）</p>
              {decideTarget.c.detail && <p className="whitespace-pre-wrap">内容：{decideTarget.c.detail}</p>}
              <p className="whitespace-pre-wrap">理由：{decideTarget.c.reason}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">コメント（任意）</label>
              <textarea className={inputCls} rows={3} value={comment} onChange={e => setComment(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDecideTarget(null)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">キャンセル</button>
              <button onClick={submitDecide} disabled={busy} className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-40">
                {decideTarget.decision}する
              </button>
            </div>
          </div>
        </div>
      )}

      {processTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-[560px] space-y-4 shadow-xl my-8">
            <h2 className="text-base font-bold text-gray-900">
              依頼No.{pad(processTarget.request_no, 3)} の{processTarget.action}を実施します
            </h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>対象：{pad(processTarget.voucher_file_no, 6)}　{processTarget.voucher_partner_name ?? ""}</p>
              {processTarget.detail && <p className="whitespace-pre-wrap">依頼の内容：{processTarget.detail}</p>}
              <p className="whitespace-pre-wrap">理由：{processTarget.reason}</p>
            </div>

            {processTarget.action === "削除" ? (
              <p className="text-sm text-gray-700">
                この証憑に、削除済みの印を付けます。データは消えず、一覧には表示されなくなります。実施した日付と処理担当が、記録簿に残ります。
              </p>
            ) : form && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">依頼の内容に従って、直す項目だけを変更してください。変更前と変更後は、証憑の変更履歴に残ります。</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><label className="text-xs text-gray-500">書類区分</label>
                    <select className={inputCls} value={form.doc_type} onChange={e => setF("doc_type", e.target.value)}>
                      <option value="">未選択</option>
                      {optionsOf("doc_type").map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1"><label className="text-xs text-gray-500">受発区分</label>
                    <select className={inputCls} value={form.direction} onChange={e => setF("direction", e.target.value)}>
                      <option value="受領">受領</option>
                      <option value="発信">発信</option>
                    </select>
                  </div>
                  <div className="space-y-1"><label className="text-xs text-gray-500">媒体区分</label>
                    <select className={inputCls} value={form.media_type} onChange={e => setF("media_type", e.target.value)}>
                      <option value="">未選択</option>
                      {optionsOf("media_type").map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1"><label className="text-xs text-gray-500">取引日</label>
                    <input autoComplete="off" type="date" className={inputCls} value={form.transaction_date} onChange={e => setF("transaction_date", e.target.value)} />
                  </div>
                  <div className="space-y-1 col-span-2"><label className="text-xs text-gray-500">取引先名</label>
                    <input autoComplete="off" className={inputCls} value={form.partner_name} onChange={e => setF("partner_name", e.target.value)} />
                  </div>
                  <div className="space-y-1"><label className="text-xs text-gray-500">金額（円）</label>
                    <input autoComplete="off" type="number" className={inputCls} value={form.amount} onChange={e => setF("amount", e.target.value)} />
                  </div>
                  <div className="space-y-1"><label className="text-xs text-gray-500">拠点</label>
                    <select className={inputCls} value={form.base_name} onChange={e => setF("base_name", e.target.value)}>
                      <option value="">未選択</option>
                      {bases.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1"><label className="text-xs text-gray-500">支払方法</label>
                    <select className={inputCls} value={form.payment_method} onChange={e => setF("payment_method", e.target.value)}>
                      <option value="">未選択</option>
                      {optionsOf("payment_method").map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1"><label className="text-xs text-gray-500">振込</label>
                    <select className={inputCls} value={form.transfer_method} onChange={e => setF("transfer_method", e.target.value)}>
                      <option value="">未選択</option>
                      {optionsOf("transfer_method").map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1 col-span-2"><label className="text-xs text-gray-500">備考</label>
                    <textarea className={inputCls} rows={3} value={form.remarks} onChange={e => setF("remarks", e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button onClick={() => { setProcessTarget(null); setForm(null) }} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">キャンセル</button>
              <button onClick={submitProcess} disabled={busy} className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-40">
                {processTarget.action}を実施する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}