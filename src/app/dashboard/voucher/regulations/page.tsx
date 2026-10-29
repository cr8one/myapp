"use client"
import { useCallback, useEffect, useState } from "react"
import { Plus, Upload } from "lucide-react"

type RegFile = { id: string; file_key: string; file_name: string; file_type: string; uploaded_at: string }
type Regulation = {
  id: string
  title: string
  version: string
  remarks: string | null
  file_key: string
  file_name: string
  registrant_name: string | null
  created_at: string
  files: RegFile[]
}
type Me = { is_admin: boolean; is_manager: boolean }

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
const fmtDate = (s: string) => new Date(s).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })

async function request(url: string, method = "GET", body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  return { ok: res.ok, data }
}

async function uploadToS3(file: File): Promise<{ key: string } | { error: string }> {
  const pre = await request("/api/voucher/regulations/presign", "POST", { filename: file.name })
  if (!pre.ok) return { error: pre.data?.error ?? "アップロードの準備に失敗しました" }
  const put = await fetch(pre.data.url, { method: "PUT", body: file })
  if (!put.ok) return { error: "ファイルのアップロードに失敗しました" }
  return { key: pre.data.key }
}

export default function VoucherRegulationsPage() {
  const [records, setRecords] = useState<Regulation[]>([])
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [version, setVersion] = useState("")
  const [remarks, setRemarks] = useState("")
  const [pdf, setPdf] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await request("/api/voucher/regulations")
    if (!r.ok) {
      setError(r.data?.error ?? "読み込みに失敗しました")
      setRecords([])
    } else {
      setRecords(r.data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    request("/api/voucher/me").then(r => { if (r.ok) setMe(r.data) })
  }, [load])

  const canManage = !!(me && (me.is_admin || me.is_manager))

  const openFile = async (key: string) => {
    const r = await request(`/api/voucher/signed-url?key=${encodeURIComponent(key)}`)
    if (!r.ok) {
      setError(r.data?.error ?? "ファイルを開けませんでした")
      return
    }
    window.open(r.data.url, "_blank")
  }

  const resetForm = () => {
    setShowForm(false)
    setTitle("")
    setVersion("")
    setRemarks("")
    setPdf(null)
  }

  const submit = async () => {
    setError("")
    if (!title.trim()) { setError("名前を入力してください"); return }
    if (!version.trim()) { setError("バージョンを入力してください"); return }
    if (!pdf) { setError("PDFファイルを選択してください"); return }
    if (!pdf.name.toLowerCase().endsWith(".pdf")) { setError("規程の本体は、PDFファイルを選択してください"); return }
    setBusy(true)
    const up = await uploadToS3(pdf)
    if ("error" in up) {
      setBusy(false)
      setError(up.error)
      return
    }
    const r = await request("/api/voucher/regulations", "POST", {
      title,
      version,
      remarks,
      file_key: up.key,
      file_name: pdf.name,
    })
    setBusy(false)
    if (!r.ok) {
      setError(r.data?.error ?? "登録に失敗しました")
      return
    }
    resetForm()
    await load()
  }

  const addFile = async (regulationId: string, file: File | null) => {
    if (!file) return
    setError("")
    setBusy(true)
    const up = await uploadToS3(file)
    if ("error" in up) {
      setBusy(false)
      setError(up.error)
      return
    }
    const r = await request(`/api/voucher/regulations/${regulationId}/files`, "POST", {
      file_key: up.key,
      file_name: file.name,
    })
    setBusy(false)
    if (!r.ok) {
      setError(r.data?.error ?? "ファイルの追加に失敗しました")
      return
    }
    await load()
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold text-gray-900">事務処理規程</h1>
        {canManage && (
          <button onClick={() => { setError(""); setShowForm(true) }} className="flex items-center gap-1 px-3 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800">
            <Plus className="w-4 h-4" /> 規程を登録
          </button>
        )}
      </div>
      <p className="mb-4 text-xs text-gray-400">
        電子帳簿保存法で定められた、正当な理由がない訂正および削除の防止に関する事務処理規程の置き場です。本体はPDFで保存し、Wordなどは関連ファイルとして追加します。改訂版は、新しい規程として登録してください。古い版も残ります。
      </p>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {showForm && (
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1 col-span-2"><label className="text-xs text-gray-500">名前</label>
              <input autoComplete="off" className={inputCls} value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1"><label className="text-xs text-gray-500">バージョン</label>
              <input autoComplete="off" className={inputCls} value={version} onChange={e => setVersion(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1"><label className="text-xs text-gray-500">備考</label>
            <textarea className={inputCls} rows={2} value={remarks} onChange={e => setRemarks(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-sm text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer">
              <Upload className="w-4 h-4" /> PDFを選択
              <input type="file" accept=".pdf" className="hidden" onChange={e => { setPdf(e.target.files?.[0] ?? null); e.target.value = "" }} />
            </label>
            <span className="text-sm text-gray-500 break-all">{pdf?.name ?? ""}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} disabled={busy} className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-40">
              {busy ? "登録中..." : "登録"}
            </button>
            <button onClick={resetForm} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">キャンセル</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : records.length === 0 ? (
        <p className="text-sm text-gray-400">まだ登録されていません。</p>
      ) : (
        <div className="space-y-3">
          {records.map(r => (
            <div key={r.id} className="px-4 py-4 border border-gray-200 rounded-xl bg-white shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{r.title}</div>
                  <div className="text-xs text-gray-400">
                    バージョン {r.version}　登録：{fmtDate(r.created_at)}　{r.registrant_name ?? ""}
                  </div>
                </div>
                <button onClick={() => openFile(r.file_key)} className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 shrink-0">
                  PDFを開く
                </button>
              </div>
              {r.remarks && <p className="text-sm text-gray-600 whitespace-pre-wrap">{r.remarks}</p>}
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">関連ファイル</span>
                  {canManage && (
                    <label className="inline-flex items-center gap-1 px-3 py-1 border border-gray-300 text-xs text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <Upload className="w-3 h-3" /> ファイルを追加
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                        className="hidden"
                        disabled={busy}
                        onChange={e => { addFile(r.id, e.target.files?.[0] ?? null); e.target.value = "" }}
                      />
                    </label>
                  )}
                </div>
                {r.files.length === 0 ? (
                  <p className="text-xs text-gray-400">関連ファイルはありません。</p>
                ) : (
                  <div className="space-y-1">
                    {r.files.map(f => (
                      <div key={f.id} className="flex items-center gap-3 text-sm">
                        <span className="flex-1 text-gray-800 break-all">{f.file_name}</span>
                        <span className="text-xs text-gray-400">{fmtDate(f.uploaded_at)}</span>
                        <button onClick={() => openFile(f.file_key)} className="px-3 py-1 border border-gray-300 text-xs text-gray-700 rounded-lg hover:bg-gray-50">開く</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}