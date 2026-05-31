"use client"
import { useEffect, useState, use, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Pencil, Trash2, ExternalLink, Upload } from "lucide-react"
import { decode } from "tiff"

type Drawing = {
  id: number
  drawing_no: string | null
  title: string | null
  product_no: string | null
  paper_size: string | null
  paper_type: string | null
  blade_size: string | null
  note: string | null
  storage_location: string | null
  created_date: string | null
  approved_by: string | null
  confirmed_by: string | null
  assigned_by: string | null
  legacy_file_path: string | null
  legacy_file_type: string | null
  new_file_path: string | null
  new_file_type: string | null
  dieline: { id: string; uid_ntemp: string; kyugataban: string | null } | null
}

function TifPreview({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    let cancelled = false
    const render = async () => {
      try {
        const res = await fetch(url)
        const buffer = await res.arrayBuffer()
        const ifds = decode(buffer)
        if (!ifds || ifds.length === 0) { setError(true); return }
        const ifd = ifds[0]
        const width = ifd.width
        const height = ifd.height
        // dataはUint8Array or Uint16Array
        const raw = ifd.data as Uint8Array
        if (cancelled) return
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const imageData = ctx.createImageData(width, height)
        // samplesPerPixel を考慮してRGBAに変換
        const spp = ifd.samplesPerPixel ?? 1
        if (spp === 1) {
          // グレースケール
          for (let i = 0; i < width * height; i++) {
            const v = raw[i]
            imageData.data[i * 4 + 0] = v
            imageData.data[i * 4 + 1] = v
            imageData.data[i * 4 + 2] = v
            imageData.data[i * 4 + 3] = 255
          }
        } else if (spp === 3) {
          // RGB
          for (let i = 0; i < width * height; i++) {
            imageData.data[i * 4 + 0] = raw[i * 3 + 0]
            imageData.data[i * 4 + 1] = raw[i * 3 + 1]
            imageData.data[i * 4 + 2] = raw[i * 3 + 2]
            imageData.data[i * 4 + 3] = 255
          }
        } else if (spp === 4) {
          // RGBA
          for (let i = 0; i < width * height * 4; i++) {
            imageData.data[i] = raw[i]
          }
        }
        ctx.putImageData(imageData, 0, 0)
      } catch {
        if (!cancelled) setError(true)
      }
    }
    render()
    return () => { cancelled = true }
  }, [url])
  if (error) return (
    <div className="h-24 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-400">
      プレビュー失敗
    </div>
  )
  return (
    <canvas ref={canvasRef}
      style={{ maxHeight: "256px", width: "100%", objectFit: "contain" }}
      className="rounded-lg border border-gray-200 bg-gray-50" />
  )
}

