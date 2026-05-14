"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Search, Download, Upload, Pencil, Trash2 } from "lucide-react"

type DeviceModel = {
  modelId: number
  vendorName: string | null
  deviceTypeId: number | null
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

const emptyForm = {
  vendorName: "", deviceTypeId: "", modelName: "", modelNumber: "",
  osName: "", cpuInfo: "", memoryDefault: "", storageDefault: "",
  eolDate: "", imagePath: "", note: "",
}

export default function DeviceModelsPage() {
  const [records, setRecords] = useState<DeviceModel[]>([])
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<DeviceModel | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DeviceModel | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importMessage, setImportMessage] = useState("")
  const importRef = useRef<HTMLInputElement>(null)

  const fetchSignedUrl = async (key: string): Promise<string> => {
    if (signedUrls[key]) return signedUrls[key]
    const res = await fetch(`/api/terminal/device-models?type=signed-url&key=${encodeURIComponent(key)}`)
    const { url } = await res.json()
    setSignedUrls(prev => ({ ...prev, [key]: url }))
    return url
  }

  const fetchRecords = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (keyword) params.set("keyword", keyword)
    const res = await fetch(`/api/terminal/device-models?${params.toString()}`)
    const data: DeviceModel[] = await res.json()
    setRecords(data)
    setLoading(false)
    for (const r of data) {
      if (r.imagePath) fetchSignedUrl(r.imagePath)
    }
  }

  useEffect(() => { fetchRecords() }, [])

  const openCreate = () => {
    setEditTarget(null)
    setForm(emptyForm)
    setImageFile(null)
    setImagePreview(null)
    setDialogOpen(true)
  }

  const openEdit = async (r: DeviceModel) => {
    setEditTarget(r)
    setForm({
      vendorName: r.vendorName ?? "",
      deviceTypeId: r.deviceTypeId?.toString() ?? "",
      modelName: r.modelName,
      modelNumber: r.modelNumber ?? "",
      osName: r.osName ?? "",
      cpuInfo: r.cpuInfo ?? "",
      memoryDefault: r.memoryDefault ?? "",
      storageDefault: r.storageDefault ?? "",
      eolDate: r.eolDate ? r.eolDate.split("T")[0] : "",
      imagePath: r.imagePath ?? "",
      note: r.note ?? "",
    })
    setImageFile(null)
    if (r.imagePath) {
      const url = await fetchSignedUrl(r.imagePath)
      setImagePreview(url)
    } else {
      setImagePreview(null)
    }
    setDialogOpen(true)
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
    if (!form.modelName) return
    setSaving(true)
    try {
      let imagePath = form.imagePath
      if (imageFile) imagePath = await uploadImage(imageFile)
      const body = { ...form, imagePath }
      if (editTarget) {
        await fetch("/api/terminal/device-models", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, modelId: editTarget.modelId }),
        })
      } else {
        await fetch("/api/terminal/device-models", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      }
      setDialogOpen(false)
      setSignedUrls({})
      fetchRecords()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await fetch("/api/terminal/device-models", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.modelId }),
    })
    setDeleteTarget(null)
    fetchRecords()
  }

  const handleExport = () => { window.location.href = "/api/terminal/device-models/export" }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportMessage("インポート中...")
    try {
      const text = await file.text()
      const lines = text.split("\n").filter(Boolean)
      const dataLines = lines.slice(1)
      let count = 0
      for (const line of dataLines) {
        const cols = line.split(",").map(v => v.replace(/^"|"$/g, "").replace(/""/g, '"'))
        const [, vendorName, deviceTypeId, modelName, modelNumber, osName, cpuInfo, memoryDefault, storageDefault, eolDate, imagePath, note] = cols
        if (!modelName) continue
        await fetch("/api/terminal/device-models", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vendorName, deviceTypeId, modelName, modelNumber, osName, cpuInfo, memoryDefault, storageDefault, eolDate, imagePath, note }),
        })
        count++
      }
      setImportMessage(`インポート完了：${count}件`)
      fetchRecords()
    } catch (err: any) {
      setImportMessage(`エラー：${err.message}`)
    } finally {
      setImporting(false)
      if (importRef.current) importRef.current.value = ""
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">機種マスタ</h1>
          <p className="text-sm text-gray-500 mt-1">{records.length}件</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-1">
            <Download className="w-4 h-4" />CSVエクスポート
          </Button>
          <Button variant="outline" size="sm" onClick={() => importRef.current?.click()} disabled={importing} className="flex items-center gap-1">
            <Upload className="w-4 h-4" />CSVインポート
          </Button>
          <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <Button size="sm" onClick={openCreate} className="flex items-center gap-1">
            <Plus className="w-4 h-4" />新規作成
          </Button>
        </div>
      </div>

      {importMessage && (
        <p className={`mb-4 text-sm px-4 py-2 rounded ${importMessage.startsWith("エラー") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
          {importMessage}
        </p>
      )}

      <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex gap-3 items-end">
          <div className="flex-1 min-w-40">
            <Input value={keyword} onChange={e => setKeyword(e.target.value)}
              placeholder="機種名・型番・OS・メーカーで検索"
              onKeyDown={e => { if (e.key === "Enter") fetchRecords() }}
              autoComplete="off" />
          </div>
          <Button onClick={fetchRecords} className="flex items-center gap-1">
            <Search className="w-4 h-4" />検索
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p>
      ) : records.length === 0 ? (
        <p className="text-center text-gray-500 py-8">データがありません。</p>
      ) : (
        <div className="border rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">画像</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">機種名</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">メーカー</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">型番</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">標準OS</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">CPU</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">標準メモリ</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">標準容量</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">保守期限</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">備考</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map(r => (
                  <tr key={r.modelId} className="hover:bg-blue-50">
                    <td className="px-3 py-2">
                      {r.imagePath && signedUrls[r.imagePath] ? (
                        <img src={signedUrls[r.imagePath]} alt={r.modelName}
                          className="w-12 h-12 object-contain rounded border bg-gray-50" />
                      ) : (
                        <div className="w-12 h-12 rounded border bg-gray-100 flex items-center justify-center text-gray-300 text-xs">
                          {r.imagePath ? "..." : "なし"}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 font-medium">{r.modelName}</td>
                    <td className="px-3 py-2 text-gray-500">{r.vendorName ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2 text-gray-500">{r.modelNumber ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2 text-gray-500">{r.osName ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2 text-gray-500">{r.cpuInfo ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2 text-gray-500">{r.memoryDefault ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2 text-gray-500">{r.storageDefault ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2 text-gray-500">{r.eolDate ? new Date(r.eolDate).toLocaleDateString("ja-JP") : <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2 text-gray-500 max-w-[200px] whitespace-pre-wrap">{r.note ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(r)} className="p-1 text-gray-400 hover:text-blue-600 rounded"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteTarget(r)} className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? "機種を編集" : "機種を新規作成"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>機種名 <span className="text-red-500">*</span></Label>
              <Input value={form.modelName} onChange={e => setForm(f => ({ ...f, modelName: e.target.value }))} autoComplete="off" />
            </div>
            <div className="space-y-1">
              <Label>メーカー</Label>
              <Input value={form.vendorName} onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))} placeholder="例：Apple、Dell、Lenovo" autoComplete="off" />
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
            <div className="grid grid-cols-2 gap-3">
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
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
              <Button onClick={handleSave} disabled={saving || !form.modelName}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>削除の確認</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-2">「{deleteTarget?.modelName}」を削除しますか？この操作は取り消せません。</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>キャンセル</Button>
            <Button variant="destructive" onClick={handleDelete}>削除</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
