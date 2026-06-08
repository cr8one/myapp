"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react"

type DeviceIp = { id: number; ip: string; subnet: string | null; gateway: string | null; interface: string | null; note: string | null }
type DeviceRemark = { id: number; date: string | null; title: string | null; content: string | null }
type DeviceSoftware = {
  id: number; softwareId: number; version: string | null; note: string | null; userId: string | null
  software: { id: number; name: string; version: string | null; vendor: string | null; licenseType: string | null }
}
type MSoftware = { id: number; name: string; version: string | null; vendor: string | null }
type Device = {
  deviceId: number; assetNo: string | null; deviceName: string; hostname: string | null
  modelId: number | null; serialNo: string | null; osVersion: string | null
  memorySize: string | null; storageSize: string | null; location: string | null
  userId: string | null; purchaseDate: string | null; startDate: string | null
  status: string | null; managementType: string | null; remark: string | null
  parentDeviceId: number | null; procurementType: string | null
  lease: { lease_company: string | null; lease_start: string | null; lease_end: string | null; contract_no: string | null; lease_item_no: string | null } | null
  ipAddresses: DeviceIp[]
}
type DeviceModel = { modelId: number; modelName: string; vendorName: string | null; imagePath: string | null }
type Master = { id: number; category: string; value: string }

const STATUS_COLORS: Record<string, string> = {
  "使用中": "bg-green-100 text-green-700",
  "保管中": "bg-blue-100 text-blue-700",
  "修理中": "bg-yellow-100 text-yellow-700",
  "廃棄済": "bg-red-100 text-red-700",
}
const emptyIpForm = { ip: "", subnet: "", gateway: "", interface: "", note: "" }
const emptySoftwareForm = { softwareId: "", version: "", note: "", userId: "" }
const emptyRemarkForm = { date: "", title: "", content: "" }
const emptyDeviceForm = {
  assetNo: "", deviceName: "", hostname: "", modelId: "", serialNo: "",
  osVersion: "", memorySize: "", storageSize: "", location: "", userId: "",
  purchaseDate: "", startDate: "", status: "", managementType: "", remark: "",
  parentDeviceId: "", procurementType: "", leaseCompany: "", leaseStart: "", leaseEnd: "", contractNo: "", leaseItemNo: "",
}

