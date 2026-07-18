"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Monitor, Server, Laptop, Cpu, Router, Printer, HardDrive } from "lucide-react"

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
type DeviceModel = { modelId: number; modelName: string; vendorName: string | null; deviceType: string | null; osName: string | null; cpuInfo: string | null; memoryDefault: string | null; storageDefault: string | null }
type Master = { id: number; category: string; value: string }
const DEVICE_TYPE_ICONS: Record<string, typeof Monitor> = {
  "サーバー": Server,
  "ノートPC": Laptop,
  "Mac": Laptop,
  "デスクトップPC": Cpu,
  "ネットワーク機器": Router,
  "モニタ": Monitor,
  "プリンタ": Printer,
  "NAS": HardDrive,
}
type SortMode = "updated_desc" | "name"

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
  const [locationFilter, setLocationFilter] = useState("")
  const [deviceTypeFilter, setDeviceTypeFilter] = useState("")
  const [sortMode, setSortMode] = useState<SortMode>("updated_desc")

  const getMasterValues = (category: string) => masters.filter(m => m.category === category).map(m => m.value)

  const fetchAll = async (
    kw = keyword, st = statusFilter, loc = locationFilter, dt = deviceTypeFilter, sm = sortMode
  ) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (kw) params.set("keyword", kw)
    if (st) params.set("status", st)
    if (loc) params.set("location", loc)
    if (dt) params.set("deviceType", dt)
    params.set("sort", sm)
    const [devRes, modRes, masRes] = await Promise.all([
      fetch(`/api/terminal/devices?${params.toString()}`),
      fetch("/api/terminal/device-models"),
      fetch("/api/terminal/terminal-masters"),
    ])
    setRecords(await devRes.json())
    setModels(await modRes.json())
    setMasters(await masRes.json())
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const handleSearch = () => fetchAll(keyword, statusFilter, locationFilter, deviceTypeFilter, sortMode)

  const handleLocationShortcut = (v: string) => {
    const next = locationFilter === v ? "" : v
    setLocationFilter(next)
    fetchAll(keyword, statusFilter, next, deviceTypeFilter, sortMode)
  }

  const handleDeviceTypeShortcut = (v: string) => {
    const next = deviceTypeFilter === v ? "" : v
    setDeviceTypeFilter(next)
    fetchAll(keyword, statusFilter, locationFilter, next, sortMode)
  }

  const handleSortChange = (sm: SortMode) => {
    setSortMode(sm)
    fetchAll(keyword, statusFilter, locationFilter, deviceTypeFilter, sm)
  }

  const handleStatusFilter = (st: string) => {
    const next = statusFilter === st ? "" : st
    setStatusFilter(next)
    fetchAll(keyword, next, locationFilter, deviceTypeFilter, sortMode)
  }

  const getModel = (modelId: number | null) => modelId ? models.find(m => m.modelId === modelId) ?? null : null
  const getDeviceIcon = (r: Device) => {
    const model = getModel(r.modelId)
    if (model?.deviceType && DEVICE_TYPE_ICONS[model.deviceType]) return DEVICE_TYPE_ICONS[model.deviceType]
    return r.children.length > 0 ? Server : Monitor
  }
  const getModelName = (modelId: number | null) => {
    const m = getModel(modelId)
    return m ? `${m.vendorName ? m.vendorName + " " : ""}${m.modelName}` : null
  }
  const getDeviceName = (deviceId: number) => {
    const d = records.find(r => r.deviceId === deviceId)
    return d ? d.deviceName : `ID:${deviceId}`
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">端末一覧</h1>
          <p className="text-sm text-gray-500 mt-1">{records.length}件</p>
        </div>
        <Button size="sm" onClick={() => router.push("/dashboard/terminal/devices/new")} className="flex items-center gap-1">
          <Plus className="w-4 h-4" />新規登録
        </Button>
      </div>

      <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm space-y-3">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-40">
            <Input value={keyword} onChange={e => setKeyword(e.target.value)}
              placeholder="端末名・資産番号・ホスト名・シリアル・場所・利用者で検索"
              onKeyDown={e => { if (e.key === "Enter") handleSearch() }}
              autoComplete="off" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); fetchAll(keyword, e.target.value, locationFilter, deviceTypeFilter, sortMode) }}
            className="h-10 border rounded px-3 text-sm bg-white">
            <option value="">状態：すべて</option>
            {getMasterValues("状態").map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={sortMode} onChange={e => handleSortChange(e.target.value as SortMode)}
            className="h-10 border rounded px-3 text-sm bg-white">
            <option value="updated_desc">更新日時（新しい順）</option>
            <option value="name">端末名順</option>
          </select>
          <Button onClick={handleSearch} className="flex items-center gap-1">
            <Search className="w-4 h-4" />検索
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400">機種種別：</span>
          {getMasterValues("機種種別").map(v => (
            <button key={v} onClick={() => handleDeviceTypeShortcut(v)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                deviceTypeFilter === v ? "bg-slate-700 text-white border-transparent font-semibold" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}>
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400">設置場所：</span>
          {getMasterValues("設置場所").map(v => (
            <button key={v} onClick={() => handleLocationShortcut(v)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                locationFilter === v ? "bg-slate-700 text-white border-transparent font-semibold" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p>
      ) : records.length === 0 ? (
        <p className="text-center text-gray-500 py-8">データがありません。</p>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full min-w-[1200px] table-fixed">
            <colgroup>
              <col className="w-10" />
              <col className="w-40" />
              <col className="w-36" />
              <col className="w-24" />
              <col className="w-28" />
              <col className="w-28" />
              <col className="w-32" />
              <col className="w-28" />
              <col />
            </colgroup>
            <thead>
              <tr className="border-b bg-gray-50 text-xs text-gray-500">
                <th className="px-3 py-3"></th>
                <th className="text-left font-medium px-3 py-3">端末名</th>
                <th className="text-left font-medium px-3 py-3">機種／種別</th>
                <th className="text-left font-medium px-3 py-3">状態</th>
                <th className="text-left font-medium px-3 py-3">設置場所</th>
                <th className="text-left font-medium px-3 py-3">利用者</th>
                <th className="text-left font-medium px-3 py-3">シリアル</th>
                <th className="text-left font-medium px-3 py-3">IPアドレス</th>
                <th className="text-left font-medium px-3 py-3">備考</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => {
                const model = getModel(r.modelId)
                return (
                  <tr key={r.deviceId}
                    className="border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors align-top"
                    onClick={() => router.push(`/dashboard/terminal/devices/${r.deviceId}`)}>
                    <td className="px-3 py-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        {(() => { const Icon = getDeviceIcon(r); return <Icon className="w-4 h-4 text-slate-500" /> })()}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm font-bold text-gray-900 break-words leading-snug">{r.deviceName}</div>
                      {r.assetNo && <div className="text-xs text-gray-400 font-mono mt-0.5">{r.assetNo}</div>}
                      {r.parentDeviceId && (
                        <span className="inline-block mt-1 text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                          VM / {getDeviceName(r.parentDeviceId)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm text-gray-700 break-words leading-snug">{model?.modelName ?? ""}</div>
                      {model?.deviceType && <div className="text-xs text-gray-400 mt-0.5">{model.deviceType}</div>}
                    </td>
                    <td className="px-3 py-3">
                      {r.status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {r.status}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600 break-words leading-snug">{r.location ?? ""}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 break-words leading-snug">{r.userId ?? ""}</td>
                    <td className="px-3 py-3 text-sm text-gray-500 break-words leading-snug">{r.serialNo ?? ""}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        {r.ipAddresses.map(ip => (
                          <span key={ip.id} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-mono w-fit">
                            {ip.ip}{ip.interface ? ` (${ip.interface})` : ""}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500 leading-snug" title={r.remark ?? ""}>
                      <div className="line-clamp-2 break-words">{r.remark ?? ""}</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
