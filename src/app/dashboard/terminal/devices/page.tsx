"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Search, Pencil, Trash2, Monitor, Server } from "lucide-react"

type DeviceIp = { id: number; ip: string; subnet: string | null; gateway: string | null; interface: string | null; note: string | null }
type ChildDevice = { deviceId: number; deviceName: string; status: string | null }
type Device = {
  deviceId: number; assetNo: string | null; deviceName: string; hostname: string | null
  modelId: number | null; serialNo: string | null; osVersion: string | null
  memorySize: string | null; storageSize: string | null; location: string | null
  userId: string | null; purchaseDate: string | null; startDate: string | null
  status: string | null; managementType: string | null; remark: string | null
  parentDeviceId: number | null
  ipAddresses: DeviceIp[]
  children: ChildDevice[]
}
type DeviceModel = { modelId: number; modelName: string; vendorName: string | null; osName: string | null; cpuInfo: string | null; memoryDefault: string | null; storageDefault: string | null }
type Master = { id: number; category: string; value: string }

const emptyForm = {
  assetNo: "", deviceName: "", hostname: "", modelId: "", serialNo: "",
  osVersion: "", memorySize: "", storageSize: "", location: "", userId: "",
  purchaseDate: "", startDate: "", status: "", managementType: "", remark: "",
  parentDeviceId: "",
}

const STATUS_COLORS: Record<string, string> = {
  "使用中": "bg-green-100 text-green-700",
  "保管中": "bg-blue-100 text-blue-700",
  "修理中": "bg-yellow-100 text-yellow-700",
  "廃棄済": "bg-red-100 text-red-700",
}

