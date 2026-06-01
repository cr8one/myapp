"use client"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Pencil, Trash2, Download } from "lucide-react"
type DeviceModel = {
  modelId: number
  vendorName: string | null
  deviceType: string | null
  modelName: string
  modelNumber: string | null
  osName: string | null
  cpuInfo: string | null
  memoryDefault: string | null
  storageDefault: string | null
  eolDate: string | null
  imagePath: string | null
  note: string | null
}
export default function DeviceModelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [model, setModel] = useState<DeviceModel | null>(null)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [fetching, setFetching] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [form, setForm] = useState<Omit<DeviceModel, "modelId">>({
    vendorName: "", deviceType: "", modelName: "", modelNumber: "",
    osName: "", cpuInfo: "", memoryDefault: "", storageDefault: "",
    eolDate: "", imagePath: "", note: "",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [vendors, setVendors] = useState<{ id: number; value: string }[]>([])
  const [deviceTypes, setDeviceTypes] = useState<{ id: number; value: string }[]>([])

  const fetchModel = async () => {
    setFetching(true)
    const res = await fetch("/api/terminal/device-models")
    const data: DeviceModel[] = await res.json()
    const found = data.find(m => m.modelId === parseInt(id))
    if (!found) { setFetching(false); return }
    setModel(found)
    if (found.imagePath) {
      const urlRes = await fetch(`/api/terminal/device-models?type=signed-url&key=${encodeURIComponent(found.imagePath)}`)
      const { url } = await urlRes.json()
      setSignedUrl(url)
    }
    setFetching(false)
  }

  useEffect(() => {
    fetchModel()
    fetch("/api/terminal/terminal-masters?category=メーカー").then(r => r.json()).then(setVendors)
    fetch("/api/terminal/terminal-masters?category=機種種別").then(r => r.json()).then(setDeviceTypes)
  }, [id])

  const openEdit = async () => {
    if (!model) return
    setForm({
      vendorName: model.vendorName ?? "",
      deviceType: model.deviceType ?? "",
      modelName: model.modelName,
      modelNumber: model.modelNumber ?? "",
      osName: model.osName ?? "",
      cpuInfo: model.cpuInfo ?? "",
      memoryDefault: model.memoryDefault ?? "",
      storageDefault: model.storageDefault ?? "",
      eolDate: model.eolDate ? model.eolDate.split("T")[0] : "",
      imagePath: model.imagePath ?? "",
      note: model.note ?? "",
    })
    setImageFile(null)
    setImagePreview(signedUrl)
    setEditOpen(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const uploadImage = async (file: File): Promise<string> => {
    const res = await fetch("/api/terminal/device-models?type=presigned", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    })
    const { url, key } = await res.json()
    await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
    return key
  }

  const handleSave = async () => {
    if (!model || !form.modelName) return
    setSaving(true)
    try {
      let imagePath = form.imagePath
      if (imageFile) imagePath = await uploadImage(imageFile)
      await fetch("/api/terminal/device-models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, imagePath, modelId: model.modelId }),
      })
      setEditOpen(false)
      setSignedUrl(null)
      fetchModel()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!model) return
    await fetch("/api/terminal/device-models", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: model.modelId }),
    })
    router.push("/dashboard/terminal/device-models")
  }

  const handleDownload = async () => {
    if (!signedUrl) return
    const a = document.createElement("a")
    a.href = signedUrl
    a.download = model?.modelName ?? "image"
    a.target = "_blank"
    a.click()
  }

  if (fetching) return <div className="p-8 text-center text-gray-400 animate-pulse">読み込み中...</div>
  if (!model) return <div className="p-8 text-center text-gray-500">機種が見つかりません。</div>

  const val = (v: string | null | undefined) => v ?? <span className="text-gray-300">—</span>

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />一覧に戻る
        </button>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={openEdit} className="flex items-center gap-1">
            <Pencil className="w-4 h-4" />編集
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-1 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300">
            <Trash2 className="w-4 h-4" />削除
          </Button>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-6">
        {/* 画像セクション */}
        <div className="flex items-start gap-6">
          <div className="w-40 h-40 rounded-xl border bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {signedUrl
              ? <img src={signedUrl} alt={model.modelName} className="w-full h-full object-contain" />
              : <span className="text-gray-300 text-xs">画像なし</span>}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{model.modelName}</h1>
            {model.vendorName && <p className="text-gray-500 mb-3">{model.vendorName}</p>}
            {signedUrl && (
              <Button size="sm" variant="outline" onClick={handleDownload} className="flex items-center gap-1">
                <Download className="w-4 h-4" />画像をダウンロード
              </Button>
            )}
          </div>
        </div>

        {/* 基本情報 */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">基本情報</h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3">
            {[
              ["種別", model.deviceType],
              ["メーカー", model.vendorName],
              ["型番", model.modelNumber],
              ["標準OS", model.osName],
              ["CPU", model.cpuInfo],
              ["標準メモリ", model.memoryDefault],
              ["標準容量", model.storageDefault],
              ["保守期限", model.eolDate ? new Date(model.eolDate).toLocaleDateString("ja-JP") : null],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt className="text-xs text-gray-400">{label}</dt>
                <dd className="text-sm text-gray-800 mt-0.5">{val(value as string)}</dd>
              </div>
            ))}
            {model.note && (
              <div className="col-span-2">
                <dt className="text-xs text-gray-400">備考</dt>
                <dd className="text-sm text-gray-800 mt-0.5 whitespace-pre-wrap">{model.note}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* 編集ダイアログ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>機種を編集</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>機種名 <span className="text-red-500">*</span></Label>
              <Input value={form.modelName} onChange={e => setForm(f => ({ ...f, modelName: e.target.value }))} autoComplete="off" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>種別</Label>
                <Input value={form.deviceType ?? ""} onChange={e => setForm(f => ({ ...f, deviceType: e.target.value }))}
                  list="device-type-list" autoComplete="off" />
                <datalist id="device-type-list">{deviceTypes.map(v => <option key={v.id} value={v.value} />)}</datalist>
              </div>
              <div className="space-y-1">
                <Label>メーカー</Label>
                <Input value={form.vendorName ?? ""} onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))}
                  list="vendor-list" autoComplete="off" />
                <datalist id="vendor-list">{vendors.map(v => <option key={v.id} value={v.value} />)}</datalist>
              </div>
            </div>
            <div className="space-y-1">
              <Label>型番</Label>
              <Input value={form.modelNumber ?? ""} onChange={e => setForm(f => ({ ...f, modelNumber: e.target.value }))} autoComplete="off" />
            </div>
            <div className="space-y-1">
              <Label>標準OS</Label>
              <Input value={form.osName ?? ""} onChange={e => setForm(f => ({ ...f, osName: e.target.value }))} autoComplete="off" />
            </div>
            <div className="space-y-1">
              <Label>CPU</Label>
              <Input value={form.cpuInfo ?? ""} onChange={e => setForm(f => ({ ...f, cpuInfo: e.target.value }))} autoComplete="off" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>標準メモリ</Label>
                <Input value={form.memoryDefault ?? ""} onChange={e => setForm(f => ({ ...f, memoryDefault: e.target.value }))} placeholder="例：16GB" autoComplete="off" />
              </div>
              <div className="space-y-1">
                <Label>標準容量</Label>
                <Input value={form.storageDefault ?? ""} onChange={e => setForm(f => ({ ...f, storageDefault: e.target.value }))} placeholder="例：512GB SSD" autoComplete="off" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>保守期限</Label>
              <Input type="date" value={form.eolDate ?? ""} onChange={e => setForm(f => ({ ...f, eolDate: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>画像</Label>
              <Input type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && (
                <img src={imagePreview} alt="preview" className="mt-2 w-32 h-32 object-contain rounded border bg-gray-50" />
              )}
            </div>
            <div className="space-y-1">
              <Label>備考</Label>
              <Textarea value={form.note ?? ""} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={3} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>キャンセル</Button>
              <Button onClick={handleSave} disabled={saving || !form.modelName}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>削除の確認</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-2">「{model.modelName}」を削除しますか？この操作は取り消せません。</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>キャンセル</Button>
            <Button variant="destructive" onClick={handleDelete}>削除</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
