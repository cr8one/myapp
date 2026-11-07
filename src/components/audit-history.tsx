"use client"
import { useEffect, useState } from "react"
import type { ChangedField } from "@/lib/history-diff"

// 詳細画面の「履歴」の枠の中身。監査ログ（audit_logs）を、対象のモデル名とIDで引いて表にする
type Entry = {
  id: string
  action: string
  diff: string | null
  createdAt: string
  user: { id: string; name: string | null } | null
}

const two = (n: number) => String(n).padStart(2, "0")
const formatDate = (s: string) => {
  const d = new Date(s)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${two(d.getHours())}:${two(d.getMinutes())}`
}

const parseDiff = (s: string | null): { classification?: string; changedFields?: ChangedField[] } | null => {
  if (!s) return null
  try { return JSON.parse(s) } catch { return null }
}

export default function AuditHistory({ targetModel, targetId, reloadKey = 0 }: {
  targetModel: string
  targetId: string
  reloadKey?: number
}) {
  const [logs, setLogs] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetch(`/api/audit-history?targetModel=${encodeURIComponent(targetModel)}&targetId=${encodeURIComponent(targetId)}`)
      .then(r => (r.ok ? r.json() : []))
      .then(d => { if (alive) setLogs(d) })
      .catch(() => { if (alive) setLogs([]) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [targetModel, targetId, reloadKey])

  if (loading) return <p className="text-xs text-gray-400">読み込み中...</p>
  if (logs.length === 0) return <p className="text-xs text-gray-400">履歴がありません</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-3 py-2 text-gray-600 font-medium whitespace-nowrap">日時</th>
            <th className="text-left px-3 py-2 text-gray-600 font-medium whitespace-nowrap">ユーザー</th>
            <th className="text-left px-3 py-2 text-gray-600 font-medium whitespace-nowrap">分類</th>
            <th className="text-left px-3 py-2 text-gray-600 font-medium whitespace-nowrap">修正項目</th>
            <th className="text-left px-3 py-2 text-gray-600 font-medium">修正前</th>
            <th className="text-left px-3 py-2 text-gray-600 font-medium">修正後</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logs.flatMap(log => {
            const diff = parseDiff(log.diff)
            const classification = diff?.classification ?? (log.action === "CREATE" ? "新規" : log.action === "DELETE" ? "削除" : "編集")
            const changedFields = diff?.changedFields ?? []
            const dt = formatDate(log.createdAt)
            if (changedFields.length === 0) {
              return [(
                <tr key={log.id}>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-500">{dt}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-700">{log.user?.name ?? "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-700">{classification}</td>
                  <td className="px-3 py-2 text-gray-300">—</td>
                  <td className="px-3 py-2 text-gray-300">—</td>
                  <td className="px-3 py-2 text-gray-300">—</td>
                </tr>
              )]
            }
            return changedFields.map((cf, i) => (
              <tr key={`${log.id}-${i}`}>
                <td className="px-3 py-2 whitespace-nowrap text-gray-500">{dt}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">{log.user?.name ?? "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">{classification}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">{cf.label}</td>
                <td className="px-3 py-2 text-gray-600">{cf.before}</td>
                <td className="px-3 py-2 text-gray-600">{cf.after}</td>
              </tr>
            ))
          })}
        </tbody>
      </table>
    </div>
  )
}
