"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Download, Upload, ChevronDown, ChevronRight, List } from "lucide-react"
type AddressBookContact = {
  id: string
  department: string | null
  position: string | null
  name: string | null
  honorific: string | null
  sort_order: number
}
type AddressBookRecord = {
  id: string
  uid: string
  company_name: string | null
  company_name_kana: string | null
  postal_code: string | null
  address1: string | null
  address2: string | null
  department_in_charge: string | null
  remarks: string | null
  created_at: string
  updated_at: string
  contacts: AddressBookContact[]
}
type CheckedItem = {
  key: string // "record:{id}" or "contact:{id}"
  company_name: string | null
  company_name_kana: string | null
  postal_code: string | null
  address1: string | null
  address2: string | null
  department_in_charge: string | null
  department: string | null
  position: string | null
  name: string | null
  honorific: string | null
  remarks: string | null
}
export default function AddressBookPage() {
  const router = useRouter()
  const [records, setRecords] = useState<AddressBookRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState("")
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [checkedItems, setCheckedItems] = useState<Map<string, CheckedItem>>(new Map())
  const [showOutputDialog, setShowOutputDialog] = useState(false)
  const [outputName, setOutputName] = useState("")
  const [outputRemarks, setOutputRemarks] = useState("")
  const [savingOutput, setSavingOutput] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const fetchRecords = async (p = page) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), keyword })
    const res = await fetch(`/api/address-book?${params}`)
    const data = await res.json()
    setRecords(data.records)
    setTotal(data.total)
    setLoading(false)
  }
  useEffect(() => { fetchRecords(1); setPage(1) }, [keyword])
  const totalPages = Math.ceil(total / 50)
  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  // 会社行チェック（担当者なし→会社のみ1行、担当者あり→全担当者行）
  const toggleRecordCheck = (r: AddressBookRecord, e: React.MouseEvent) => {
    e.stopPropagation()
    setCheckedItems(prev => {
      const next = new Map(prev)
      if (r.contacts.length === 0) {
        const key = `record:${r.id}`
        if (next.has(key)) {
          next.delete(key)
        } else {
          next.set(key, {
            key, company_name: r.company_name, company_name_kana: r.company_name_kana,
            postal_code: r.postal_code, address1: r.address1, address2: r.address2,
            department_in_charge: r.department_in_charge,
            department: null, position: null, name: null, honorific: null, remarks: r.remarks,
          })
        }
      } else {
        const allChecked = r.contacts.every(c => next.has(`contact:${c.id}`))
        if (allChecked) {
          r.contacts.forEach(c => next.delete(`contact:${c.id}`))
        } else {
          r.contacts.forEach(c => {
            const key = `contact:${c.id}`
            next.set(key, {
              key, company_name: r.company_name, company_name_kana: r.company_name_kana,
              postal_code: r.postal_code, address1: r.address1, address2: r.address2,
              department_in_charge: r.department_in_charge,
              department: c.department, position: c.position, name: c.name, honorific: c.honorific,
              remarks: r.remarks,
            })
          })
        }
      }
      return next
    })
  }
  // 担当者行個別チェック
  const toggleContactCheck = (r: AddressBookRecord, c: AddressBookContact, e: React.MouseEvent) => {
    e.stopPropagation()
    setCheckedItems(prev => {
      const next = new Map(prev)
      const key = `contact:${c.id}`
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.set(key, {
          key, company_name: r.company_name, company_name_kana: r.company_name_kana,
          postal_code: r.postal_code, address1: r.address1, address2: r.address2,
          department_in_charge: r.department_in_charge,
          department: c.department, position: c.position, name: c.name, honorific: c.honorific,
          remarks: r.remarks,
        })
      }
      return next
    })
  }
  const isRecordChecked = (r: AddressBookRecord) => {
    if (r.contacts.length === 0) return checkedItems.has(`record:${r.id}`)
    return r.contacts.every(c => checkedItems.has(`contact:${c.id}`))
  }
  const isRecordIndeterminate = (r: AddressBookRecord) => {
    if (r.contacts.length === 0) return false
    const checkedCount = r.contacts.filter(c => checkedItems.has(`contact:${c.id}`)).length
    return checkedCount > 0 && checkedCount < r.contacts.length
  }
  const handleCreateOutputList = async () => {
    if (!outputName.trim()) { alert("リスト名を入力してください"); return }
    setSavingOutput(true)
    const items = Array.from(checkedItems.values()).map((item, i) => ({ ...item, sort_order: i }))
    const res = await fetch("/api/output-lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: outputName, remarks: outputRemarks, items }),
    })
    if (res.ok) {
      const data = await res.json()
      setShowOutputDialog(false)
      setCheckedItems(new Map())
      setOutputName("")
      setOutputRemarks("")
      router.push(`/dashboard/address-book/output-lists/${data.id}`)
    } else {
      alert("作成に失敗しました")
    }
    setSavingOutput(false)
  }
  const handleExport = () => {
    const params = new URLSearchParams({ keyword })
    window.location.href = `/api/address-book/export?${params}`
  }
  const handleImport = async (file: File) => {
    setImporting(true)
    setImportProgress("アップロード中...")
    const presignRes = await fetch("/api/address-book/presign")
    const { url, key } = await presignRes.json()
    await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": "text/csv" } })
    let offset = 0
    while (true) {
      const res = await fetch("/api/address-book/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, offset }),
      })
      const data = await res.json()
      offset = data.offset
      setImportProgress(`処理中... ${offset} / ${data.total} 件`)
      if (data.done) break
    }
    setImportProgress(null)
    setImporting(false)
    fetchRecords(1)
    setPage(1)
  }
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">住所録</h1>
        <div className="flex gap-2">
          {checkedItems.size > 0 && (
            <button onClick={() => setShowOutputDialog(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700">
              <List className="w-4 h-4" /> 出力リストに追加（{checkedItems.size}件）
            </button>
          )}
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
            <Download className="w-4 h-4" /> エクスポート
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={importing}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50">
            <Upload className="w-4 h-4" /> {importing ? importProgress : "インポート"}
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = "" }} />
          <button onClick={() => router.push("/dashboard/address-book/new")}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700">
            <Plus className="w-4 h-4" /> 新規登録
          </button>
        </div>
      </div>
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="会社名・氏名・部門名・住所などで検索..."
          value={keyword} onChange={e => setKeyword(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm" autoComplete="off" />
      </div>
      {loading ? (
        <p className="text-gray-400 text-sm">読み込み中...</p>
      ) : records.length === 0 ? (
        <p className="text-gray-400 text-sm">データがありません</p>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
          {records.map((r, idx) => {
            const isExpanded = expandedIds.has(r.id)
            const hasContacts = r.contacts.length > 0
            const checked = isRecordChecked(r)
            const indeterminate = isRecordIndeterminate(r)
            return (
              <div key={r.id} className={idx > 0 ? "border-t border-gray-100" : ""}>
                {/* 会社行 */}
                <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50">
                  {/* チェックボックス */}
                  <input
                    type="checkbox"
                    checked={checked}
                    ref={el => { if (el) el.indeterminate = indeterminate }}
                    onChange={() => {}}
                    onClick={e => toggleRecordCheck(r, e)}
                    className="flex-shrink-0 w-4 h-4 accent-amber-600 cursor-pointer"
                  />
                  {/* 展開ボタン */}
                  <button
                    onClick={e => toggleExpand(r.id, e)}
                    className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 ${!hasContacts ? "invisible" : ""}`}
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {/* No */}
                  <span className="font-mono text-xs text-gray-400 w-14 flex-shrink-0">{r.uid}</span>
                  {/* 会社名（クリックで詳細） */}
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => router.push(`/dashboard/address-book/${r.id}`)}>
                    <p className="font-medium text-gray-800 truncate">{r.company_name || "—"}</p>
                    {r.company_name_kana && <p className="text-xs text-gray-400 truncate">{r.company_name_kana}</p>}
                  </div>
                  {/* 住所 */}
                  <div className="text-xs text-gray-500 flex-shrink-0 hidden sm:block w-48 truncate">
                    {r.postal_code && <span>〒{r.postal_code} </span>}
                    {r.address1}{!r.postal_code && !r.address1 && "—"}
                  </div>
                  {/* 担当部署 */}
                  <div className="text-xs text-gray-500 flex-shrink-0 hidden md:block w-20 truncate">
                    {r.department_in_charge || "—"}
                  </div>
                  {/* 担当者数バッジ */}
                  <div className="flex-shrink-0 w-16 text-right">
                    {hasContacts && (
                      <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                        {r.contacts.length}名
                      </span>
                    )}
                  </div>
                  {/* 更新日 */}
                  <span className="text-xs text-gray-400 flex-shrink-0 w-20 text-right hidden lg:block">
                    {new Date(r.updated_at).toLocaleDateString("ja-JP")}
                  </span>
                </div>
                {/* 担当者行（アコーディオン） */}
                {isExpanded && hasContacts && (
                  <div className="bg-amber-50/40 border-t border-amber-100">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-400 border-b border-amber-100">
                          <th className="pl-4 pr-2 py-1.5 w-8"></th>
                          <th className="pl-2 pr-4 py-1.5 w-6"></th>
                          <th className="px-4 py-1.5 text-left font-medium">部門名</th>
                          <th className="px-4 py-1.5 text-left font-medium">役職名</th>
                          <th className="px-4 py-1.5 text-left font-medium">氏名</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.contacts.map((c, i) => (
                          <tr key={c.id} className={i > 0 ? "border-t border-amber-100" : ""}>
                            <td className="pl-4 pr-2 py-1.5">
                              <input
                                type="checkbox"
                                checked={checkedItems.has(`contact:${c.id}`)}
                                onChange={() => {}}
                                onClick={e => toggleContactCheck(r, c, e)}
                                className="w-4 h-4 accent-amber-600 cursor-pointer"
                              />
                            </td>
                            <td className="pl-2 pr-4 py-1.5 text-gray-300">{i + 1}</td>
                            <td className="px-4 py-1.5 text-gray-600">{c.department || "—"}</td>
                            <td className="px-4 py-1.5 text-gray-600">{c.position || "—"}</td>
                            <td className="px-4 py-1.5 text-gray-800">
                              {c.name ? `${c.name}${c.honorific ? ` ${c.honorific}` : ""}` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">{total}件中 {(page - 1) * 50 + 1}〜{Math.min(page * 50, total)}件</p>
          <div className="flex gap-2">
            <button onClick={() => { setPage(p => p - 1); fetchRecords(page - 1) }} disabled={page === 1}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">← 前</button>
            <span className="px-3 py-1.5 text-sm">{page} / {totalPages}</span>
            <button onClick={() => { setPage(p => p + 1); fetchRecords(page + 1) }} disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">次 →</button>
          </div>
        </div>
      )}
      {/* 出力リスト作成ダイアログ */}
      {showOutputDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowOutputDialog(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">出力リストに追加</h2>
            <p className="text-sm text-gray-500 mb-4">{checkedItems.size}件の行を追加します</p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">リスト名 <span className="text-red-500">*</span></label>
                <input
                  value={outputName}
                  onChange={e => setOutputName(e.target.value)}
                  placeholder="例：2026年度年賀状用、挨拶状用など"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoComplete="off"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">備考（任意）</label>
                <input
                  value={outputRemarks}
                  onChange={e => setOutputRemarks(e.target.value)}
                  placeholder="メモなど"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowOutputDialog(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">キャンセル</button>
              <button onClick={handleCreateOutputList} disabled={savingOutput || !outputName.trim()}
                className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50">
                {savingOutput ? "作成中..." : "作成する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
