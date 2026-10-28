"use client"
import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Download, List, Upload } from "lucide-react"

type Step = {
  id: string
  step_order: number
  step_name: string | null
  approver_name: string | null
  approver_email: string | null
  status: string
  approved_at: string | null
}
type FileRow = { id: string; file_key: string; file_name: string; file_type: string; uploaded_at: string }
type History = {
  id: string
  kind: string
  field_name: string | null
  before_value: string | null
  after_value: string | null
  actor_name: string | null
  created_at: string
}
type Detail = {
  id: string
  file_no: number
  doc_type: string
  direction: string
  media_type: string | null
  transaction_date: string
  partner_name: string
  amount: number
  remarks: string | null
  payment_method: string | null
  transfer_method: string | null
  base_name: string | null
  file_key: string
  file_name: string
  registrant_name: string | null
  deleted_flg: boolean
  created_at: string
  approval_steps: Step[]
  files: FileRow[]
  histories: History[]
}
type CorrectionRow = { id: string; request_no: number; action: string; status: string }
type Tab = "basic" | "confirm" | "history" | "files"

const TABS: { key: Tab; label: string }[] = [
  { key: "basic", label: "基本情報" },
  { key: "confirm", label: "確認履歴" },
  { key: "history", label: "変更履歴" },
  { key: "files", label: "関連ファイル" },
]

const pad = (n: number) => String(n).padStart(6, "0")
const fmtDate = (s: string) => s.slice(0, 10).replace(/-/g, "/")
const fmtTime = (s: string) => new Date(s).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"

async function request(url: string, method = "GET", body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  return { ok: res.ok, data }
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2 border-b border-gray-100 text-sm">
      <div className="w-28 shrink-0 text-gray-500">{label}</div>
      <div className="flex-1 text-gray-900 whitespace-pre-wrap break-all">{children}</div>
    </div>
  )
}

