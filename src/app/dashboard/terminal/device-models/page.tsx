"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Download, Upload } from "lucide-react"
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
export default function DeviceModelsPage() {
  const router = useRouter()
  const [records, setRecords] = useState<DeviceModel[]>([])
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [deviceType, setDeviceType] = useState("")
  const [vendorName, setVendorName] = useState("")
  const [typeOptions, setTypeOptions] = useState<string[]>([])
  const [vendorOptions, setVendorOptions] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [importMessage, setImportMessage] = useState("")
  const importRef = useRef<HTMLInputElement>(null)
  const fetchSignedUrls = async (data: DeviceModel[]) => {
    const keys = data.map(r => r.imagePath).filter(Boolean) as string[]
    const unique = [...new Set(keys)]
    const results = await Promise.all(
      unique.map(async key => {
        const res = await fetch(`/api/terminal/device-models?type=signed-url&key=${encodeURIComponent(key)}`)
        const { url } = await res.json()
        return [key, url] as [string, string]
      })
    )
    setSignedUrls(Object.fromEntries(results))
  }
  const fetchOptions = async () => {
    const res = await fetch("/api/terminal/device-models?type=options")
    const data = await res.json()
    setTypeOptions(data.deviceTypes || [])
    setVendorOptions(data.vendors || [])
  }
  const fetchRecords = async (kw: string = keyword, dt: string = deviceType, vn: string = vendorName) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (kw) params.set("keyword", kw)
    if (dt) params.set("deviceType", dt)
    if (vn) params.set("vendorName", vn)
    const res = await fetch(`/api/terminal/device-models?${params.toString()}`)
    const data: DeviceModel[] = await res.json()
    setRecords(data)
    setLoading(false)
    fetchSignedUrls(data)
  }
  useEffect(() => { fetchRecords(); fetchOptions() }, [])
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
        const [, vendorName, deviceType, modelName, modelNumber, osName, cpuInfo, memoryDefault, storageDefault, eolDate, imagePath, note] = cols
        if (!modelName) continue
        await fetch("/api/terminal/device-models", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vendorName, deviceType, modelName, modelNumber, osName, cpuInfo, memoryDefault, storageDefault, eolDate, imagePath, note }),
        })
        count++
      }
      setImportMessage(`インポート完了：${count}件`)
      fetchRecords()
      fetchOptions()
    } catch (err: any) {
      setImportMessage(`エラー：${err.message}`)
    } finally {
      setImporting(false)
      if (importRef.current) importRef.current.value = ""
    }
  }
  const trunc = (v: string | null, max = 20) => {
    if (!v) return <span className="text-gray-300">—</span>
    return v.length > max ? v.slice(0, max) + "…" : v
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
          <Button size="sm" onClick={() => router.push("/dashboard/terminal/device-models/new")} className="flex items-center gap-1">
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
          <div className="w-44">
            <label className="block text-xs text-gray-500 mb-1">種別</label>
            <select value={deviceType} onChange={e => setDeviceType(e.target.value)}
              className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm">
              <option value="">すべて</option>
              {typeOptions.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="w-44">
            <label className="block text-xs text-gray-500 mb-1">メーカー</label>
            <select value={vendorName} onChange={e => setVendorName(e.target.value)}
              className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm">
              <option value="">すべて</option>
              {vendorOptions.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <Button onClick={() => fetchRecords()} className="flex items-center gap-1">
            <Search className="w-4 h-4" />検索
          </Button>
          <Button variant="outline" onClick={() => { setKeyword(""); setDeviceType(""); setVendorName(""); fetchRecords("", "", "") }}>
            クリア
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
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium w-16">画像</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">機種名</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">種別</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">メーカー</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">型番</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">標準OS</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">CPU</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">標準メモリ</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">標準容量</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map(r => (
                  <tr key={r.modelId}
                    onClick={() => router.push(`/dashboard/terminal/device-models/${r.modelId}`)}
                    className="hover:bg-blue-50 cursor-pointer h-14">
                    <td className="px-3 py-2 w-16">
                      {r.imagePath && signedUrls[r.imagePath] ? (
                        <img src={signedUrls[r.imagePath]} alt={r.modelName} loading="lazy"
                          className="w-10 h-10 object-contain rounded border bg-gray-50" />
                      ) : (
                        <div className="w-10 h-10 rounded border bg-gray-100 flex items-center justify-center text-gray-300 text-xs">
                          {r.imagePath ? "..." : "—"}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 font-medium max-w-[160px]"><div className="truncate">{r.modelName}</div></td>
                    <td className="px-3 py-2 text-gray-500 max-w-[100px]"><div className="truncate">{trunc(r.deviceType, 15)}</div></td>
                    <td className="px-3 py-2 text-gray-500 max-w-[120px]"><div className="truncate">{trunc(r.vendorName)}</div></td>
                    <td className="px-3 py-2 text-gray-500 max-w-[120px]"><div className="truncate">{trunc(r.modelNumber)}</div></td>
                    <td className="px-3 py-2 text-gray-500 max-w-[140px]"><div className="truncate">{trunc(r.osName, 25)}</div></td>
                    <td className="px-3 py-2 text-gray-500 max-w-[160px]"><div className="truncate">{trunc(r.cpuInfo, 25)}</div></td>
                    <td className="px-3 py-2 text-gray-500 max-w-[80px]"><div className="truncate">{trunc(r.memoryDefault, 10)}</div></td>
                    <td className="px-3 py-2 text-gray-500 max-w-[100px]"><div className="truncate">{trunc(r.storageDefault, 15)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
