"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, X, ChevronLeft } from "lucide-react"

type FileKind = "legacy" | "new"

export default function DrawingNewPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    drawing_no: "", title: "", product_no: "",
    paper_size: "", paper_type: "", blade_size: "",
    note: "", storage_location: "", created_date: "",
    approved_by: "", confirmed_by: "", assigned_by: "",
    dieline_id: "",
  })
  const [legacyFile, setLegacyFile] = useState<File | null>(null)
  const [newFile, setNewFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const uploadFile = async (file: File, kind: FileKind) => {
    const res = await fetch("/api/dlms/drawings/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, contentType: file.type, fileKind: kind }),
    })
    const { url, key } = await res.json()
    await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
    return { key, type: file.name.split(".").pop()?.toLowerCase() ?? "" }
  }

  const handleSave = async () => {
    if (!form.title && !form.drawing_no) { setError("型名または図面番号を入力してください"); return }
    if (!legacyFile && !newFile) { setError("旧図面または新図面のどちらかをアップロードしてください"); return }
    setSaving(true); setError("")
    try {
      let legacy_file_path = null, legacy_file_type = null
      let new_file_path = null, new_file_type = null

      if (legacyFile) {
        const r = await uploadFile(legacyFile, "legacy")
        legacy_file_path = r.key; legacy_file_type = r.type
      }
      if (newFile) {
        const r = await uploadFile(newFile, "new")
        new_file_path = r.key; new_file_type = r.type
      }

      const res = await fetch("/api/dlms/drawings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dieline_id: form.dieline_id || null,
          legacy_file_path, legacy_file_type,
          new_file_path, new_file_type,
        }),
      })
      if (!res.ok) throw new Error("保存に失敗しました")
      const created = await res.json()
      router.push(`/dashboard/dlms/drawings/${created.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました")
    } finally {
      setSaving(false)
    }
  }

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value })),
    autoComplete: "off" as const,
    className: "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
  })

  const FileUploadBox = ({ kind, file, onFile }: { kind: FileKind; file: File | null; onFile: (f: File | null) => void }) => (
    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${file ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
      {file ? (
        <div className="flex items-center justify-center gap-3">
          <span className="text-sm text-gray-700 font-medium">{file.name}</span>
          <button onClick={() => onFile(null)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <label className="cursor-pointer">
          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">{kind === "legacy" ? "旧図面" : "新図面"}をアップロード</p>
          <p className="text-xs text-gray-400 mt-1">TIF / PNG / PDF など</p>
          <input type="file" className="hidden" accept="image/*,.tif,.tiff,.pdf"
            onChange={e => onFile(e.target.files?.[0] ?? null)} />
        </label>
      )}
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600"><ChevronLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">図面を追加</h1>
            <p className="text-xs text-gray-400 mt-0.5">新規図面の登録</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-3xl w-full space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

        {/* ファイルアップロード */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">図面ファイル</h2>
          <div className="grid grid-cols-2 gap-4">
            <FileUploadBox kind="legacy" file={legacyFile} onFile={setLegacyFile} />
            <FileUploadBox kind="new" file={newFile} onFile={setNewFile} />
          </div>
        </div>

        {/* 基本情報 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">基本情報</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">図面番号</label><input type="text" {...f("drawing_no")} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">型名</label><input type="text" {...f("title")} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">品番</label><input type="text" {...f("product_no")} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">紙サイズ</label><input type="text" {...f("paper_size")} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">用紙例</label><input type="text" {...f("paper_type")} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">刃渡り</label><input type="text" {...f("blade_size")} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">保管場所</label><input type="text" {...f("storage_location")} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">作成年月日</label><input type="text" {...f("created_date")} placeholder="例：2019.05.16" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">抜き型番号（uid_ntemp）</label><input type="text" {...f("dieline_id")} placeholder="紐付ける抜き型番号" /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">備考</label>
            <textarea {...f("note")} rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>

        {/* 承認情報 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">承認情報</h2>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">承認者</label><input type="text" {...f("approved_by")} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">確認者</label><input type="text" {...f("confirmed_by")} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">担当者</label><input type="text" {...f("assigned_by")} /></div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pb-8">
          <button onClick={() => router.back()} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">キャンセル</button>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors shadow-sm">
            {saving ? "保存中..." : "保存する"}
          </button>
        </div>
      </div>
    </div>
  )
}