export default function VoucherDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [v, setV] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [tab, setTab] = useState<Tab>("basic")
  const [previewUrl, setPreviewUrl] = useState("")
  const [myEmail, setMyEmail] = useState("")
  const [approveStepId, setApproveStepId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [corrections, setCorrections] = useState<CorrectionRow[]>([])
  const [showCorrection, setShowCorrection] = useState(false)
  const [corrAction, setCorrAction] = useState<"訂正" | "削除">("訂正")
  const [corrDetail, setCorrDetail] = useState("")
  const [corrReason, setCorrReason] = useState("")

  const load = useCallback(async () => {
    const r = await request(`/api/voucher/${id}`)
    if (!r.ok) {
      setError(r.data?.error ?? "読み込みに失敗しました")
      setLoading(false)
      return undefined
    }
    setV(r.data)
    setLoading(false)
    const c = await request(`/api/voucher/corrections?voucher_id=${id}`)
    setCorrections(c.ok && Array.isArray(c.data?.records) ? c.data.records : [])
    return r.data as Detail
  }, [id])

  useEffect(() => {
    const init = async () => {
      const d = await load()
      if (d) {
        const sg = await request(`/api/voucher/signed-url?key=${encodeURIComponent(d.file_key)}`)
        if (sg.ok) setPreviewUrl(sg.data.url)
      }
      const s = await request("/api/auth/session")
      setMyEmail(s.data?.user?.email ?? "")
    }
    init()
  }, [load])

  const steps = v?.approval_steps ?? []
  const firstPending = steps.find(s => s.status === "未承認")
  const isPdf = (v?.file_name ?? "").toLowerCase().endsWith(".pdf")

  const openFile = async (key: string) => {
    const r = await request(`/api/voucher/signed-url?key=${encodeURIComponent(key)}`)
    if (!r.ok) {
      setError(r.data?.error ?? "ファイルを開けませんでした")
      return
    }
    window.open(r.data.url, "_blank")
  }

  const doApprove = async (stepId: string, sendMail: boolean) => {
    setApproveStepId(null)
    setBusy(true)
    setError("")
    const r = await request(`/api/voucher/${id}/steps/${stepId}/approve`, "POST", { send_mail: sendMail })
    setBusy(false)
    if (!r.ok) {
      setError(r.data?.error ?? "承認に失敗しました")
      return
    }
    await load()
  }

  const nextAfter = (stepId: string) =>
    steps.filter(x => x.id !== stepId && x.status === "未承認").sort((a, b) => a.step_order - b.step_order)[0]

  const onApproveClick = (s: Step) => {
    const next = nextAfter(s.id)
    if (next?.approver_email) setApproveStepId(s.id)
    else doApprove(s.id, false)
  }

  const addFile = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    setError("")
    try {
      const pre = await request("/api/voucher/presign", "POST", { filename: file.name })
      if (!pre.ok) {
        setError(pre.data?.error ?? "アップロードの準備に失敗しました")
        return
      }
      const put = await fetch(pre.data.url, { method: "PUT", body: file })
      if (!put.ok) {
        setError("ファイルのアップロードに失敗しました")
        return
      }
      const r = await request(`/api/voucher/${id}/files`, "POST", { file_key: pre.data.key, file_name: file.name })
      if (!r.ok) {
        setError(r.data?.error ?? "関連ファイルの登録に失敗しました")
        return
      }
      await load()
    } finally {
      setUploading(false)
    }
  }

  const submitCorrection = async () => {
    setBusy(true)
    setError("")
    const r = await request("/api/voucher/corrections", "POST", {
      voucher_id: id,
      action: corrAction,
      detail: corrDetail,
      reason: corrReason,
    })
    setBusy(false)
    if (!r.ok) {
      setError(r.data?.error ?? "依頼に失敗しました")
      return
    }
    setShowCorrection(false)
    setCorrAction("訂正")
    setCorrDetail("")
    setCorrReason("")
    await load()
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">読み込み中...</div>
  if (!v) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600 mb-4">{error || "証憑が見つかりません"}</p>
        <button onClick={() => router.push("/dashboard/voucher")} className="px-4 py-2 border border-gray-300 text-sm rounded-lg">一覧に戻る</button>
      </div>
    )
  }

  const confirmHistories = v.histories.filter(h => h.kind === "承認")
  const changeHistories = v.histories.filter(h => h.kind !== "承認")
  const approveTarget = approveStepId ? steps.find(s => s.id === approveStepId) : undefined
  const approveNext = approveStepId ? nextAfter(approveStepId) : undefined

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">
          証憑詳細 <span className="font-mono text-base text-gray-500">{pad(v.file_no)}</span>
          {v.deleted_flg && <span className="ml-3 text-xs px-2 py-0.5 rounded bg-red-50 text-red-600">削除済み</span>}
        </h1>
        <div className="flex gap-2">
          {!v.deleted_flg && (
            <button onClick={() => { setError(""); setShowCorrection(true) }} className="px-3 py-2 border border-gray-300 text-sm text-gray-700 rounded-lg hover:bg-gray-50">
              訂正・削除依頼
            </button>
          )}
          <button onClick={() => router.push("/dashboard/voucher")} className="flex items-center gap-1 px-3 py-2 border border-gray-300 text-sm text-gray-700 rounded-lg hover:bg-gray-50">
            <List className="w-4 h-4" /> 一覧に戻る
          </button>
        </div>
      </div>
      {corrections.filter(c => c.status === "申請中" || c.status === "承認済み").map(c => (
        <p key={c.id} className="mb-3 text-sm text-amber-700">
          依頼No.{String(c.request_no).padStart(3, "0")}（{c.action}）が{c.status}です。
        </p>
      ))}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 break-all">ファイル名：{v.file_name}</span>
            <button onClick={() => openFile(v.file_key)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 shrink-0 ml-3">
              <Download className="w-4 h-4" /> 開く
            </button>
          </div>
          <div className="border border-gray-200 rounded-xl bg-white min-h-[600px] overflow-hidden">
            {previewUrl ? (
              isPdf ? (
                <iframe src={previewUrl} className="w-full h-[700px]" title="プレビュー" />
              ) : (
                <img src={previewUrl} alt="プレビュー" className="w-full" />
              )
            ) : (
              <p className="p-6 text-sm text-gray-400">プレビューを読み込めませんでした。</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex gap-1 border-b border-gray-200 mb-4">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key ? "border-slate-700 text-slate-900" : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "basic" && (
            <div>
              <Row label="ファイルNo"><span className="font-mono">{pad(v.file_no)}</span></Row>
              <Row label="書類区分">{v.doc_type}</Row>
              <Row label="受発区分">{v.direction}</Row>
              <Row label="媒体区分">{v.media_type ?? ""}</Row>
              <Row label="取引日">{fmtDate(v.transaction_date)}</Row>
              <Row label="取引先名">{v.partner_name}</Row>
              <Row label="金額">{v.amount.toLocaleString("ja-JP")} 円</Row>
              <Row label="支払方法">{v.payment_method ?? ""}</Row>
              <Row label="振込">{v.transfer_method ?? ""}</Row>
              <Row label="拠点">{v.base_name ?? ""}</Row>
              <Row label="備考">{v.remarks ?? ""}</Row>
              <Row label="登録者">{v.registrant_name ?? ""}</Row>
              <Row label="登録日時">{fmtTime(v.created_at)}</Row>

              <h2 className="mt-6 mb-2 text-sm font-bold text-gray-900">精査・検印</h2>
              {steps.length === 0 ? (
                <p className="text-sm text-gray-400">承認者が設定されていないため、確認依頼はありません。</p>
              ) : (
                <div className="space-y-2">
                  {steps.map(s => {
                    const done = s.status !== "未承認"
                    const canApprove = !v.deleted_flg && firstPending?.id === s.id && (!myEmail || myEmail === s.approver_email)
                    return (
                      <div key={s.id} className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm">
                        <span className="w-12 font-medium text-gray-900">{s.step_name ?? `${s.step_order}段目`}</span>
                        <span className="flex-1 text-gray-700">{s.approver_name ?? "未設定"}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${done ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                          {done ? "承認済み" : "未承認"}
                        </span>
                        {done && s.approved_at && <span className="text-xs text-gray-400">{fmtTime(s.approved_at)}</span>}
                        {canApprove && (
                          <button onClick={() => onApproveClick(s)} disabled={busy} className="px-3 py-1 bg-slate-700 text-white text-xs rounded-lg hover:bg-slate-800 disabled:opacity-40">
                            承認する
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {tab === "confirm" && (
            confirmHistories.length === 0 ? (
              <p className="text-sm text-gray-400">確認の履歴はまだありません。</p>
            ) : (
              <div className="space-y-2">
                {confirmHistories.map(h => (
                  <div key={h.id} className="px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm">
                    <span className="text-gray-900">{h.field_name ?? "承認"}：{h.after_value ?? ""}</span>
                    <span className="ml-3 text-gray-500">{h.actor_name ?? ""}</span>
                    <span className="ml-3 text-xs text-gray-400">{fmtTime(h.created_at)}</span>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === "history" && (
            changeHistories.length === 0 ? (
              <p className="text-sm text-gray-400">変更の履歴はまだありません。</p>
            ) : (
              <div className="space-y-2">
                {changeHistories.map(h => (
                  <div key={h.id} className="px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm">
                    <span className="font-medium text-gray-900">{h.kind}</span>
                    {h.field_name && (
                      <span className="ml-3 text-gray-700">
                        {h.field_name}：{h.before_value ? `${h.before_value} → ` : ""}{h.after_value ?? ""}
                      </span>
                    )}
                    <span className="ml-3 text-gray-500">{h.actor_name ?? ""}</span>
                    <span className="ml-3 text-xs text-gray-400">{fmtTime(h.created_at)}</span>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === "files" && (
            <div>
              <p className="text-xs text-gray-400 mb-3">この証憑に関連するファイルを、追加で登録できます（明細など）。登録したファイルは、変更・削除できません。</p>
              {!v.deleted_flg && (
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 cursor-pointer mb-4">
                  <Upload className="w-4 h-4" /> {uploading ? "処理中..." : "ファイルを追加"}
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    disabled={uploading}
                    onChange={e => { addFile(e.target.files?.[0] ?? null); e.target.value = "" }}
                  />
                </label>
              )}
              {v.files.length === 0 ? (
                <p className="text-sm text-gray-400">関連ファイルはありません。</p>
              ) : (
                <div className="space-y-2">
                  {v.files.map(f => (
                    <div key={f.id} className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm">
                      <span className="flex-1 text-gray-900 break-all">{f.file_name}</span>
                      <span className="text-xs text-gray-400">{fmtTime(f.uploaded_at)}</span>
                      <button onClick={() => openFile(f.file_key)} className="px-3 py-1 border border-gray-300 text-xs text-gray-700 rounded-lg hover:bg-gray-50">開く</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showCorrection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 w-[480px] space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-gray-900">訂正・削除依頼</h2>
            <p className="text-xs text-gray-400">
              保存した証憑の訂正・削除は、原則として禁止です。やむを得ない場合のみ依頼してください。管理責任者が承認したあと、処理責任者が実施します。
            </p>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1"><input type="radio" checked={corrAction === "訂正"} onChange={() => setCorrAction("訂正")} />訂正</label>
              <label className="flex items-center gap-1"><input type="radio" checked={corrAction === "削除"} onChange={() => setCorrAction("削除")} />削除</label>
            </div>
            {corrAction === "訂正" && (
              <div className="space-y-1">
                <label className="text-xs text-gray-500">訂正する内容（例：取引日を2026/10/20に変更）</label>
                <textarea className={inputCls} rows={3} value={corrDetail} onChange={e => setCorrDetail(e.target.value)} />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs text-gray-500">理由</label>
              <textarea className={inputCls} rows={3} value={corrReason} onChange={e => setCorrReason(e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowCorrection(false); setError("") }} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">キャンセル</button>
              <button onClick={submitCorrection} disabled={busy} className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-40">依頼する</button>
            </div>
          </div>
        </div>
      )}

      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 w-[420px] space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-gray-900">{approveTarget.step_name ?? "承認"}の承認</h2>
            <p className="text-sm text-gray-600">
              {approveNext ? `次の${approveNext.step_name ?? "承認"}（${approveNext.approver_name ?? "未設定"}）に、確認依頼のメールを送りますか。` : ""}
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={() => doApprove(approveTarget.id, true)} className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800">送信して承認する</button>
              <button onClick={() => doApprove(approveTarget.id, false)} className="px-4 py-2 border border-gray-300 text-sm text-gray-700 rounded-lg hover:bg-gray-50">送信せず承認する</button>
              <button onClick={() => setApproveStepId(null)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}