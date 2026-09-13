"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Database, ChevronDown, ChevronRight } from "lucide-react"

type TableRow = {
  tableName: string
  label: string
  count: number | null
}

type Group = {
  key: string
  label: string
  tables: TableRow[]
}

export default function DbManagementPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch("/api/db-management/tables")
      .then(res => res.json())
      .then(data => {
        setGroups(data.groups ?? [])
        const initialOpen: Record<string, boolean> = {}
        for (const g of data.groups ?? []) initialOpen[g.key] = true
        setOpenGroups(initialOpen)
      })
      .finally(() => setLoading(false))
  }, [])

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">DB管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          稼働中サービスごとのテーブル一覧・フィールド情報・備考を確認できます
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">読み込み中...</div>
      ) : (
        <div className="space-y-4">
          {groups.map(group => (
            <div key={group.key} className="bg-white border rounded-lg overflow-hidden shadow-sm">
              <button
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-b hover:bg-gray-100 transition-colors"
              >
                <span className="font-semibold text-gray-700 text-sm">{group.label}</span>
                {openGroups[group.key] ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {openGroups[group.key] && (
                <div className="divide-y divide-gray-100">
                  {group.tables.map(t => (
                    <Link
                      key={t.tableName}
                      href={`/dashboard/system/db-management/${encodeURIComponent(t.tableName)}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Database className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-800">{t.label}</div>
                          <div className="text-xs text-gray-400">{t.tableName}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {t.count === null ? "取得失敗" : `${t.count.toLocaleString()} 件`}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
