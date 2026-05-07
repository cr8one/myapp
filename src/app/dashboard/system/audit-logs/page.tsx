"use client"
import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { PlusCircle, Pencil, Trash2 } from "lucide-react"

type AuditLog = {
  id: string
  action: string
  targetModel: string
  targetId: string
  targetLabel: string | null
  diff: string | null
  createdAt: string
  user: { id: string; name: string | null; email: string } | null
}

const ACTION_STYLES: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  CREATE: <PlusCircle className="w-3 h-3" />,
  UPDATE: <Pencil className="w-3 h-3" />,
  DELETE: <Trash2 className="w-3 h-3" />,
}

const MODEL_LABELS: Record<string, string> = {
  DevCompany: "BPMS会社",
  DevProject: "BPMS案件",
  DevExhibition: "BPMS展示会",
  SealSupply: "SSSS支給管理",
  User: "ユーザー",
  Product: "製品",
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState<string>("all")
  const [filterModel, setFilterModel] = useState<string>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchLogs = async (action?: string, model?: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (action && action !== "all") params.set("action", action)
    if (model && model !== "all") params.set("targetModel", model)
    const res = await fetch(`/api/audit-logs?${params.toString()}`)
    const data = await res.json()
    setLogs(data)
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [])

  const handleActionFilter = (value: string) => {
    setFilterAction(value)
    fetchLogs(value, filterModel)
  }

  const handleModelFilter = (value: string) => {
    setFilterModel(value)
    fetchLogs(filterAction, value)
  }

  const formatDiff = (diff: string | null) => {
    if (!diff) return null
    try {
      return JSON.stringify(JSON.parse(diff), null, 2)
    } catch {
      return diff
    }
  }

  const uniqueModels = Array.from(new Set(logs.map(l => l.targetModel)))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">修正履歴</h1>
        <p className="text-sm text-gray-500 mt-1">全モジュールの操作履歴（最新300件）</p>
      </div>

      <div className="mb-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-600">操作：</Label>
          <select
            value={filterAction}
            onChange={e => handleActionFilter(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">すべて</option>
            <option value="CREATE">作成</option>
            <option value="UPDATE">更新</option>
            <option value="DELETE">削除</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-600">対象：</Label>
          <select
            value={filterModel}
            onChange={e => handleModelFilter(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">すべて</option>
            {uniqueModels.map(m => (
              <option key={m} value={m}>{MODEL_LABELS[m] ?? m}</option>
            ))}
          </select>
        </div>
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
                <th className="text-left px-4 py-3 text-gray-600 font-medium">操作者</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">操作</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">対象</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">対象名</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">詳細</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(log => (
                <>
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                      {new Date(log.createdAt).toLocaleString("ja-JP")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800 text-xs">{log.user?.name ?? "—"}</div>
                      <div className="text-xs text-gray-400">{log.user?.email ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${ACTION_STYLES[log.action] ?? "bg-gray-100 text-gray-700"}`}>
                        {ACTION_ICONS[log.action]}{log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {MODEL_LABELS[log.targetModel] ?? log.targetModel}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {log.targetLabel ?? log.targetId.substring(0, 8) + "..."}
                    </td>
                    <td className="px-4 py-3">
                      {log.diff && (
                        <button
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {expandedId === log.id ? "閉じる" : "表示"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedId === log.id && log.diff && (
                    <tr key={`${log.id}-diff`} className="bg-gray-50">
                      <td colSpan={6} className="px-4 py-3">
                        <pre className="text-xs text-gray-600 bg-gray-100 rounded p-3 overflow-x-auto whitespace-pre-wrap">
                          {formatDiff(log.diff)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