export default function DeviceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const deviceId = params.id as string
  const [device, setDevice] = useState<Device | null>(null)
  const [model, setModel] = useState<DeviceModel | null>(null)
  const [modelImageUrl, setModelImageUrl] = useState<string | null>(null)
  const [models, setModels] = useState<DeviceModel[]>([])
  const [masters, setMasters] = useState<Master[]>([])
  const [allDevices, setAllDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  // 端末編集
  const [editDeviceOpen, setEditDeviceOpen] = useState(false)
  const [deviceForm, setDeviceForm] = useState(emptyDeviceForm)
  const [savingDevice, setSavingDevice] = useState(false)
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
  // Remarks
  const [remarks, setRemarks] = useState<DeviceRemark[]>([])
  const [remarkDialogOpen, setRemarkDialogOpen] = useState(false)
  const [editRemarkTarget, setEditRemarkTarget] = useState<DeviceRemark | null>(null)
  const [remarkForm, setRemarkForm] = useState(emptyRemarkForm)
  const [savingRemark, setSavingRemark] = useState(false)
  const [deleteRemarkTarget, setDeleteRemarkTarget] = useState<DeviceRemark | null>(null)

  const getMasterValues = (category: string) => masters.filter(m => m.category === category).map(m => m.value)

  const fetchDevice = async () => {
    const res = await fetch("/api/terminal/devices")
    const all: Device[] = await res.json()
    setAllDevices(all)
    const found = all.find(d => d.deviceId === parseInt(deviceId))
    if (!found) { setLoading(false); return }
    setDevice(found)
    if (found.modelId) {
      const modRes = await fetch("/api/terminal/device-models")
      const mods: DeviceModel[] = await modRes.json()
      setModels(mods)
      const m = mods.find(m => m.modelId === found.modelId)
      if (m) {
        setModel(m)
        if (m.imagePath) {
          const imgRes = await fetch(`/api/terminal/device-models?type=signed-url&key=${encodeURIComponent(m.imagePath)}`)
          const { url } = await imgRes.json()
          setModelImageUrl(url)
        }
      }
    } else {
      const modRes = await fetch("/api/terminal/device-models")
      setModels(await modRes.json())
    }
    setLoading(false)
  }
  const fetchSoftwares = async () => {
    const res = await fetch(`/api/terminal/device-software?deviceId=${deviceId}`)
    setSoftwares(await res.json())
  }
  const fetchRemarks = async () => {
    const res = await fetch(`/api/terminal/device-remarks?deviceId=${deviceId}`)
    setRemarks(await res.json())
  }
  useEffect(() => {
    fetchDevice()
    fetchSoftwares()
    fetchRemarks()
    fetch("/api/terminal/software").then(r => r.json()).then(setSoftwareMasters)
    fetch("/api/terminal/terminal-masters").then(r => r.json()).then(setMasters)
  }, [deviceId])

  // 端末編集
  const openEditDevice = () => {
    if (!device) return
    setDeviceForm({
      assetNo: device.assetNo ?? "", deviceName: device.deviceName,
      hostname: device.hostname ?? "", modelId: device.modelId?.toString() ?? "",
      serialNo: device.serialNo ?? "", osVersion: device.osVersion ?? "",
      memorySize: device.memorySize ?? "", storageSize: device.storageSize ?? "",
      location: device.location ?? "", userId: device.userId ?? "",
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
    setEditDeviceOpen(true)
  }
  const handleSaveDevice = async () => {
    if (!device || !deviceForm.deviceName) return
    setSavingDevice(true)
    try {
      await fetch("/api/terminal/devices", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...deviceForm, deviceId: device.deviceId }),
      })
      setEditDeviceOpen(false)
      fetchDevice()
    } finally { setSavingDevice(false) }
  }
  const handleDeleteDevice = async () => {
    if (!device || !confirm(`「${device.deviceName}」を削除しますか？`)) return
    await fetch("/api/terminal/devices", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: device.deviceId }),
    })
    router.push("/dashboard/terminal/devices")
  }

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

  // Remark handlers
  const openAddRemark = () => {
    setEditRemarkTarget(null)
    setRemarkForm({ date: new Date().toISOString().split("T")[0], title: "", content: "" })
    setRemarkDialogOpen(true)
  }
  const openEditRemark = (r: DeviceRemark) => {
    setEditRemarkTarget(r)
    setRemarkForm({ date: r.date ? r.date.split("T")[0] : "", title: r.title ?? "", content: r.content ?? "" })
    setRemarkDialogOpen(true)
  }
  const handleSaveRemark = async () => {
    setSavingRemark(true)
    try {
      if (editRemarkTarget) {
        await fetch("/api/terminal/device-remarks", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editRemarkTarget.id, ...remarkForm }) })
      } else {
        await fetch("/api/terminal/device-remarks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId, ...remarkForm }) })
      }
      setRemarkDialogOpen(false)
      fetchRemarks()
    } finally { setSavingRemark(false) }
  }
  const handleDeleteRemark = async () => {
    if (!deleteRemarkTarget) return
    await fetch("/api/terminal/device-remarks", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleteRemarkTarget.id }) })
    setDeleteRemarkTarget(null)
    fetchRemarks()
  }

  const parentCandidates = allDevices.filter(d => d.deviceId !== parseInt(deviceId))

  if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">読み込み中...</div>
  if (!device) return <div className="p-8 text-center text-gray-500">端末が見つかりません。</div>
  const val = (v: string | null | undefined) => v ?? <span className="text-gray-300">—</span>

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />一覧に戻る
        </button>
        <div className="flex items-center gap-2">
          <button onClick={openEditDevice}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 px-3 py-2 rounded-lg hover:bg-blue-50">
            <Pencil className="w-4 h-4" />編集
          </button>
          <button onClick={handleDeleteDevice}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50">
            <Trash2 className="w-4 h-4" />削除
          </button>
        </div>
      </div>

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
              <div className="flex gap-2"><span className="text-gray-400 w-24 flex-shrink-0">調達区分</span><span>{val(device.procurementType)}</span></div>
              {device.procurementType === "購入" && <div className="flex gap-2"><span className="text-gray-400 w-24 flex-shrink-0">購入日</span><span>{device.purchaseDate ? new Date(device.purchaseDate).toLocaleDateString("ja-JP") : <span className="text-gray-300">—</span>}</span></div>}
              {device.procurementType === "リース" && device.lease && (<>
              <div className="flex gap-2"><span className="text-gray-400 w-24 flex-shrink-0">リース会社</span><span>{val(device.lease.lease_company)}</span></div>
              <div className="flex gap-2"><span className="text-gray-400 w-24 flex-shrink-0">開始日</span><span>{device.lease.lease_start ? new Date(device.lease.lease_start).toLocaleDateString("ja-JP") : "—"}</span></div>
              <div className="flex gap-2"><span className="text-gray-400 w-24 flex-shrink-0">終了日</span><span>{device.lease.lease_end ? new Date(device.lease.lease_end).toLocaleDateString("ja-JP") : "—"}</span></div>
              <div className="flex gap-2"><span className="text-gray-400 w-24 flex-shrink-0">契約番号</span><span>{val(device.lease.contract_no)}</span></div>
              <div className="flex gap-2"><span className="text-gray-400 w-24 flex-shrink-0">物件No</span><span>{val(device.lease.lease_item_no)}</span></div>
              </>)}
              <div className="flex gap-2"><span className="text-gray-400 w-24 flex-shrink-0">利用開始日</span><span>{device.startDate ? new Date(device.startDate).toLocaleDateString("ja-JP") : <span className="text-gray-300">—</span>}</span></div>
              <div className="flex gap-2"><span className="text-gray-400 w-24 flex-shrink-0">管理区分</span><span>{val(device.managementType)}</span></div>
              <div className="flex gap-2 col-span-2"><span className="text-gray-400 w-24 flex-shrink-0">備考</span><span className="whitespace-pre-wrap">{val(device.remark)}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* IPアドレス */}
      <div className="bg-white border rounded-xl shadow-sm p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">IPアドレス</h2>
          <Button size="sm" onClick={openAddIp} className="flex items-center gap-1"><Plus className="w-4 h-4" />追加</Button>
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
      <div className="bg-white border rounded-xl shadow-sm p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">インストールソフト</h2>
          <Button size="sm" onClick={openAddSw} className="flex items-center gap-1"><Plus className="w-4 h-4" />追加</Button>
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
                    {sw.version ? sw.version : sw.software.version ? <span className="text-gray-400">{sw.software.version}</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2 text-gray-500">{sw.software.licenseType ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-3 py-2 text-gray-500">
                    {sw.userId ? <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{sw.userId}</span> : <span className="text-gray-300 text-xs">共通</span>}
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

      {/* 備考 */}
      <div className="bg-white border rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">履歴</h2>
          <Button size="sm" onClick={openAddRemark} className="flex items-center gap-1"><Plus className="w-4 h-4" />追加</Button>
        </div>
        {remarks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">履歴が登録されていません。</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">日付</th>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">タイトル</th>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">内容</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {remarks.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                    {r.date ? new Date(r.date).toLocaleDateString("ja-JP") : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-700">{r.title ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-3 py-2 text-gray-500 max-w-xs">
                    <div className="whitespace-pre-wrap">{r.content ?? <span className="text-gray-300">—</span>}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => openEditRemark(r)} className="p-1 text-gray-400 hover:text-blue-600 rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteRemarkTarget(r)} className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 端末編集ダイアログ */}
      <Dialog open={editDeviceOpen} onOpenChange={setEditDeviceOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>端末を編集</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
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
              <Input value={deviceForm.userId} onChange={e => setDeviceForm(f => ({ ...f, userId: e.target.value }))} autoComplete="off" /></div>
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
              <Input value={deviceForm.leaseCompany} onChange={e => setDeviceForm(f => ({ ...f, leaseCompany: e.target.value }))} autoComplete="off" /></div>
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
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditDeviceOpen(false)}>キャンセル</Button>
            <Button onClick={handleSaveDevice} disabled={savingDevice || !deviceForm.deviceName}>
              {savingDevice ? "保存中..." : "保存"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* IP ダイアログ */}
      <Dialog open={ipDialogOpen} onOpenChange={setIpDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editIpTarget ? "IPアドレスを編集" : "IPアドレスを追加"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1"><Label>IPアドレス <span className="text-red-500">*</span></Label>
              <Input value={ipForm.ip} onChange={e => setIpForm(f => ({ ...f, ip: e.target.value }))} placeholder="例：192.168.1.10" autoComplete="off" /></div>
            <div className="space-y-1"><Label>サブネットマスク</Label>
              <Input value={ipForm.subnet} onChange={e => setIpForm(f => ({ ...f, subnet: e.target.value }))} placeholder="例：255.255.255.0" autoComplete="off" /></div>
            <div className="space-y-1"><Label>ゲートウェイ</Label>
              <Input value={ipForm.gateway} onChange={e => setIpForm(f => ({ ...f, gateway: e.target.value }))} placeholder="例：192.168.1.1" autoComplete="off" /></div>
            <div className="space-y-1"><Label>インターフェース</Label>
              <Input value={ipForm.interface} onChange={e => setIpForm(f => ({ ...f, interface: e.target.value }))} placeholder="例：Ethernet、Wi-Fi" autoComplete="off" /></div>
            <div className="space-y-1"><Label>備考</Label>
              <Input value={ipForm.note} onChange={e => setIpForm(f => ({ ...f, note: e.target.value }))} autoComplete="off" /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIpDialogOpen(false)}>キャンセル</Button>
              <Button onClick={handleSaveIp} disabled={savingIp || !ipForm.ip}>{savingIp ? "保存中..." : "保存"}</Button>
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
            <div className="space-y-1"><Label>ソフトウェア <span className="text-red-500">*</span></Label>
              <select value={swForm.softwareId} onChange={e => setSwForm(f => ({ ...f, softwareId: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">選択してください</option>
                {softwareMasters.map(s => <option key={s.id} value={s.id}>{s.name}{s.vendor ? ` (${s.vendor})` : ""}</option>)}
              </select>
            </div>
            <div className="space-y-1"><Label>バージョン <span className="text-xs text-gray-400">（空欄の場合はマスタのバージョンを参照）</span></Label>
              <Input value={swForm.version} onChange={e => setSwForm(f => ({ ...f, version: e.target.value }))} placeholder="例：1.2.3" autoComplete="off" /></div>
            <div className="space-y-1"><Label>利用者 <span className="text-xs text-gray-400">（空欄の場合は端末共通）</span></Label>
              <Input value={swForm.userId} onChange={e => setSwForm(f => ({ ...f, userId: e.target.value }))} placeholder="例：山田太郎" autoComplete="off" /></div>
            <div className="space-y-1"><Label>備考</Label>
              <Input value={swForm.note} onChange={e => setSwForm(f => ({ ...f, note: e.target.value }))} autoComplete="off" /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSwDialogOpen(false)}>キャンセル</Button>
              <Button onClick={handleSaveSw} disabled={savingSw || !swForm.softwareId}>{savingSw ? "保存中..." : "保存"}</Button>
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

      {/* 備考 ダイアログ */}
      <Dialog open={remarkDialogOpen} onOpenChange={setRemarkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editRemarkTarget ? "履歴を編集" : "履歴を追加"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1"><Label>日付</Label>
              <Input type="date" value={remarkForm.date} onChange={e => setRemarkForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div className="space-y-1"><Label>タイトル</Label>
              <Input value={remarkForm.title} onChange={e => setRemarkForm(f => ({ ...f, title: e.target.value }))} autoComplete="off" /></div>
            <div className="space-y-1"><Label>内容</Label>
              <Textarea value={remarkForm.content} onChange={e => setRemarkForm(f => ({ ...f, content: e.target.value }))} rows={4} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRemarkDialogOpen(false)}>キャンセル</Button>
              <Button onClick={handleSaveRemark} disabled={savingRemark}>{savingRemark ? "保存中..." : "保存"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 備考 削除確認 */}
      <Dialog open={!!deleteRemarkTarget} onOpenChange={v => !v && setDeleteRemarkTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>削除の確認</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-2">「{deleteRemarkTarget?.title ?? "この備考"}」を削除しますか？</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteRemarkTarget(null)}>キャンセル</Button>
            <Button variant="destructive" onClick={handleDeleteRemark}>削除</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
