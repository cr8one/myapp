"use client"
import { useEffect, useRef, useState } from "react"
import { Plus, Pencil, Trash2, X, Upload, Image as ImageIcon, Search } from "lucide-react"

type TrayImage = {
  id: string
  file_key: string
  file_name: string
  file_type: string
}
type Tray = {
  id: string
  name: string
  type: string
  maker: string
  rendo_tray_cd: string | null
  purchase_evaluation: string
  sort_order: number
  images: TrayImage[]
}
type PrinserTraySuggestion = {
  tray_cd: string
  tray_nm: string
  t_maker: string
}

const EVAL_OPTIONS = ["推奨", "通常", "非表示"]
const EVAL_BADGE: Record<string, string> = {
  "推奨": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "通常": "bg-gray-50 text-gray-600 border-gray-200",
  "非表示": "bg-red-50 text-red-600 border-red-200",
}

export default function TraysPage() {
  const [trays, setTrays] = useState<Tray[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTray, setEditTray] = useState<Tray | null>(null)

  const [name, setName] = useState("")
  const [type, setType] = useState("")
  const [maker, setMaker] = useState("")
  const [rendoTrayCd, setRendoTrayCd] = useState("")
  const [purchaseEvaluation, setPurchaseEvaluation] = useState("通常")
  const [sortOrder, setSortOrder] = useState(0)

  const [suggestions, setSuggestions] = useState<PrinserTraySuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searching, setSearching] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    const res = await fetch("/api/masters/items/trays")
    const data = await res.json()
    setTrays(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const resetForm = () => {
    setName(""); setType(""); setMaker(""); setRendoTrayCd("")
    setPurchaseEvaluation("通常"); setSortOrder(0)
    setSuggestions([]); setShowSuggestions(false)
    setError("")
  }

  const openNew = () => {
    setEditTray(null)
    resetForm()
    setShowForm(true)
  }

  const openEdit = (tray: Tray) => {
    setEditTray(tray)
    setName(tray.name); setType(tray.type); setMaker(tray.maker)
    setRendoTrayCd(tray.rendo_tray_cd ?? "")
    setPurchaseEvaluation(tray.purchase_evaluation)
    setSortOrder(tray.sort_order)
    setSuggestions([]); setShowSuggestions(false)
    setError("")
    setShowForm(true)
  }

  const handleRendoCdChange = (v: string) => {
    setRendoTrayCd(v)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!v.trim()) { setSuggestions([]); setShowSuggestions(false); return }
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/prinser/m-tray?keyword=${encodeURIComponent(v)}`)
        const data = await res.json()
        setSuggestions((data.records ?? []).slice(0, 8))
        setShowSuggestions(true)
      } finally {
        setSearching(false)
      }
    }, 300)
  }

  const selectSuggestion = (s: PrinserTraySuggestion) => {
    setRendoTrayCd(s.tray_cd)
    setShowSuggestions(false)
  }

  const handleSave = async () => {
    if (!name.trim()) { setError("名前は必須です"); return }
    setError("")
    const body = {
      name, type, maker,
      rendo_tray_cd: rendoTrayCd || null,
      purchase_evaluation: purchaseEvaluation,
      sort_order: sortOrder,
    }
    if (editTray) {
      const res = await fetch(`/api/masters/items/trays/${editTray.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) { setError("更新に失敗しました"); return }
      await load()
      setShowForm(false)
    } else {
      const res = await fetch("/api/masters/items/trays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) { setError("登録に失敗しました"); return }
      const created = await res.json()
      await load()
      openEdit(created)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("このトレイを削除しますか？")) return
    await fetch(`/api/masters/items/trays/${id}`, { method: "DELETE" })
    await load()
    if (editTray?.id === id) setShowForm(false)
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editTray) return
    setError("")
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("JPEG / PNG / WebP / GIF のみアップロードできます")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("ファイルサイズは10MB以下にしてください")
      return
    }
    setUploading(true)
    try {
      const urlRes = await fetch(`/api/masters/items/trays/${editTray.id}/images/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size }),
      })
      if (!urlRes.ok) { setError("アップロードURLの取得に失敗しました"); return }
      const { uploadUrl, fileKey } = await urlRes.json()

      const s3Res = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
      if (!s3Res.ok) { setError("S3へのアップロードに失敗しました"); return }

      const dbRes = await fetch(`/api/masters/items/trays/${editTray.id}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileKey, fileName: file.name, fileType: file.type }),
      })
      if (!dbRes.ok) { setError("画像情報の登録に失敗しました"); return }
      const newImage = await dbRes.json()
      setEditTray(prev => prev ? { ...prev, images: [...prev.images, newImage] } : prev)
      await load()
    } catch {
      setError("アップロード中にエラーが発生しました")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleImageDelete = async (imageId: string) => {
    if (!editTray) return
    if (!confirm("この画像を削除しますか？")) return
    await fetch(`/api/masters/items/trays/${editTray.id}/images/${imageId}`, { method: "DELETE" })
    setEditTray(prev => prev ? { ...prev, images: prev.images.filter(i => i.id !== imageId) } : prev)
    await load()
  }

  const handleImagePreview = async (image: TrayImage) => {
    if (!editTray) return
    const res = await fetch(`/api/masters/items/trays/${editTray.id}/images/${image.id}`)
    const { url } = await res.json()
    window.open(url, "_blank")
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">トレイマスタ</h1>
          <p className="text-sm text-gray-400 mt-1">自社独自のトレイ品目マスタ（PRINSER連動あり）</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition"
        >
          <Plus size={16} /> 新規登録
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : trays.length === 0 ? (
        <p className="text-sm text-gray-400">登録されているトレイがありません</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {trays.map(tray => (
            <div key={tray.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition">
              <div className="mb-3 flex h-32 items-center justify-center rounded-xl bg-gray-50 overflow-hidden">
                {tray.images[0] ? (
                  <ImageThumb trayId={tray.id} image={tray.images[0]} />
                ) : (
                  <ImageIcon className="text-gray-300" size={32} />
                )}
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-bold text-gray-900">{tray.name}</p>
                  <p className="truncate text-xs text-gray-400">{tray.type || "—"} / {tray.maker || "—"}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${EVAL_BADGE[tray.purchase_evaluation] ?? EVAL_BADGE["通常"]}`}>
                  {tray.purchase_evaluation}
                </span>
              </div>
              {tray.rendo_tray_cd && (
                <p className="mt-1 text-xs text-gray-400">連動: {tray.rendo_tray_cd}</p>
              )}
              <div className="mt-3 flex gap-2">
                <button onClick={() => openEdit(tray)} className="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50">
                  <Pencil size={12} /> 編集
                </button>
                <button onClick={() => handleDelete(tray.id)} className="flex items-center gap-1 rounded-md border border-red-100 px-2.5 py-1 text-xs text-red-500 hover:bg-red-50">
                  <Trash2 size={12} /> 削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editTray ? "トレイ編集" : "トレイ新規登録"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">名前</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">タイプ</label>
                  <input value={type} onChange={e => setType(e.target.value)} className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">メーカー</label>
                  <input value={maker} onChange={e => setMaker(e.target.value)} className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
                </div>
              </div>

              <div className="relative">
                <label className="mb-1 block text-xs font-medium text-gray-500">連動トレイコード（PRINSER m_tray）</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 text-gray-300" size={14} />
                  <input
                    value={rendoTrayCd}
                    onChange={e => handleRendoCdChange(e.target.value)}
                    onFocus={() => { if (suggestions.length) setShowSuggestions(true) }}
                    placeholder="コード・名称・メーカーで検索"
                    className="w-full rounded-md border border-gray-200 py-2 pl-8 pr-3 text-sm"
                  />
                </div>
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.map(s => (
                      <button
                        key={s.tray_cd}
                        onClick={() => selectSuggestion(s)}
                        className="block w-full px-3 py-2 text-left text-xs hover:bg-amber-50"
                        type="button"
                      >
                        <span className="font-medium text-gray-800">{s.tray_cd}</span>
                        <span className="ml-2 text-gray-400">{s.tray_nm} / {s.t_maker}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searching && <p className="mt-1 text-xs text-gray-400">検索中...</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">購買評価</label>
                  <select value={purchaseEvaluation} onChange={e => setPurchaseEvaluation(e.target.value)} className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm">
                    {EVAL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">表示順</label>
                  <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
                </div>
              </div>

              {editTray && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">画像</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editTray.images.map(img => (
                      <div key={img.id} className="relative h-16 w-16 overflow-hidden rounded-md border border-gray-200">
                        <button type="button" onClick={() => handleImagePreview(img)} className="h-full w-full">
                          <ImageThumb trayId={editTray.id} image={img} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleImageDelete(img.id)}
                          className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer rounded-lg border-2 border-dashed border-gray-200 p-4 text-center hover:border-amber-300 hover:bg-amber-50 transition"
                  >
                    <Upload className="mx-auto mb-1 text-gray-400" size={18} />
                    <p className="text-xs text-gray-400">画像をクリックして選択（最大10MB）</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  {uploading && <p className="mt-1 text-xs text-amber-500">アップロード中...</p>}
                </div>
              )}
              {!editTray && (
                <p className="text-xs text-gray-400">※ 画像は登録後に追加できます</p>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                キャンセル
              </button>
              <button onClick={handleSave} className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
                {editTray ? "更新" : "登録"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ImageThumb({ trayId, image }: { trayId: string; image: TrayImage }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    fetch(`/api/masters/items/trays/${trayId}/images/${image.id}`)
      .then(res => res.json())
      .then(data => { if (active) setUrl(data.url) })
    return () => { active = false }
  }, [trayId, image.id])
  if (!url) return <div className="h-full w-full animate-pulse bg-gray-100" />
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={image.file_name} className="h-full w-full object-cover" />
}
