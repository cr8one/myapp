"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ExternalLink } from "lucide-react"
import Link from "next/link"

type DeviceSoftwareWithRefs = {
  id: number
  deviceId: number
  softwareId: number
  version: string | null
  note: string | null
  device: {
    deviceId: number
    deviceName: string
    assetNo: string | null
  }
  software: {
    id: number
    name: string
    version: string | null
    vendor: string | null
    licenseType: string | null
  }
}

export default function SoftwareInstallsPage() {
  const [records, setRecords] = useState<DeviceSoftwareWithRefs[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")

  const fetchRecords = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (keyword) params.set("keyword", keyword)
    const res = await fetch(`/api/terminal/device-software?${params.toString()}`)
    const data = await res.json()
    setRecords(data)
    setLoading(false)
  }

  useEffect(() => { fetchRecords() }, [])

  const trunc = (v: string | null, max = 20) => {
    if (!v) return <span className="text-gray-300">—</span>
    return v.length > max ? v.slice(0, max) + "…" : v
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">インストールソフト</h1>
          <p className="text-sm text-gray-500 mt-1">{records.length}件</p>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex gap-3 items-end">
          <div className="flex-1 min-w-40">
            <Input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="ソフト名・ベンダー・端末名・バージョンで検索"
              onKeyDown={e => { if (e.key === "Enter") fetchRecords() }}
              autoComplete="off"
            />
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
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">端末名</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">資産番号</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">ソフトウェア名</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">ベンダー</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">バージョン</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">ライセンス種別</th>
                  <th className="text-left px-3 py-2.5 text-gray-600 font-medium">備考</th>
                  <th className="px-3 py-2.5 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-blue-50">
                    <td className="px-3 py-2.5 font-medium max-w-[160px]">
                      <div className="truncate">{r.device.deviceName}</div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 max-w-[120px]">
                      <div className="truncate">{trunc(r.device.assetNo)}</div>
                    </td>
                    <td className="px-3 py-2.5 font-medium max-w-[180px]">
                      <div className="truncate">{r.software.name}</div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 max-w-[140px]">
                      <div className="truncate">{trunc(r.software.vendor)}</div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 font-mono max-w-[120px]">
                      <div className="truncate">
                        {r.version
                          ? r.version
                          : r.software.version
                            ? <span className="text-gray-400">{r.software.version}</span>
                            : <span className="text-gray-300">—</span>
                        }
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 max-w-[120px]">
                      <div className="truncate">{trunc(r.software.licenseType)}</div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 max-w-[160px]">
                      <div className="truncate">{trunc(r.note, 30)}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/dashboard/terminal/devices/${r.device.deviceId}`}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded inline-flex"
                        title="端末詳細へ"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </td>
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
