"use client"
import { useEffect, useRef, useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { fetchRegulations, openRegulation, uploadRegulationPdf, checkPdfFile, RegulationItem } from "@/lib/eapp-regulations-client"

type FormMode = { mode: "create" } | { mode: "version"; id: string; title: string } | { mode: "edit"; id: string }

const fmtDate = (s: string) => {
  const d = new Date(s)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())}`
}

// 電子申請マスタの「規定等」タブ。規定の登録、版の差し替え、変更、削除、過去の版の確認
export default function RegulationsAdmin() {
  const [items, setItems] = useState<RegulationItem[]>([])
  const [canManage, setCanManage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [form, setForm] = useState<FormMode | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [sortOrder, setSortOrder] = useState("")
  const [versionLabel, setVersionLabel] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState("")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    try {
      const data = await fetchRegulations()
      setItems(data.regulations)
      setCanManage(data.can_manage)
      setError("")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const resetFields = () => { setTitle(""); setDescription(""); setSortOrder(""); setVersionLabel(""); setFile(null); setFormError(""); if (fileRef.current) fileRef.current.value = "" }
  const startCreate = () => { resetFields(); setSortOrder(String(items.length + 1)); setForm({ mode: "create" }) }
  const startVersion = (r: RegulationItem) => { resetFields(); setForm({ mode: "version", id: r.id, title: r.title }) }
  const startEdit = (r: RegulationItem) => { resetFields(); setTitle(r.title); setDescription(r.description ?? ""); setSortOrder(String(r.sort_order)); setForm({ mode: "edit", id: r.id }) }
  const closeForm = () => { setForm(null); resetFields() }

  const send = async (url: string, method: string, body: unknown) => {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "保存に失敗しました")
    return data
  }

  const submit = async () => {
    if (!form) return
    setFormError("")
    // 画面で先に確認する（名前が空のまま、PDFだけがアップロードされて、不要なファイルが残らないようにする）
    if ((form.mode === "create" || form.mode === "edit") && !title.trim()) { setFormError("名前を入力してください"); return }
    if (form.mode !== "edit") {
      if (!file) { setFormError("PDFファイルを選択してください"); return }
      const m = checkPdfFile(file)
      if (m) { setFormError(m); return }
    }
    setBusy(true)
    try {
      if (form.mode === "edit") {
        await send(`/api/eapp/regulations/${form.id}`, "PUT", { title, description, sort_order: Number(sortOrder || 0) })
      } else {
        const key = await uploadRegulationPdf(file as File)
        if (form.mode === "create") {
          await send("/api/eapp/regulations", "POST", { title, description, sort_order: Number(sortOrder || 0), version_label: versionLabel, file_key: key, file_name: (file as File).name })
        } else {
          await send(`/api/eapp/regulations/${form.id}/versions`, "POST", { version_label: versionLabel, file_key: key, file_name: (file as File).name })
        }
      }
      closeForm()
      await load()
    } catch (e: any) {
      setFormError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (r: RegulationItem) => {
    if (!confirm(`「${r.title}」を、すべての版とあわせて削除しますか？元に戻せません。`)) return
    try {
      await send(`/api/eapp/regulations/${r.id}`, "DELETE", {})
      await load()
    } catch (e: any) {
      setError(e.message)
    }
  }
  const open = async (id: string, versionId?: string) => {
    const err = await openRegulation(id, versionId)
    if (err) setError(err)
  }

  if (loading) return <p className="text-sm text-gray-400">読み込み中...</p>
  if (!canManage) {
    return <p className="text-sm text-gray-500">規定等を管理できるのは、システム管理者と経理担当だけです。規定は、経理精算の一覧の「規定等」ボタンから見られます。</p>
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
  const labelClass = "block text-xs text-gray-500 mb-1"
  const formTitle = form?.mode === "create" ? "規定を登録" : form?.mode === "version" ? `「${form.title}」の版を差し替え` : "規定の名前・説明を変更"

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4">
        <p className="text-xs text-gray-400">経理精算の一覧の「規定等」ボタンに出る、規定のPDFを管理します。版を差し替えると、最新の版だけが画面に出ます。古い版は、ここの「過去の版」から確認できます。</p>
        <button onClick={startCreate} className="flex items-center gap-1 px-3 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 shrink-0">
          <Plus className="w-4 h-4" /> 規定を登録
        </button>
      </div>

      {error && <p className="mb-4 text-sm px-4 py-2 rounded bg-red-50 text-red-600">{error}</p>}

      {form && (
        <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <p className="text-sm font-medium text-slate-700">{formTitle}</p>
          {(form.mode === "create" || form.mode === "edit") && (
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="sm:col-span-3">
                <label className={labelClass}>名前（必須）</label>
                <input className={inputClass} value={title} maxLength={100} autoComplete="off" onChange={e => setTitle(e.target.value)} placeholder="例：出張旅費規定（国内）" />
              </div>
              <div>
                <label className={labelClass}>表示順</label>
                <input className={inputClass} inputMode="numeric" value={sortOrder} autoComplete="off" onChange={e => setSortOrder(e.target.value.replace(/\D/g, "").slice(0, 4))} />
              </div>
              <div className="sm:col-span-4">
                <label className={labelClass}>説明（任意）</label>
                <input className={inputClass} value={description} maxLength={500} autoComplete="off" onChange={e => setDescription(e.target.value)} placeholder="例：国内出張の旅費の規定" />
              </div>
            </div>
          )}
          {form.mode !== "edit" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>版の名前（任意）</label>
                <input className={inputClass} value={versionLabel} maxLength={50} autoComplete="off" onChange={e => setVersionLabel(e.target.value)} placeholder="例：2008年12月1日改正" />
              </div>
              <div>
                <label className={labelClass}>PDFファイル（20MBまで）</label>
                <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="block w-full text-sm" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              </div>
            </div>
          )}
          {formError && <p className="text-sm px-3 py-2 rounded bg-red-50 text-red-600">{formError}</p>}
          <div className="flex gap-2 justify-end">
            <button disabled={busy} onClick={closeForm} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50">キャンセル</button>
            <button disabled={busy} onClick={submit} className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-50">
              {busy ? "処理中..." : form.mode === "edit" ? "保存" : form.mode === "version" ? "差し替える" : "登録する"}
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-gray-400">規定がまだ登録されていません。</p>
      ) : (
        <div className="space-y-3">
          {items.map(r => (
            <div key={r.id} className="border border-gray-200 rounded-xl bg-white shadow-sm px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{r.title}<span className="ml-2 text-xs font-normal text-gray-400">表示順 {r.sort_order}</span></p>
                  {r.description && <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>}
                  {r.latest ? (
                    <p className="text-xs text-gray-500 mt-2">
                      最新の版：{r.latest.version_label ?? "（版の名前なし）"}　{r.latest.file_name}　登録：{r.latest.uploader_name ?? "—"}（{fmtDate(r.latest.uploaded_at)}）
                    </p>
                  ) : (
                    <p className="text-xs text-red-500 mt-2">版がありません</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {r.latest && <button onClick={() => open(r.id)} className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded">開く</button>}
                  <button onClick={() => startVersion(r)} className="text-xs px-2 py-1 text-slate-700 hover:bg-slate-100 rounded">版を差し替え</button>
                  <button onClick={() => startEdit(r)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(r)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {r.history.length > 0 && (
                <div className="mt-2">
                  <button onClick={() => setExpanded({ ...expanded, [r.id]: !expanded[r.id] })} className="text-xs text-gray-500 hover:text-gray-700">
                    {expanded[r.id] ? "▼" : "▶"} 過去の版（{r.history.length}件）
                  </button>
                  {expanded[r.id] && (
                    <div className="mt-1 space-y-1">
                      {r.history.map(v => (
                        <div key={v.id} className="flex items-center gap-3 text-xs text-gray-500 border-t border-gray-100 pt-1">
                          <span className="flex-1 truncate">{v.version_label ?? "（版の名前なし）"}　{v.file_name}　登録：{v.uploader_name ?? "—"}（{fmtDate(v.uploaded_at)}）</span>
                          <button onClick={() => open(r.id, v.id)} className="text-blue-600 hover:text-blue-800">開く</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
