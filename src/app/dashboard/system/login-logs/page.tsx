"use client"
import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Monitor } from "lucide-react"

type LoginLog = {
  id: string
  email: string
  status: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user: { id: string; name: string | null; email: string } | null
}

export default function LoginLogsPage() {
  const [logs, setLogs] = useState<LoginLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const fetchLogs = async (status?: string) => {
    setLoading(true)
    const url = status && status !== "all"
      ? `/api/login-logs?status=${status}`
      : "/api/login-logs"
    const res = await fetch(url)
    const data = await res.json()
    setLogs(data)
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ログイン履歴</h1>
        <p className="text-sm text-gray-500 mt-1">ユーザーのログイン履歴（最新200件）</p>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <Label className="text-sm text-gray-600">ステータス絞り込み：</Label>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); fetchLogs(e.target.value) }}
          className="border rounded px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">すべて</option>
          <option value="success">成功</option>
          <option value="failed">失敗</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">読み込み中...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">履歴がありません</div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">日時</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">ユーザー</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">ステータス</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">IPアドレス</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">ブラウザ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("ja-JP")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{log.user?.name ?? "—"}</div>
                    <div className="text-xs text-gray-400">{log.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {log.status === "success" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3" />成功
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        <XCircle className="w-3 h-3" />失敗
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{log.ipAddress ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                    <span title={log.userAgent ?? ""}>
                      {log.userAgent ? <Monitor className="w-3 h-3 inline mr-1" /> : null}
                      {log.userAgent ? log.userAgent.substring(0, 50) + "..." : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
