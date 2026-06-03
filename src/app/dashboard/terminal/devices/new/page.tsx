"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
type DeviceModel = { modelId: number; modelName: string; vendorName: string | null }
type Master = { id: number; category: string; value: string }
type Device = { deviceId: number; deviceName: string; assetNo: string | null }
const emptyForm = {
  assetNo: "", deviceName: "", hostname: "", modelId: "", serialNo: "",
  osVersion: "", memorySize: "", storageSize: "", location: "", userId: "",
  purchaseDate: "", startDate: "", status: "", managementType: "", remark: "",
  parentDeviceId: "",
}
export default function DeviceNewPage() {
  const router = useRouter()
  const [form, setForm] = useState(emptyForm)
  const [models, setModels] = useState<DeviceModel[]>([])
  const [masters, setMasters] = useState<Master[]>([])
  const [allDevices, setAllDevices] = useState<Device[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const getMasterValues = (category: string) => masters.filter(m => m.category === category).map(m => m.value)
  useEffect(() => {
    fetch("/api/terminal/device-models").then(r => r.json()).then(setModels)
    fetch("/api/terminal/terminal-masters").then(r => r.json()).then(setMasters)
    fetch("/api/terminal/devices").then(r => r.json()).then(setAllDevices)
  }, [])
  const handleSave = async () => {
    if (!form.deviceName) { setError("端末名は必須です"); return }
    setSaving(true); setError("")
    try {
      const res = await fetch("/api/terminal/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          modelId: form.modelId ? parseInt(form.modelId) : null,
          parentDeviceId: form.parentDeviceId ? parseInt(form.parentDeviceId) : null,
        }),
      })
      if (!res.ok) throw new Error("保存に失敗しました")
      const created = await res.json()
      router.push(`/dashboard/terminal/devices/${created.deviceId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました")
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />一覧に戻る
        </button>
        <h1 className="text-xl font-bold">端末を追加</h1>
      </div>
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>端末名 <span className="text-red-500">*</span></Label>
            <Input value={form.deviceName} onChange={e => setForm(f => ({ ...f, deviceName: e.target.value }))} autoComplete="off" />
          </div>
          <div className="space-y-1">
            <Label>資産番号</Label>
            <Input value={form.assetNo} onChange={e => setForm(f => ({ ...f, assetNo: e.target.value }))} autoComplete="off" />
          </div>
          <div className="space-y-1">
            <Label>ホスト名</Label>
            <Input value={form.hostname} onChange={e => setForm(f => ({ ...f, hostname: e.target.value }))} autoComplete="off" />
          </div>
          <div className="space-y-1">
            <Label>機種</Label>
            <select value={form.modelId} onChange={e => {
              const selected = models.find(m => m.modelId === parseInt(e.target.value)) as any
              setForm(f => ({ ...f, modelId: e.target.value, osVersion: selected?.osName || f.osVersion, memorySize: selected?.memoryDefault || f.memorySize, storageSize: selected?.storageDefault || f.storageSize }))
            }} className="w-full h-10 border rounded px-3 text-sm bg-white">
              <option value="">未選択</option>
              {models.map(m => <option key={m.modelId} value={m.modelId}>{m.modelName}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label>シリアル番号</Label>
            <Input value={form.serialNo} onChange={e => setForm(f => ({ ...f, serialNo: e.target.value }))} autoComplete="off" />
          </div>
          <div className="space-y-1">
            <Label>実OS</Label>
            <Input value={form.osVersion} onChange={e => setForm(f => ({ ...f, osVersion: e.target.value }))} autoComplete="off" />
          </div>
          <div className="space-y-1">
            <Label>実メモリ</Label>
            <Input value={form.memorySize} onChange={e => setForm(f => ({ ...f, memorySize: e.target.value }))} placeholder="例：16GB" autoComplete="off" />
          </div>
          <div className="space-y-1">
            <Label>実容量</Label>
            <Input value={form.storageSize} onChange={e => setForm(f => ({ ...f, storageSize: e.target.value }))} placeholder="例：512GB SSD" autoComplete="off" />
          </div>
          <div className="space-y-1">
            <Label>設置場所</Label>
            <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} list="location-list" autoComplete="off" />
            <datalist id="location-list">{getMasterValues("設置場所").map(v => <option key={v} value={v} />)}</datalist>
          </div>
          <div className="space-y-1">
            <Label>利用者</Label>
            <Input value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))} autoComplete="off" />
          </div>
          <div className="space-y-1">
            <Label>購入日</Label>
            <Input type="date" value={form.purchaseDate} onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>利用開始日</Label>
            <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>状態</Label>
            <Input value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} list="status-list" autoComplete="off" />
            <datalist id="status-list">{getMasterValues("状態").map(v => <option key={v} value={v} />)}</datalist>
          </div>
          <div className="space-y-1">
            <Label>管理区分</Label>
            <Input value={form.managementType} onChange={e => setForm(f => ({ ...f, managementType: e.target.value }))} list="management-list" autoComplete="off" />
            <datalist id="management-list">{getMasterValues("管理区分").map(v => <option key={v} value={v} />)}</datalist>
          </div>
          <div className="col-span-2 space-y-1">
            <Label>親端末（仮想マシンの場合に選択）</Label>
            <select value={form.parentDeviceId} onChange={e => setForm(f => ({ ...f, parentDeviceId: e.target.value }))}
              className="w-full h-10 border rounded px-3 text-sm bg-white">
              <option value="">なし（物理端末）</option>
              {allDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.deviceName}{d.assetNo ? ` (${d.assetNo})` : ""}</option>)}
            </select>
          </div>
          <div className="col-span-2 space-y-1">
            <Label>備考</Label>
            <Textarea value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} rows={3} placeholder="端末固有の備考" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => router.back()}>キャンセル</Button>
          <Button onClick={handleSave} disabled={saving || !form.deviceName}>
            {saving ? "保存中..." : "保存する"}
          </Button>
        </div>
      </div>
    </div>
  )
}
