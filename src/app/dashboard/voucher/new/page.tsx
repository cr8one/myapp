"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Upload } from "lucide-react"

type Option = { id: string; category: string; value: string }
type Partner = {
  id: string
  name: string
  staff_user_id: string | null
  media_option: { value: string } | null
  payment_option: { value: string } | null
  transfer_option: { value: string } | null
}
type Me = {
  id: string
  name: string | null
  main_base_name: string | null
  approvers: { step_order: number; approver_name: string | null }[]
}
type Base = { id: string; name: string }

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
const STEP_LABEL: Record<number, string> = { 1: "精査", 2: "検印" }
// サーバー側（src/lib/voucher-storage.ts）の BLOCKED_EXTENSIONS / MAX_RELATED_BYTES と同じ内容にすること
const BLOCKED_EXTENSIONS = ["exe", "bat", "cmd", "com", "scr", "msi", "sh", "js", "vbs", "ps1", "jar", "app", "dmg", "apk"]
const MAX_RELATED_BYTES = 50 * 1024 * 1024
const MAX_RELATED_COUNT = 20

async function request(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  return { ok: res.ok, data }
}

async function getJson(url: string) {
  const res = await fetch(url)
  const data = await res.json().catch(() => null)
  return { ok: res.ok, data }
}

export default function VoucherNewPage() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [options, setOptions] = useState<Option[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [bases, setBases] = useState<Base[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [fileKey, setFileKey] = useState("")
  const [fileName, setFileName] = useState("")
  const [previewUrl, setPreviewUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [ocrMessage, setOcrMessage] = useState("")
  const [relatedFiles, setRelatedFiles] = useState<{ key: string; name: string }[]>([])
  const [relatedBusy, setRelatedBusy] = useState(false)

  const [docType, setDocType] = useState("")
  const [direction, setDirection] = useState("受領")
  const [mediaType, setMediaType] = useState("")
  const [transactionDate, setTransactionDate] = useState("")
  const [partnerName, setPartnerName] = useState("")
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [transferMethod, setTransferMethod] = useState("")
  const [baseName, setBaseName] = useState("")
  const [remarks, setRemarks] = useState("")
  const [showMailDialog, setShowMailDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const init = async () => {
      const meRes = await getJson("/api/voucher/me")
      if (!meRes.ok) {
        setError(meRes.data?.error ?? "読み込みに失敗しました")
        setLoading(false)
        return
      }
      const meData: Me = meRes.data
      setMe(meData)
      setBaseName(meData.main_base_name ?? "")
      const [o, p, b] = await Promise.all([
        getJson("/api/voucher/masters/options"),
        getJson("/api/voucher/masters/partners"),
        getJson("/api/masters/bases"),
      ])
      setOptions(o.ok && Array.isArray(o.data) ? o.data : [])
      setPartners(p.ok && Array.isArray(p.data) ? p.data : [])
      setBases(b.ok && Array.isArray(b.data) ? b.data : [])
      setLoading(false)
    }
    init()
  }, [])

  const optionsOf = (category: string) => options.filter(o => o.category === category)
  const partnerNames = Array.from(new Set(partners.map(p => p.name)))
  const isPdf = fileName.toLowerCase().endsWith(".pdf")

  const applyPartnerDefaults = (name: string) => {
    if (!me) return
    const row = partners.find(p => p.name === name && p.staff_user_id === me.id)
    if (!row) return
    if (row.media_option) setMediaType(row.media_option.value)
    if (row.payment_option) setPaymentMethod(row.payment_option.value)
    if (row.transfer_option) setTransferMethod(row.transfer_option.value)
  }

  const handleFile = async (file: File | null) => {
    if (!file) return
    setError("")
    setOcrMessage("")
    setUploading(true)
    try {
      const pre = await fetch("/api/voucher/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name }),
      })
      const preData = await pre.json().catch(() => null)
      if (!pre.ok) {
        setError(preData?.error ?? "アップロードの準備に失敗しました")
        return
      }
      const put = await fetch(preData.url, { method: "PUT", body: file })
      if (!put.ok) {
        setError("ファイルのアップロードに失敗しました")
        return
      }
      setFileKey(preData.key)
      setFileName(file.name)
      const sg = await getJson(`/api/voucher/signed-url?key=${encodeURIComponent(preData.key)}`)
      if (sg.ok) setPreviewUrl(sg.data.url)

      setOcrMessage("読み取り中...")
      const ocr = await fetch("/api/voucher/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: preData.key }),
      })
      const ocrData = await ocr.json().catch(() => null)
      if (!ocr.ok) {
        setOcrMessage(ocrData?.error ?? "読み取りに失敗しました。内容を手で入力してください。")
        return
      }
      const x = ocrData.extracted
      if (x.doc_type) setDocType(x.doc_type)
      const date = x.service_date || x.issue_date
      if (date) setTransactionDate(date)
      if (x.partner_name) {
        setPartnerName(x.partner_name)
        applyPartnerDefaults(x.partner_name)
      }
      if (x.amount) setAmount(x.amount)
      if (x.remarks) setRemarks(x.remarks)
      setOcrMessage("読み取った内容を入力しました。必ず内容を確認してください。")
    } finally {
      setUploading(false)
    }
  }

  const addRelated = async (list: FileList | null) => {
    if (!list || list.length === 0) return
    setError("")
    const files = Array.from(list)
    if (relatedFiles.length + files.length > MAX_RELATED_COUNT) {
      setError(`関連ファイルは${MAX_RELATED_COUNT}件までです`)
      return
    }
    for (const f of files) {
      const ext = f.name.includes(".") ? (f.name.split(".").pop() ?? "").toLowerCase() : ""
      if (!ext || BLOCKED_EXTENSIONS.includes(ext)) {
        setError(`「${f.name}」は登録できません`)
        return
      }
      if (f.size > MAX_RELATED_BYTES) {
        setError(`「${f.name}」が大きすぎます（50MBまで）`)
        return
      }
    }
    setRelatedBusy(true)
    const added: { key: string; name: string }[] = []
    for (const f of files) {
      const pre = await request("/api/voucher/presign", "POST", { filename: f.name, related: true })
      if (!pre.ok) {
        setError(pre.data?.error ?? "アップロードの準備に失敗しました")
        break
      }
      const put = await fetch(pre.data.url, { method: "PUT", body: f })
      if (!put.ok) {
        setError(`「${f.name}」のアップロードに失敗しました`)
        break
      }
      added.push({ key: pre.data.key, name: f.name })
    }
    setRelatedFiles(prev => [...prev, ...added])
    setRelatedBusy(false)
  }

  const validate = (): string => {
    if (!fileKey) return "ファイルを選択してください"
    if (!docType) return "書類区分を選択してください"
    if (!transactionDate) return "取引日を入力してください"
    if (!partnerName.trim()) return "取引先名を入力してください"
    if (!/^\d+$/.test(amount)) return "金額は数字で入力してください"
    return ""
  }

  const submit = async (sendMail: boolean) => {
    setShowMailDialog(false)
    setSubmitting(true)
    setError("")
    const res = await fetch("/api/voucher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doc_type: docType,
        direction,
        media_type: mediaType,
        transaction_date: transactionDate,
        partner_name: partnerName,
        amount: Number(amount),
        remarks,
        payment_method: paymentMethod,
        transfer_method: transferMethod,
        base_name: baseName,
        file_key: fileKey,
        file_name: fileName,
        related_files: relatedFiles.map(f => ({ file_key: f.key, file_name: f.name })),
        send_mail: sendMail,
      }),
    })
    const data = await res.json().catch(() => null)
    setSubmitting(false)
    if (!res.ok) {
      setError(data?.error ?? "登録に失敗しました")
      return
    }
    router.push("/dashboard/voucher")
  }

  const onRegister = () => {
    const msg = validate()
    if (msg) {
      setError(msg)
      return
    }
    setError("")
    if (me && me.approvers.length > 0) setShowMailDialog(true)
    else submit(false)
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">読み込み中...</div>

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4">証憑の新規登録</h1>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 cursor-pointer mb-3">
            <Upload className="w-4 h-4" /> ファイル選択
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={e => { handleFile(e.target.files?.[0] ?? null); e.target.value = "" }}
            />
          </label>
          <span className="ml-3 text-sm text-gray-500">{uploading ? "処理中..." : fileName}</span>
          {ocrMessage && <p className="mb-2 text-xs text-gray-500">{ocrMessage}</p>}
          <div className="border border-gray-200 rounded-xl bg-white min-h-[600px] overflow-hidden">
            {previewUrl ? (
              isPdf ? (
                <iframe src={previewUrl} className="w-full h-[700px]" title="プレビュー" />
              ) : (
                <img src={previewUrl} alt="プレビュー" className="w-full" />
              )
            ) : (
              <p className="p-6 text-sm text-gray-400">ファイルを選択すると、ここにプレビューが表示されます。</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">書類区分</label>
            <select className={inputCls} value={docType} onChange={e => setDocType(e.target.value)}>
              <option value="">未選択</option>
              {optionsOf("doc_type").map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">受発区分</label>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1"><input type="radio" checked={direction === "受領"} onChange={() => setDirection("受領")} />受領</label>
              <label className="flex items-center gap-1"><input type="radio" checked={direction === "発信"} onChange={() => setDirection("発信")} />発信</label>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">媒体区分</label>
            <select className={inputCls} value={mediaType} onChange={e => setMediaType(e.target.value)}>
              <option value="">未選択</option>
              {optionsOf("media_type").map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">取引日</label>
            <input autoComplete="off" type="date" className={inputCls} value={transactionDate} onChange={e => setTransactionDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">取引先名</label>
            <input
              autoComplete="off"
              list="voucher-partners"
              className={inputCls}
              value={partnerName}
              onChange={e => { setPartnerName(e.target.value); applyPartnerDefaults(e.target.value) }}
            />
            <datalist id="voucher-partners">
              {partnerNames.map(n => <option key={n} value={n} />)}
            </datalist>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">金額（税込・円）</label>
            <input autoComplete="off" type="number" className={inputCls} value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">支払方法</label>
              <select className={inputCls} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="">未選択</option>
                {optionsOf("payment_method").map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">振込</label>
              <select className={inputCls} value={transferMethod} onChange={e => setTransferMethod(e.target.value)}>
                <option value="">未選択</option>
                {optionsOf("transfer_method").map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">拠点</label>
            <select className={inputCls} value={baseName} onChange={e => setBaseName(e.target.value)}>
              <option value="">未選択</option>
              {bases.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">備考</label>
            <textarea className={inputCls} rows={4} value={remarks} onChange={e => setRemarks(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-500">関連ファイル（任意）</label>
            <p className="text-xs text-gray-400">Word・Excel・PDFなど、種類は問いません。登録後は、追加・削除はできません。ダウンロードのみ可能です。</p>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-sm text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer">
                <Upload className="w-4 h-4" /> ファイルを追加
                <input type="file" multiple className="hidden" disabled={relatedBusy} onChange={e => { addRelated(e.target.files); e.target.value = "" }} />
              </label>
              {relatedBusy && <span className="text-xs text-gray-400">アップロード中...</span>}
            </div>
            {relatedFiles.length > 0 && (
              <div className="space-y-1">
                {relatedFiles.map(f => (
                  <div key={f.key} className="flex items-center gap-3 text-sm">
                    <span className="flex-1 text-gray-800 break-all">{f.name}</span>
                    <button onClick={() => setRelatedFiles(prev => prev.filter(x => x.key !== f.key))} className="text-xs text-gray-400 hover:text-red-500">外す</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {me && me.approvers.length === 0 && (
            <p className="text-xs text-amber-600">承認者が設定されていないため、精査・検印の確認依頼は作られません。</p>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={onRegister} disabled={submitting || uploading || relatedBusy} className="px-6 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-40">
              {submitting ? "登録中..." : "登録"}
            </button>
            <button onClick={() => router.push("/dashboard/voucher")} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">キャンセル</button>
          </div>
        </div>
      </div>

      {showMailDialog && me && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 w-[420px] space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-gray-900">確認依頼メールの送信</h2>
            <div className="text-sm text-gray-600 space-y-1">
              {me.approvers.map(a => (
                <p key={a.step_order}>{STEP_LABEL[a.step_order]}：{a.approver_name ?? "未設定"}</p>
              ))}
              <p className="pt-2">1段目の承認者に、確認依頼のメールを送りますか。</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => submit(true)} className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800">送信して登録する</button>
              <button onClick={() => submit(false)} className="px-4 py-2 border border-gray-300 text-sm text-gray-700 rounded-lg hover:bg-gray-50">送信せず登録する</button>
              <button onClick={() => setShowMailDialog(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}