export default function DrawingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [drawing, setDrawing] = useState<Drawing | null>(null)
  const [fetching, setFetching] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<Drawing>>({})
  const [legacyUrl, setLegacyUrl] = useState<string | null>(null)
  const [newUrl, setNewUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingKind, setUploadingKind] = useState<"legacy" | "new" | null>(null)

  const fetchDrawing = async () => {
    setFetching(true)
    const res = await fetch(`/api/dlms/drawings/${id}`)
    const data = await res.json()
    setDrawing(data)
    setForm(data)
    setFetching(false)
    if (data.legacy_file_path) {
      fetch("/api/dlms/drawings/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: data.legacy_file_path }),
      }).then(r => r.json()).then(d => setLegacyUrl(d.url))
    }
    if (data.new_file_path) {
      fetch("/api/dlms/drawings/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: data.new_file_path }),
      }).then(r => r.json()).then(d => setNewUrl(d.url))
    }
  }

  useEffect(() => { fetchDrawing() }, [id])

  const handleSave = async () => {
    setSaving(true)
    await fetch(`/api/dlms/drawings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setEditing(false)
    fetchDrawing()
  }

  const handleDelete = async () => {
    if (!confirm("この図面を削除しますか？")) return
    await fetch(`/api/dlms/drawings/${id}`, { method: "DELETE" })
    router.push("/dashboard/dlms/drawings")
  }

  const handleFileUpload = async (file: File, kind: "legacy" | "new") => {
    setUploadingKind(kind)
    const presignRes = await fetch("/api/dlms/drawings/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, contentType: file.type, fileKind: kind }),
    })
    const { url, key } = await presignRes.json()
    await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
    const fileType = file.name.split(".").pop()?.toLowerCase() ?? ""
    await fetch(`/api/dlms/drawings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        kind === "legacy"
          ? { legacy_file_path: key, legacy_file_type: fileType }
          : { new_file_path: key, new_file_type: fileType }
      ),
    })
    setUploadingKind(null)
    fetchDrawing()
  }

  const f = (key: keyof typeof form) => ({
    value: (form[key] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value })),
    autoComplete: "off" as const,
    className: "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
  })

  if (fetching) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">読み込み中...</div>
  if (!drawing) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">図面が見つかりません</div>

  const FileSection = ({ kind, path, fileType, signedUrl }: {
    kind: "legacy" | "new"; path: string | null; fileType: string | null; signedUrl: string | null
  }) => {
    const label = kind === "legacy" ? "旧図面" : "新図面"
    const isImage = fileType && ["png", "jpg", "jpeg", "gif", "webp"].includes(fileType)
    const isTif = fileType && ["tif", "tiff"].includes(fileType)
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">{label}</span>
          <label className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 cursor-pointer">
            <Upload className="w-3 h-3" />
            {path ? "差し替え" : "アップロード"}
            <input type="file" className="hidden" accept="image/*,.tif,.tiff,.pdf"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, kind) }} />
          </label>
        </div>
        {uploadingKind === kind ? (
          <div className="h-24 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-400">アップロード中...</div>
        ) : path && signedUrl ? (
          <div className="relative group">
            {isImage ? (
              <img src={signedUrl} alt={label} className="w-full rounded-lg border border-gray-200 object-contain max-h-64 bg-gray-50" loading="lazy" />
            ) : isTif ? (
              <TifPreview url={signedUrl} />
            ) : (
              <div className="h-24 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-xs text-gray-500 uppercase font-mono font-bold">{fileType}</span>
              </div>
            )}
            <a href={signedUrl} target="_blank" rel="noopener noreferrer"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-lg p-1.5 shadow border border-gray-200"
              title="ダウンロード">
              <ExternalLink className="w-3.5 h-3.5 text-gray-600" />
            </a>
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200 text-xs text-gray-400">
            未登録
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard/dlms/drawings")} className="text-gray-400 hover:text-gray-600"><ChevronLeft className="w-5 h-5" /></button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{drawing.title ?? "（タイトルなし）"}</h1>
              <p className="text-xs text-gray-400 mt-0.5">{drawing.drawing_no ?? ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <>
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50">
                  <Pencil className="w-4 h-4" />編集
                </button>
                <button onClick={handleDelete}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />削除
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-3xl w-full space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">図面ファイル</h2>
          <div className="grid grid-cols-2 gap-6">
            <FileSection kind="legacy" path={drawing.legacy_file_path} fileType={drawing.legacy_file_type} signedUrl={legacyUrl} />
            <FileSection kind="new" path={drawing.new_file_path} fileType={drawing.new_file_type} signedUrl={newUrl} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">基本情報</h2>
          {editing ? (
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">図面番号</label><input type="text" {...f("drawing_no")} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">型名</label><input type="text" {...f("title")} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">品番</label><input type="text" {...f("product_no")} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">紙サイズ</label><input type="text" {...f("paper_size")} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">用紙例</label><input type="text" {...f("paper_type")} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">刃渡り</label><input type="text" {...f("blade_size")} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">保管場所</label><input type="text" {...f("storage_location")} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">作成年月日</label><input type="text" {...f("created_date")} /></div>
              <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">備考</label>
                <textarea {...f("note")} rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
          ) : (
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3">
              {[
                ["図面番号", drawing.drawing_no],
                ["型名", drawing.title],
                ["品番", drawing.product_no],
                ["紙サイズ", drawing.paper_size],
                ["用紙例", drawing.paper_type],
                ["刃渡り", drawing.blade_size],
                ["保管場所", drawing.storage_location],
                ["作成年月日", drawing.created_date],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-xs text-gray-400">{label}</dt>
                  <dd className="text-sm text-gray-800 mt-0.5">{value ?? "—"}</dd>
                </div>
              ))}
              {drawing.note && (
                <div className="col-span-2">
                  <dt className="text-xs text-gray-400">備考</dt>
                  <dd className="text-sm text-gray-800 mt-0.5 whitespace-pre-wrap">{drawing.note}</dd>
                </div>
              )}
              {drawing.dieline && (
                <div className="col-span-2">
                  <dt className="text-xs text-gray-400">紐付き抜き型</dt>
                  <dd className="text-sm text-blue-600 mt-0.5">{drawing.dieline.uid_ntemp} {drawing.dieline.kyugataban && `（${drawing.dieline.kyugataban}）`}</dd>
                </div>
              )}
            </dl>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">承認情報</h2>
          {editing ? (
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">承認者</label><input type="text" {...f("approved_by")} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">確認者</label><input type="text" {...f("confirmed_by")} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">担当者</label><input type="text" {...f("assigned_by")} /></div>
            </div>
          ) : (
            <dl className="grid grid-cols-3 gap-4">
              {[["承認者", drawing.approved_by], ["確認者", drawing.confirmed_by], ["担当者", drawing.assigned_by]].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-xs text-gray-400">{label}</dt>
                  <dd className="text-sm text-gray-800 mt-0.5">{value ?? "—"}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {editing && (
          <div className="flex justify-end gap-3 pb-8">
            <button onClick={() => { setEditing(false); setForm(drawing) }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">キャンセル</button>
            <button onClick={handleSave} disabled={saving}
              className="px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors shadow-sm">
              {saving ? "保存中..." : "保存する"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
