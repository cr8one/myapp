"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import { SearchAssistInput, SelectOption } from "@/components/ui/searchable-select-modal"

type Device = {
  deviceId: number; assetNo: string | null; deviceName: string; hostname: string | null
  modelId: number | null; serialNo: string | null; osVersion: string | null
  memorySize: string | null; storageSize: string | null; location: string | null
  userId: string | null; accountName: string | null; purchaseDate: string | null; startDate: string | null
  status: string | null; managementType: string | null; remark: string | null
  parentDeviceId: number | null; procurementType: string | null
  lease: { lease_company: string | null; lease_start: string | null; lease_end: string | null; contract_no: string | null; lease_item_no: string | null } | null
}
type DeviceModel = { modelId: number; modelName: string; vendorName: string | null }
type Master = { id: number; category: string; value: string }

const emptyDeviceForm = {
  assetNo: "", deviceName: "", hostname: "", modelId: "", serialNo: "",
  osVersion: "", memorySize: "", storageSize: "", location: "", userId: "", accountName: "",
  purchaseDate: "", startDate: "", status: "", managementType: "", remark: "",
  parentDeviceId: "", procurementType: "", leaseCompany: "", leaseStart: "", leaseEnd: "", contractNo: "", leaseItemNo: "",
}

export default function DeviceEditPage() {
  const params = useParams()
  const router = useRouter()
  const deviceId = params.id as string
  const [deviceForm, setDeviceForm] = useState(emptyDeviceForm)
  const [models, setModels] = useState<DeviceModel[]>([])
  const [masters, setMasters] = useState<Master[]>([])
  const [allDevices, setAllDevices] = useState<Device[]>([])
  const [userOptions, setUserOptions] = useState<SelectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const getMasterValues = (category: string) => masters.filter(m => m.category === category).map(m => m.value)
  const parentCandidates = allDevices.filter(d => d.deviceId.toString() !== deviceId)

  useEffect(() => {
    Promise.all([
      fetch("/api/terminal/devices").then(r => r.json()),
      fetch("/api/terminal/device-models").then(r => r.json()),
      fetch("/api/terminal/terminal-masters").then(r => r.json()),
      fetch("/api/users/list").then(r => r.json()),
    ]).then(([allDevices, models, masters, users]: [Device[], DeviceModel[], Master[], { id: string; name: string | null; furiganaLastName?: string | null }[]]) => {
      const device = allDevices.find(d => d.deviceId === parseInt(deviceId))
      if (!device) { setLoading(false); return }
      setModels(models)
      setMasters(masters)
      setAllDevices(allDevices)
      setUserOptions(users.map(u => ({ id: u.id, label: u.name ?? "", kana: u.furiganaLastName ?? undefined })))
      setDeviceForm({
        assetNo: device.assetNo ?? "", deviceName: device.deviceName,
        hostname: device.hostname ?? "", modelId: device.modelId?.toString() ?? "",
        serialNo: device.serialNo ?? "", osVersion: device.osVersion ?? "",
        memorySize: device.memorySize ?? "", storageSize: device.storageSize ?? "",
        location: device.location ?? "", userId: device.userId ?? "", accountName: device.accountName ?? "",
        purchaseDate: device.purchaseDate ? device.purchaseDate.split("T")[0] : "",
        startDate: device.startDate ? device.startDate.split("T")[0] : "",
        procurementType: device.procurementType ?? "",
        leaseCompany: device.lease?.lease_company ?? "",
        leaseStart: device.lease?.lease_start ? device.lease.lease_start.split("T")[0] : "",
        leaseEnd: device.lease?.lease_end ? device.lease.lease_end.split("T")[0] : "",
        contractNo: device.lease?.contract_no ?? "",
        leaseItemNo: device.lease?.lease_item_no ?? "",
        status: device.status ?? "", managementType: device.managementType ?? "",
        remark: device.remark ?? "", parentDeviceId: device.parentDeviceId?.toString() ?? "",
      })
      setLoading(false)
    })
  }, [deviceId])

  const handleSave = async () => {
    if (!deviceForm.deviceName) return
    setSaving(true)
    try {
      await fetch("/api/terminal/devices", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...deviceForm, deviceId: parseInt(deviceId) }),
      })
      router.push(`/dashboard/terminal/devices/${deviceId}`)
    } finally { setSaving(false) }
  }

  if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">読み込み中...</div>

  return (
    <div className="p-6 max-w-4xl">
      <button onClick={() => router.push(`/dashboard/terminal/devices/${deviceId}`)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" />詳細に戻る
      </button>
      <h1 className="text-lg font-bold text-gray-800 mb-4">端末を編集</h1>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label>端末名 <span className="text-red-500">*</span></Label>
          <Input value={deviceForm.deviceName} onChange={e => setDeviceForm(f => ({ ...f, deviceName: e.target.value }))} autoComplete="off" /></div>
        <div className="space-y-1"><Label>資産番号</Label>
          <Input value={deviceForm.assetNo} onChange={e => setDeviceForm(f => ({ ...f, assetNo: e.target.value }))} autoComplete="off" /></div>
        <div className="space-y-1"><Label>ホスト名</Label>
          <Input value={deviceForm.hostname} onChange={e => setDeviceForm(f => ({ ...f, hostname: e.target.value }))} autoComplete="off" /></div>
        <div className="space-y-1"><Label>機種</Label>
          <select value={deviceForm.modelId} onChange={e => {
            const selected = models.find(m => m.modelId === parseInt(e.target.value)) as any
            setDeviceForm(f => ({ ...f, modelId: e.target.value, osVersion: selected?.osName || f.osVersion, memorySize: selected?.memoryDefault || f.memorySize, storageSize: selected?.storageDefault || f.storageSize }))
          }} className="w-full h-10 border rounded px-3 text-sm bg-white">
            <option value="">未選択</option>
            {models.map(m => <option key={m.modelId} value={m.modelId}>{m.modelName}</option>)}
          </select>
        </div>
        <div className="space-y-1"><Label>シリアル番号</Label>
          <Input value={deviceForm.serialNo} onChange={e => setDeviceForm(f => ({ ...f, serialNo: e.target.value }))} autoComplete="off" /></div>
        <div className="space-y-1"><Label>実OS</Label>
          <Input value={deviceForm.osVersion} onChange={e => setDeviceForm(f => ({ ...f, osVersion: e.target.value }))} autoComplete="off" /></div>
        <div className="space-y-1"><Label>実メモリ</Label>
          <Input value={deviceForm.memorySize} onChange={e => setDeviceForm(f => ({ ...f, memorySize: e.target.value }))} placeholder="例：16GB" autoComplete="off" /></div>
        <div className="space-y-1"><Label>実容量</Label>
          <Input value={deviceForm.storageSize} onChange={e => setDeviceForm(f => ({ ...f, storageSize: e.target.value }))} placeholder="例：512GB SSD" autoComplete="off" /></div>
        <div className="space-y-1"><Label>設置場所</Label>
          <Input value={deviceForm.location} onChange={e => setDeviceForm(f => ({ ...f, location: e.target.value }))} list="location-list" autoComplete="off" />
          <datalist id="location-list">{getMasterValues("設置場所").map(v => <option key={v} value={v} />)}</datalist>
        </div>
        <div className="space-y-1"><Label>利用者</Label>
          <SearchAssistInput label="利用者" options={userOptions} indexFilter
            value={deviceForm.userId} onChange={(v) => setDeviceForm(f => ({ ...f, userId: v }))} placeholder="氏名を入力、または検索から選択（共有PC等は自由記述可）" /></div>
        <div className="space-y-1"><Label>アカウント名</Label>
          <Input value={deviceForm.accountName} onChange={e => setDeviceForm(f => ({ ...f, accountName: e.target.value }))} placeholder="例：ログインID" autoComplete="off" /></div>
        <div className="space-y-1"><Label>調達区分</Label>
          <select value={deviceForm.procurementType} onChange={e => setDeviceForm(f => ({ ...f, procurementType: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm bg-white">
            <option value="">-- 選択 --</option>
            <option value="購入">購入</option>
            <option value="リース">リース</option>
          </select></div>
        {deviceForm.procurementType === "購入" && (
        <div className="space-y-1"><Label>購入日</Label>
          <Input type="date" value={deviceForm.purchaseDate} onChange={e => setDeviceForm(f => ({ ...f, purchaseDate: e.target.value }))} /></div>
        )}
        {deviceForm.procurementType === "リース" && (<>
        <div className="space-y-1"><Label>リース会社</Label>
          <select value={deviceForm.leaseCompany} onChange={e => setDeviceForm(f => ({ ...f, leaseCompany: e.target.value }))}
            className="w-full h-10 border rounded px-3 text-sm bg-white">
            <option value="">未選択</option>
            {getMasterValues("リース会社").map(v => <option key={v} value={v}>{v}</option>)}
          </select></div>
        <div className="space-y-1"><Label>レンタル開始日</Label>
          <Input type="date" value={deviceForm.leaseStart} onChange={e => setDeviceForm(f => ({ ...f, leaseStart: e.target.value }))} /></div>
        <div className="space-y-1"><Label>レンタル終了日</Label>
          <Input type="date" value={deviceForm.leaseEnd} onChange={e => setDeviceForm(f => ({ ...f, leaseEnd: e.target.value }))} /></div>
        <div className="space-y-1"><Label>契約番号</Label>
          <Input value={deviceForm.contractNo} onChange={e => setDeviceForm(f => ({ ...f, contractNo: e.target.value }))} autoComplete="off" /></div>
        <div className="space-y-1"><Label>レンタル物件No</Label>
          <Input value={deviceForm.leaseItemNo} onChange={e => setDeviceForm(f => ({ ...f, leaseItemNo: e.target.value }))} autoComplete="off" /></div>
        </>)}
        <div className="space-y-1"><Label>利用開始日</Label>
          <Input type="date" value={deviceForm.startDate} onChange={e => setDeviceForm(f => ({ ...f, startDate: e.target.value }))} /></div>
        <div className="space-y-1"><Label>状態</Label>
          <Input value={deviceForm.status} onChange={e => setDeviceForm(f => ({ ...f, status: e.target.value }))} list="status-list" autoComplete="off" />
          <datalist id="status-list">{getMasterValues("状態").map(v => <option key={v} value={v} />)}</datalist>
        </div>
        <div className="space-y-1"><Label>管理区分</Label>
          <Input value={deviceForm.managementType} onChange={e => setDeviceForm(f => ({ ...f, managementType: e.target.value }))} list="management-list" autoComplete="off" />
          <datalist id="management-list">{getMasterValues("管理区分").map(v => <option key={v} value={v} />)}</datalist>
        </div>
        <div className="col-span-2 space-y-1"><Label>備考</Label>
          <Textarea value={deviceForm.remark} onChange={e => setDeviceForm(f => ({ ...f, remark: e.target.value }))} rows={3} placeholder="端末固有の備考" />
        </div>
        <div className="col-span-2 space-y-1"><Label>親端末（仮想マシンの場合に選択）</Label>
          <select value={deviceForm.parentDeviceId} onChange={e => setDeviceForm(f => ({ ...f, parentDeviceId: e.target.value }))}
            className="w-full h-10 border rounded px-3 text-sm bg-white">
            <option value="">なし（物理端末）</option>
            {parentCandidates.map(d => <option key={d.deviceId} value={d.deviceId}>{d.deviceName}{d.assetNo ? ` (${d.assetNo})` : ""}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={() => router.push(`/dashboard/terminal/devices/${deviceId}`)}>キャンセル</Button>
        <Button onClick={handleSave} disabled={saving || !deviceForm.deviceName}>
          {saving ? "保存中..." : "保存"}
        </Button>
      </div>
    </div>
  )
}
