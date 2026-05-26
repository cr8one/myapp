"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Search, Monitor, Server } from "lucide-react"

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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
