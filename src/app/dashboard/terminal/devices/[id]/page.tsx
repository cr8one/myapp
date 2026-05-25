"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react"
type DeviceIp = { id: number; ip: string; subnet: string | null; gateway: string | null; interface: string | null; note: string | null }
type DeviceSoftware = {
  id: number
  softwareId: number
  version: string | null
  note: string | null
  userId: string | null
  software: { id: number; name: string; version: string | null; vendor: string | null; licenseType: string | null }
}
type MSoftware = { id: number; name: string; version: string | null; vendor: string | null }
type Device = {
  deviceId: number; assetNo: string | null; deviceName: string; hostname: string | null
  modelId: number | null; serialNo: string | null; osVersion: string | null
  memorySize: string | null; storageSize: string | null; location: string | null
  userId: string | null; purchaseDate: string | null; startDate: string | null
  status: string | null; managementType: string | null; remark: string | null
  ipAddresses: DeviceIp[]
}
type DeviceModel = { modelId: number; modelName: string; vendorName: string | null; imagePath: string | null }
const STATUS_COLORS: Record<string, string> = {
  "使用中": "bg-green-100 text-green-700",
  "保管中": "bg-blue-100 text-blue-700",
  "修理中": "bg-yellow-100 text-yellow-700",
  "廃棄済": "bg-red-100 text-red-700",
}
const emptyIpForm = { ip: "", subnet: "", gateway: "", interface: "", note: "" }
const emptySoftwareForm = { softwareId: "", version: "", note: "", userId: "" }
export default function DeviceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const deviceId = params.id as string
  const [device, setDevice] = useState<Device | null>(null)
  const [model, setModel] = useState<DeviceModel | null>(null)
  const [modelImageUrl, setModelImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // IP
  const [ipDialogOpen, setIpDialogOpen] = useState(false)
  const [editIpTarget, setEditIpTarget] = useState<DeviceIp | null>(null)
  const [ipForm, setIpForm] = useState(emptyIpForm)
  const [savingIp, setSavingIp] = useState(false)
  const [deleteIpTarget, setDeleteIpTarget] = useState<DeviceIp | null>(null)
  // Software
  const [softwares, setSoftwares] = useState<DeviceSoftware[]>([])
  const [softwareMasters, setSoftwareMasters] = useState<MSoftware[]>([])
  const [swDialogOpen, setSwDialogOpen] = useState(false)
  const [editSwTarget, setEditSwTarget] = useState<DeviceSoftware | null>(null)
  const [swForm, setSwForm] = useState(emptySoftwareForm)
  const [savingSw, setSavingSw] = useState(false)
  const [deleteSwTarget, setDeleteSwTarget] = useState<DeviceSoftware | null>(null)
  const fetchDevice = async () => {
    const res = await fetch("/api/terminal/devices")
    const all: Device[] = await res.json()
    const found = all.find(d => d.deviceId === parseInt(deviceId))
    if (!found) { setLoading(false); return }
    setDevice(found)
    if (found.modelId) {
      const modRes = await fetch("/api/terminal/device-models")
      const models: DeviceModel[] = await modRes.json()
      const m = models.find(m => m.modelId === found.modelId)
      if (m) {
        setModel(m)
        if (m.imagePath) {
          const imgRes = await fetch(`/api/terminal/device-models?type=signed-url&key=${encodeURIComponent(m.imagePath)}`)
          const { url } = await imgRes.json()
          setModelImageUrl(url)
        }
      }
    }
    setLoading(false)
  }
  const fetchSoftwares = async () => {
    const res = await fetch(`/api/terminal/device-software?deviceId=${deviceId}`)
    const data = await res.json()
    setSoftwares(data)
  }
  useEffect(() => {
    fetchDevice()
    fetchSoftwares()
    fetch("/api/terminal/software").then(r => r.json()).then(setSoftwareMasters)
  }, [deviceId])
  // IP handlers
  const openAddIp = () => { setEditIpTarget(null); setIpForm(emptyIpForm); setIpDialogOpen(true) }
  const openEditIp = (ip: DeviceIp) => {
    setEditIpTarget(ip)
    setIpForm({ ip: ip.ip, subnet: ip.subnet ?? "", gateway: ip.gateway ?? "", interface: ip.interface ?? "", note: ip.note ?? "" })
    setIpDialogOpen(true)
  }
  const handleSaveIp = async () => {
    if (!ipForm.ip) return
    setSavingIp(true)
    try {
      if (editIpTarget) {
        await fetch("/api/terminal/device-ips", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editIpTarget.id, ...ipForm }) })
      } else {
        await fetch("/api/terminal/device-ips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId, ...ipForm }) })
      }
      setIpDialogOpen(false)
      fetchDevice()
    } finally { setSavingIp(false) }
  }
  const handleDeleteIp = async () => {
    if (!deleteIpTarget) return
    await fetch("/api/terminal/device-ips", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleteIpTarget.id }) })
    setDeleteIpTarget(null)
    fetchDevice()
  }
  // Software handlers
  const openAddSw = () => { setEditSwTarget(null); setSwForm(emptySoftwareForm); setSwDialogOpen(true) }
  const openEditSw = (sw: DeviceSoftware) => {
    setEditSwTarget(sw)
    setSwForm({ softwareId: sw.softwareId.toString(), version: sw.version ?? "", note: sw.note ?? "", userId: sw.userId ?? "" })
    setSwDialogOpen(true)
  }
  const handleSaveSw = async () => {
    if (!swForm.softwareId) return
    setSavingSw(true)
    try {
      if (editSwTarget) {
        await fetch("/api/terminal/device-software", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editSwTarget.id, ...swForm }) })
      } else {
        await fetch("/api/terminal/device-software", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId, ...swForm }) })
      }
      setSwDialogOpen(false)
      fetchSoftwares()
    } finally { setSavingSw(false) }
  }
  const handleDeleteSw = async () => {
    if (!deleteSwTarget) return
    await fetch("/api/terminal/device-software", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleteSwTarget.id }) })
    setDeleteSwTarget(null)
    fetchSoftwares()
  }
  if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">読み込み中...</div>
  if (!device) return <div className="p-8 text-center text-gray-500">端末が見つかりません。</div>
  const val = (v: string | null | undefined) => v ?? <span className="text-gray-300">—</span>
  return (
    <div className="p-6 max-w-4xl">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" />一覧に戻る
      </button>
      {/* 端末情報 */}
      <div className="bg-white border rounded-xl shadow-sm p-6 mb-4">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-lg border bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {modelImageUrl
              ? <img src={modelImageUrl} alt={model?.modelName} className="w-full h-full object-contain" />
              : <span className="text-gray-300 text-xs">画像なし</span>}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold">{device.deviceName}</h1>
              {device.assetNo && <span className="text-sm text-gray-400 font-mono">{device.assetNo}</span>}
              {device.status && (
                <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[device.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {device.status}
                </span>
              )}
            </div>
            {model && <p className="text-gray-500 mb-3">{model.vendorName ? `${model.vendorName} ` : ""}{model.modelName}</p>}
            <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
              <div className="flex gap-2"><span className="text-gray-400 w-24 flex-shrink-0">シリアル番号</span><span>{val(device.serialNo)}</span></div>
              <div className="flex gap-2"><span className="text-gray-400 w-24 flex-shrink-0">ホスト名</span><span>{val(device.hostname)}</span></div>
              <div className="flex gap-2"><span className="text-gray-400 w-24 flex-shrink-0">実OS</span><span>{val(device.osVersion)}</span></div>
              <div className="flex gap-2"><span className="text-gray-400 w-24 flex-shrink-0">実メモリ</span><span>{val(device.memorySize)}</span></div>
              <div className="flex gap-2"><span className="text-gray-400 w-24 flex-shrink-0">実容量</span><span>{val(device.storageSize)}</span></div>
              <div className="flex gap-2"><span className="text-gray-400 w-24 flex-shrink-0">設置場所</span><span>{val(device.location)}</span></div>
              <div className="flex gap-2"><span className="text-gray-400 w-24 flex-shrink-0">利用者</span><span>{val(device.userId)}</span></div>
              <div className="flex gap-2"><span className="text-gray-400 w-24 flex-shrink-0">購入日</span><span>{device.purchaseDate ? new Date(device.purchaseDate).toLocaleDateString("ja-JP") : <span className="text-gray-300">—</span>}</span></div>
              <div className="flex gap-2"><span className="text-gray-400 w-24 flex-shrink-0">利用開始日</span><span>{device.startDate ? new Date(device.startDate).toLocaleDateString("ja-JP") : <span className="text-gray-300">—</span>}</span></div>
              <div className="flex gap-2"><span className="text-gray-400 w-24 flex-shrink-0">管理区分</span><span>{val(device.managementType)}</span></div>
            </div>
            {device.remark && (
              <div className="mt-3 text-sm">
                <span className="text-gray-400">備考　</span>
                <span className="whitespace-pre-wrap">{device.remark}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* IPアドレス */}
      <div className="bg-white border rounded-xl shadow-sm p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">IPアドレス</h2>
          <Button size="sm" onClick={openAddIp} className="flex items-center gap-1">
            <Plus className="w-4 h-4" />追加
          </Button>
        </div>
        {device.ipAddresses.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">IPアドレスが登録されていません。</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">IPアドレス</th>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">サブネットマスク</th>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">ゲートウェイ</th>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">インターフェース</th>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">備考</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {device.ipAddresses.map(ip => (
                <tr key={ip.id} className="hover:bg-blue-50">
                  <td className="px-3 py-2 font-mono">{ip.ip}</td>
                  <td className="px-3 py-2 text-gray-500">{ip.subnet ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-3 py-2 text-gray-500">{ip.gateway ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-3 py-2 text-gray-500">{ip.interface ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-3 py-2 text-gray-500">{ip.note ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => openEditIp(ip)} className="p-1 text-gray-400 hover:text-blue-600 rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteIpTarget(ip)} className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* インストールソフト */}
      <div className="bg-white border rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">インストールソフト</h2>
          <Button size="sm" onClick={openAddSw} className="flex items-center gap-1">
            <Plus className="w-4 h-4" />追加
          </Button>
        </div>
        {softwares.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">インストールされたソフトウェアが登録されていません。</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">ソフトウェア名</th>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">ベンダー</th>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">バージョン</th>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">ライセンス種別</th>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">利用者</th>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">備考</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {softwares.map(sw => (
                <tr key={sw.id} className="hover:bg-blue-50">
                  <td className="px-3 py-2 font-medium">{sw.software.name}</td>
                  <td className="px-3 py-2 text-gray-500">{sw.software.vendor ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-3 py-2 font-mono text-gray-500">
                    {sw.version
                      ? sw.version
                      : sw.software.version
                        ? <span className="text-gray-400">{sw.software.version}</span>
                        : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2 text-gray-500">{sw.software.licenseType ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-3 py-2 text-gray-500">
                    {sw.userId
                      ? <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{sw.userId}</span>
                      : <span className="text-gray-300 text-xs">共通</span>}
                  </td>
                  <td className="px-3 py-2 text-gray-500">{sw.note ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => openEditSw(sw)} className="p-1 text-gray-400 hover:text-blue-600 rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteSwTarget(sw)} className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* IP ダイアログ */}
      <Dialog open={ipDialogOpen} onOpenChange={setIpDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editIpTarget ? "IPアドレスを編集" : "IPアドレスを追加"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>IPアドレス <span className="text-red-500">*</span></Label>
              <Input value={ipForm.ip} onChange={e => setIpForm(f => ({ ...f, ip: e.target.value }))} placeholder="例：192.168.1.10" autoComplete="off" />
            </div>
            <div className="space-y-1">
              <Label>サブネットマスク</Label>
              <Input value={ipForm.subnet} onChange={e => setIpForm(f => ({ ...f, subnet: e.target.value }))} placeholder="例：255.255.255.0" autoComplete="off" />
            </div>
            <div className="space-y-1">
              <Label>ゲートウェイ</Label>
              <Input value={ipForm.gateway} onChange={e => setIpForm(f => ({ ...f, gateway: e.target.value }))} placeholder="例：192.168.1.1" autoComplete="off" />
            </div>
            <div className="space-y-1">
              <Label>インターフェース</Label>
              <Input value={ipForm.interface} onChange={e => setIpForm(f => ({ ...f, interface: e.target.value }))} placeholder="例：Ethernet、Wi-Fi" autoComplete="off" />
            </div>
            <div className="space-y-1">
              <Label>備考</Label>
              <Input value={ipForm.note} onChange={e => setIpForm(f => ({ ...f, note: e.target.value }))} autoComplete="off" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIpDialogOpen(false)}>キャンセル</Button>
              <Button onClick={handleSaveIp} disabled={savingIp || !ipForm.ip}>
                {savingIp ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* IP 削除確認 */}
      <Dialog open={!!deleteIpTarget} onOpenChange={v => !v && setDeleteIpTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>削除の確認</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-2">「{deleteIpTarget?.ip}」を削除しますか？</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteIpTarget(null)}>キャンセル</Button>
            <Button variant="destructive" onClick={handleDeleteIp}>削除</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* ソフトウェア ダイアログ */}
      <Dialog open={swDialogOpen} onOpenChange={setSwDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editSwTarget ? "インストールソフトを編集" : "インストールソフトを追加"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>ソフトウェア <span className="text-red-500">*</span></Label>
              <select
                value={swForm.softwareId}
                onChange={e => setSwForm(f => ({ ...f, softwareId: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">選択してください</option>
                {softwareMasters.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.vendor ? ` (${s.vendor})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>バージョン <span className="text-xs text-gray-400">（空欄の場合はマスタのバージョンを参照）</span></Label>
              <Input value={swForm.version} onChange={e => setSwForm(f => ({ ...f, version: e.target.value }))} placeholder="例：1.2.3" autoComplete="off" />
            </div>
            <div className="space-y-1">
              <Label>利用者 <span className="text-xs text-gray-400">（空欄の場合は端末共通）</span></Label>
              <Input value={swForm.userId} onChange={e => setSwForm(f => ({ ...f, userId: e.target.value }))} placeholder="例：山田太郎" autoComplete="off" />
            </div>
            <div className="space-y-1">
              <Label>備考</Label>
              <Input value={swForm.note} onChange={e => setSwForm(f => ({ ...f, note: e.target.value }))} autoComplete="off" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSwDialogOpen(false)}>キャンセル</Button>
              <Button onClick={handleSaveSw} disabled={savingSw || !swForm.softwareId}>
                {savingSw ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* ソフトウェア 削除確認 */}
      <Dialog open={!!deleteSwTarget} onOpenChange={v => !v && setDeleteSwTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>削除の確認</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-2">「{deleteSwTarget?.software.name}」を削除しますか？</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteSwTarget(null)}>キャンセル</Button>
            <Button variant="destructive" onClick={handleDeleteSw}>削除</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
