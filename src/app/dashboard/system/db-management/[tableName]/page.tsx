"use client"
import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Trash2, Pencil, X, Check } from "lucide-react"

type Column = {
  name: string
  dataType: string
  isNullable: boolean
  columnDefault: string | null
}

type TableDetail = {
  tableName: string
  label: string
  columns: Column[]
  count: number
  tableNote: string
  fieldNotes: Record<string, string>
  primaryKeyColumn: string | null
}

type RecordsResponse = {
  rows: Record<string, unknown>[]
  total: number
  page: number
  pageSize: number
}

export default function DbManagementTableDetailPage() {
  const params = useParams<{ tableName: string }>()
  const tableName = decodeURIComponent(params.tableName)

  const [detail, setDetail] = useState<TableDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tableNoteDraft, setTableNoteDraft] = useState("")
  const [fieldNoteDrafts, setFieldNoteDrafts] = useState<Record<string, string>>({})
  const [savingField, setSavingField] = useState<string | null>(null)
  const [savingTableNote, setSavingTableNote] = useState(false)

  const [records, setRecords] = useState<RecordsResponse | null>(null)
  const [recordsLoading, setRecordsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [editingRow, setEditingRow] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Record<string, string | null>>({})
  const [savingRow, setSavingRow] = useState(false)
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState("")
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)

  const fetchDetail = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/db-management/tables/${encodeURIComponent(tableName)}`)
    const data = await res.json()
    setDetail(data)
    setTableNoteDraft(data.tableNote ?? "")
    setFieldNoteDrafts(data.fieldNotes ?? {})
    setLoading(false)
  }, [tableName])

  const fetchRecords = useCallback(async (p: number) => {
    setRecordsLoading(true)
    const res = await fetch(
      `/api/db-management/tables/${encodeURIComponent(tableName)}/records?page=${p}&pageSize=50`
    )
    const data = await res.json()
    setRecords(data)
    setRecordsLoading(false)
  }, [tableName])

  useEffect(() => { fetchDetail() }, [fetchDetail])
  useEffect(() => { fetchRecords(page) }, [fetchRecords, page])

  const saveTableNote = async () => {
    setSavingTableNote(true)
    await fetch(`/api/db-management/tables/${encodeURIComponent(tableName)}/notes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: tableNoteDraft }),
    })
    setSavingTableNote(false)
  }

  const saveFieldNote = async (fieldName: string) => {
    setSavingField(fieldName)
    await fetch(`/api/db-management/tables/${encodeURIComponent(tableName)}/notes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fieldName, note: fieldNoteDrafts[fieldName] ?? "" }),
    })
    setSavingField(null)
  }

  const startEdit = (row: Record<string, unknown>) => {
    if (!detail?.primaryKeyColumn) return
    setEditingRow(String(row[detail.primaryKeyColumn]))
    const draft: Record<string, string | null> = {}
    for (const [k, v] of Object.entries(row)) {
      draft[k] = v === null ? null : typeof v === "object" ? JSON.stringify(v) : String(v)
    }
    setEditDraft(draft)
  }

  const cancelEdit = () => {
    setEditingRow(null)
    setEditDraft({})
  }

  const saveEdit = async () => {
    if (!detail?.primaryKeyColumn || !editingRow) return
    setSavingRow(true)
    try {
      const res = await fetch(`/api/db-management/tables/${encodeURIComponent(tableName)}/records`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pkValue: editingRow, data: editDraft }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error ?? "更新に失敗しました")
        return
      }
      setEditingRow(null)
      await fetchRecords(page)
    } finally {
      setSavingRow(false)
    }
  }

  const deleteRow = async (row: Record<string, unknown>) => {
    if (!detail?.primaryKeyColumn) return
    if (!confirm("このレコードを完全に削除します。よろしいですか？")) return
    const pkValue = String(row[detail.primaryKeyColumn])
    const res = await fetch(
      `/api/db-management/tables/${encodeURIComponent(tableName)}/records?pkValue=${encodeURIComponent(pkValue)}`,
      { method: "DELETE" }
    )
    if (!res.ok) {
      const err = await res.json()
      alert(err.error ?? "削除に失敗しました")
      return
    }
    await fetchRecords(page)
    await fetchDetail()
  }

  const deleteAllRows = async () => {
    if (deleteAllConfirmText !== "削除") return
    setDeletingAll(true)
    try {
      const res = await fetch(`/api/db-management/tables/${encodeURIComponent(tableName)}/records?all=true`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error ?? "削除に失敗しました")
        return
      }
      setDeleteAllModalOpen(false)
      setDeleteAllConfirmText("")
      setPage(1)
      await fetchRecords(1)
      await fetchDetail()
    } finally {
      setDeletingAll(false)
    }
  }

  if (loading || !detail) {
    return <div className="p-6 text-center text-gray-400">読み込み中...</div>
  }

  const totalPages = records ? Math.max(1, Math.ceil(records.total / records.pageSize)) : 1

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Link
        href="/dashboard/system/db-management"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> DB管理に戻る
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{detail.label}</h1>
        <p className="text-sm text-gray-400 mt-1">{detail.tableName}（{detail.count.toLocaleString()} 件）</p>
      </div>

      <div className="mb-6 bg-white border rounded-lg p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-600 mb-2">テーブル備考</label>
        <div className="flex items-start gap-2">
          <textarea
            value={tableNoteDraft}
            onChange={e => setTableNoteDraft(e.target.value)}
            rows={2}
            className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="このテーブル全体についてのメモ"
          />
          <button
            onClick={saveTableNote}
            disabled={savingTableNote}
            className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {savingTableNote ? "保存中..." : "保存"}
          </button>
        </div>
      </div>

      <div className="mb-6 bg-white border rounded-lg overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-gray-50 border-b font-semibold text-sm text-gray-700">
          フィールド一覧
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-2 text-gray-600 font-medium">カラム名</th>
              <th className="text-left px-4 py-2 text-gray-600 font-medium">型</th>
              <th className="text-left px-4 py-2 text-gray-600 font-medium">NULL許可</th>
              <th className="text-left px-4 py-2 text-gray-600 font-medium">備考</th>
              <th className="text-left px-4 py-2 text-gray-600 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {detail.columns.map(col => (
              <tr key={col.name}>
                <td className="px-4 py-2 text-gray-800 font-mono text-xs">{col.name}</td>
                <td className="px-4 py-2 text-gray-500 text-xs">{col.dataType}</td>
                <td className="px-4 py-2 text-gray-500 text-xs">{col.isNullable ? "可" : "不可"}</td>
                <td className="px-4 py-2">
                  <input
                    value={fieldNoteDrafts[col.name] ?? ""}
                    onChange={e =>
                      setFieldNoteDrafts(prev => ({ ...prev, [col.name]: e.target.value }))
                    }
                    className="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => saveFieldNote(col.name)}
                    disabled={savingField === col.name}
                    className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                  >
                    {savingField === col.name ? "保存中..." : "保存"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
          <span className="font-semibold text-sm text-gray-700">
            レコード一覧{detail.primaryKeyColumn ? "" : "（主キーが単一列でないため閲覧のみ）"}
          </span>
          {detail.primaryKeyColumn && (
            <button
              onClick={() => setDeleteAllModalOpen(true)}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 border border-red-200 rounded px-2 py-1 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> 全レコード削除
            </button>
          )}
        </div>
        {recordsLoading || !records ? (
          <div className="text-center py-8 text-gray-400 text-sm">読み込み中...</div>
        ) : records.rows.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">レコードがありません</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {detail.primaryKeyColumn && (
                      <th className="text-left px-3 py-2 text-gray-600 font-medium whitespace-nowrap">操作</th>
                    )}
                    {Object.keys(records.rows[0]).map(key => (
                      <th key={key} className="text-left px-3 py-2 text-gray-600 font-medium whitespace-nowrap">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.rows.map((row, i) => {
                    const rowPk = detail.primaryKeyColumn ? String(row[detail.primaryKeyColumn]) : null
                    const isEditing = detail.primaryKeyColumn && editingRow === rowPk
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        {detail.primaryKeyColumn && (
                          <td className="px-3 py-2 whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <button onClick={saveEdit} disabled={savingRow} className="text-green-600 hover:text-green-800 disabled:opacity-50">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button onClick={() => startEdit(row)} className="text-blue-600 hover:text-blue-800">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => deleteRow(row)} className="text-red-500 hover:text-red-700">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                        {Object.keys(records.rows[0]).map(key => (
                          <td key={key} className="px-3 py-2 text-gray-600 whitespace-nowrap max-w-xs">
                            {isEditing && key !== detail.primaryKeyColumn ? (
                              <input
                                value={editDraft[key] ?? ""}
                                onChange={e => setEditDraft(prev => ({ ...prev, [key]: e.target.value }))}
                                className="w-full border rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            ) : row[key] === null ? (
                              <span className="text-gray-300">null</span>
                            ) : typeof row[key] === "object" ? (
                              <span className="truncate block">{JSON.stringify(row[key])}</span>
                            ) : (
                              <span className="truncate block">{String(row[key])}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <span className="text-xs text-gray-500">
                {records.total.toLocaleString()} 件中 {(records.page - 1) * records.pageSize + 1}〜
                {Math.min(records.page * records.pageSize, records.total)} 件
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-2 py-1 text-xs border rounded disabled:opacity-40"
                >
                  前へ
                </button>
                <span className="text-xs text-gray-500">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-2 py-1 text-xs border rounded disabled:opacity-40"
                >
                  次へ
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {deleteAllModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
            <h2 className="text-lg font-bold text-red-600">{detail.label} 全レコード削除</h2>
            <p className="text-sm text-gray-600 mt-2">
              このテーブルの全レコード（{detail.count.toLocaleString()}件）を完全に削除します。この操作は元に戻せません。
            </p>
            <p className="text-sm text-gray-600 mt-2">
              続行する場合は下欄に「<span className="font-bold">削除</span>」と入力してください。
            </p>
            <input
              value={deleteAllConfirmText}
              onChange={e => setDeleteAllConfirmText(e.target.value)}
              placeholder="削除"
              className="w-full border rounded px-3 py-2 text-sm mt-3 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setDeleteAllModalOpen(false); setDeleteAllConfirmText("") }}
                className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={deleteAllRows}
                disabled={deleteAllConfirmText !== "削除" || deletingAll}
                className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deletingAll ? "削除中..." : "全レコード削除を実行"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
