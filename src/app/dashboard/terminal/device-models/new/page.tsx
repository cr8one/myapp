"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
const emptyForm = {
  vendorName: "", deviceType: "", modelName: "", modelNumber: "",
  osName: "", cpuInfo: "", memoryDefault: "", storageDefault: "",
  eolDate: "", note: "",
}
export default function DeviceModelNewPage() {
  const router = useRouter()
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [vendors, setVendors] = useState<{ id: number; value: string }[]>([])
  const [deviceTypes, setDeviceTypes] = useState<{ id: number; value: string }[]>([])
  useEffect(() => {
    fetch("/api/terminal/terminal-masters?category=メーカー").then(r => r.json()).then(setVendors)
    fetch("/api/terminal/terminal-masters?category=機種種別").then(r => r.json()).then(setDeviceTypes)
  }, [])
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
    if (!form.modelName) { setError("機種名は必須です"); return }
    setSaving(true); setError("")
    try {
      let imagePath = ""
      if (imageFile) imagePath = await uploadImage(imageFile)
      const res = await fetch("/api/terminal/device-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, imagePath: imagePath || null }),
      })
      if (!res.ok) throw new Error("保存に失敗しました")
      const created = await res.json()
      router.push(`/dashboard/terminal/device-models/${created.modelId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました")
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />一覧に戻る
        </button>
        <h1 className="text-xl font-bold">機種を新規作成</h1>
      </div>
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-4">
        <div className="space-y-1">
          <Label>機種名 <span className="text-red-500">*</span></Label>
          <Input value={form.modelName} onChange={e => setForm(f => ({ ...f, modelName: e.target.value }))} autoComplete="off" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>種別</Label>
            <Input value={form.deviceType} onChange={e => setForm(f => ({ ...f, deviceType: e.target.value }))}
              list="device-type-list" autoComplete="off" placeholder="例：ノートPC、サーバー" />
            <datalist id="device-type-list">{deviceTypes.map(v => <option key={v.id} value={v.value} />)}</datalist>
          </div>
          <div className="space-y-1">
            <Label>メーカー</Label>
            <Input value={form.vendorName} onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))}
              list="vendor-list" autoComplete="off" placeholder="例：Apple、Dell" />
            <datalist id="vendor-list">{vendors.map(v => <option key={v.id} value={v.value} />)}</datalist>
          </div>
        </div>
        <div className="space-y-1">
          <Label>型番</Label>
          <Input value={form.modelNumber} onChange={e => setForm(f => ({ ...f, modelNumber: e.target.value }))} autoComplete="off" />
        </div>
        <div className="space-y-1">
          <Label>標準OS</Label>
          <Input value={form.osName} onChange={e => setForm(f => ({ ...f, osName: e.target.value }))} autoComplete="off" />
        </div>
        <div className="space-y-1">
          <Label>CPU</Label>
          <Input value={form.cpuInfo} onChange={e => setForm(f => ({ ...f, cpuInfo: e.target.value }))} autoComplete="off" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>標準メモリ</Label>
            <Input value={form.memoryDefault} onChange={e => setForm(f => ({ ...f, memoryDefault: e.target.value }))} placeholder="例：16GB" autoComplete="off" />
          </div>
          <div className="space-y-1">
            <Label>標準容量</Label>
            <Input value={form.storageDefault} onChange={e => setForm(f => ({ ...f, storageDefault: e.target.value }))} placeholder="例：512GB SSD" autoComplete="off" />
          </div>
        </div>
        <div className="space-y-1">
          <Label>保守期限</Label>
          <Input type="date" value={form.eolDate} onChange={e => setForm(f => ({ ...f, eolDate: e.target.value }))} />
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
          <Textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={3} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => router.back()}>キャンセル</Button>
          <Button onClick={handleSave} disabled={saving || !form.modelName}>
            {saving ? "保存中..." : "保存する"}
          </Button>
        </div>
      </div>
    </div>
  )
}