export default function DevicesPage() {
  const router = useRouter()
  const [records, setRecords] = useState<Device[]>([])
  const [models, setModels] = useState<DeviceModel[]>([])
  const [masters, setMasters] = useState<Master[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Device | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null)

  const getMasterValues = (category: string) => masters.filter(m => m.category === category).map(m => m.value)

  const fetchAll = async () => {
    setLoading(true)
    const [devRes, modRes, masRes] = await Promise.all([
      fetch(`/api/terminal/devices?${new URLSearchParams({ ...(keyword ? { keyword } : {}), ...(statusFilter ? { status: statusFilter } : {}) }).toString()}`),
      fetch("/api/terminal/device-models"),
      fetch("/api/terminal/terminal-masters"),
    ])
    setRecords(await devRes.json())
    setModels(await modRes.json())
    setMasters(await masRes.json())
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const getModelName = (modelId: number | null) => {
    if (!modelId) return null
    const m = models.find(m => m.modelId === modelId)
    return m ? `${m.vendorName ? m.vendorName + " " : ""}${m.modelName}` : null
  }

  const getDeviceName = (deviceId: number) => {
    const d = records.find(r => r.deviceId === deviceId)
    return d ? d.deviceName : `ID:${deviceId}`
  }

  const openCreate = () => {
    setEditTarget(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (r: Device) => {
    setEditTarget(r)
    setForm({
      assetNo: r.assetNo ?? "", deviceName: r.deviceName, hostname: r.hostname ?? "",
      modelId: r.modelId?.toString() ?? "", serialNo: r.serialNo ?? "",
      osVersion: r.osVersion ?? "", memorySize: r.memorySize ?? "",
      storageSize: r.storageSize ?? "", location: r.location ?? "",
      userId: r.userId ?? "",
      purchaseDate: r.purchaseDate ? r.purchaseDate.split("T")[0] : "",
      startDate: r.startDate ? r.startDate.split("T")[0] : "",
      status: r.status ?? "", managementType: r.managementType ?? "", remark: r.remark ?? "",
      parentDeviceId: r.parentDeviceId?.toString() ?? "",
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.deviceName) return
    setSaving(true)
    try {
      if (editTarget) {
        await fetch("/api/terminal/devices", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, deviceId: editTarget.deviceId }),
        })
      } else {
        await fetch("/api/terminal/devices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      }
      setDialogOpen(false)
      fetchAll()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await fetch("/api/terminal/devices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.deviceId }),
    })
    setDeleteTarget(null)
    fetchAll()
  }

  // 編集対象以外の端末（自分自身は親に選べない）
  const parentCandidates = records.filter(r => r.deviceId !== editTarget?.deviceId)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">端末一覧</h1>
          <p className="text-sm text-gray-500 mt-1">{records.length}件</p>
        </div>
        <Button size="sm" onClick={openCreate} className="flex items-center gap-1">
          <Plus className="w-4 h-4" />新規登録
        </Button>
      </div>

      <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-40">
            <Input value={keyword} onChange={e => setKeyword(e.target.value)}
              placeholder="端末名・資産番号・ホスト名・シリアル・場所・利用者で検索"
              onKeyDown={e => { if (e.key === "Enter") fetchAll() }}
              autoComplete="off" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="h-10 border rounded px-3 text-sm bg-white">
            <option value="">状態：すべて</option>
            {getMasterValues("状態").map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <Button onClick={fetchAll} className="flex items-center gap-1">
            <Search className="w-4 h-4" />検索
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p>
      ) : records.length === 0 ? (
        <p className="text-center text-gray-500 py-8">データがありません。</p>
      ) : (
        <div className="space-y-3">
          {records.map(r => (
            <div key={r.deviceId}
              className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => router.push(`/dashboard/terminal/devices/${r.deviceId}`)}>
              <div className="p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  {r.children.length > 0
                    ? <Server className="w-5 h-5 text-slate-500" />
                    : <Monitor className="w-5 h-5 text-slate-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900">{r.deviceName}</span>
                    {r.assetNo && <span className="text-xs text-gray-400 font-mono">{r.assetNo}</span>}
                    {r.parentDeviceId && (
                      <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                        VM / {getDeviceName(r.parentDeviceId)}
                      </span>
                    )}
                    {r.status && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {r.status}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                    {getModelName(r.modelId) && <span>{getModelName(r.modelId)}</span>}
                    {r.serialNo && <span>S/N: {r.serialNo}</span>}
                    {r.location && <span>📍 {r.location}</span>}
                    {r.userId && <span>👤 {r.userId}</span>}
                  </div>
                  {r.ipAddresses.length > 0 && (
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {r.ipAddresses.map(ip => (
                        <span key={ip.id} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-mono">
                          {ip.ip}{ip.interface ? ` (${ip.interface})` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                  {r.children.length > 0 && (
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {r.children.map(c => (
                        <span key={c.deviceId} className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">
                          VM: {c.deviceName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(r)} className="p-1 text-gray-400 hover:text-blue-600 rounded"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteTarget(r)} className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? "端末を編集" : "端末を新規登録"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
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
                  const selected = models.find(m => m.modelId === parseInt(e.target.value))
                  setForm(f => ({
                    ...f,
                    modelId: e.target.value,
                    osVersion: selected?.osName || f.osVersion,
                    memorySize: selected?.memoryDefault || f.memorySize,
                    storageSize: selected?.storageDefault || f.storageSize,
                  }))
                }}
                className="w-full h-10 border rounded px-3 text-sm bg-white">
                <option value="">未選択</option>
                {models.map(m => <option key={m.modelId} value={m.modelId}>{m.vendorName ? `${m.vendorName} ` : ""}{m.modelName}</option>)}
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
              <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                list="location-list" autoComplete="off" />
              <datalist id="location-list">
                {getMasterValues("設置場所").map(v => <option key={v} value={v} />)}
              </datalist>
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
              <Input value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                list="status-list" autoComplete="off" />
              <datalist id="status-list">
                {getMasterValues("状態").map(v => <option key={v} value={v} />)}
              </datalist>
            </div>
            <div className="space-y-1">
              <Label>管理区分</Label>
              <Input value={form.managementType} onChange={e => setForm(f => ({ ...f, managementType: e.target.value }))}
                list="management-list" autoComplete="off" />
              <datalist id="management-list">
                {getMasterValues("管理区分").map(v => <option key={v} value={v} />)}
              </datalist>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>親端末（仮想マシンの場合に選択）</Label>
              <select value={form.parentDeviceId} onChange={e => setForm(f => ({ ...f, parentDeviceId: e.target.value }))}
                className="w-full h-10 border rounded px-3 text-sm bg-white">
                <option value="">なし（物理端末）</option>
                {parentCandidates.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>{d.deviceName}{d.assetNo ? ` (${d.assetNo})` : ""}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>備考</Label>
              <Textarea value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={saving || !form.deviceName}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>削除の確認</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-2">「{deleteTarget?.deviceName}」を削除しますか？この操作は取り消せません。</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>キャンセル</Button>
            <Button variant="destructive" onClick={handleDelete}>削除</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
