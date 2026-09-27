"use client"
import { useEffect, useRef, useState } from "react"
import { Download, Upload, FileDown, X } from "lucide-react"

type InventoryRecord = {
  id: string
  inventory_month: string
  rendo_tray_cd: string
  remaining_qty: number
}

function formatMonth(m: string) {
  if (m.length !== 6) return m
  return `${m.slice(0, 4)}年${m.slice(4, 6)}月`
}

function previousMonth(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() // 0-indexed: 現在の月の前月 = 今月(1-indexed)-1 = m
  const target = new Date(y, m - 1, 1)
  const yyyy = target.getFullYear()
  const mm = String(target.getMonth() + 1).padStart(2, "0")
  return `${yyyy}${mm}`
}

export default function TrayInventoryPage() {
  const [months, setMonths] = useState<string[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [records, setRecords] = useState<InventoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadMonths = async () => {
    const res = await fetch("/api/tray/inventory/months")
    const data: string[] = await res.json()
    setMonths(data)
    if (!selectedMonth && data.length > 0) setSelectedMonth(data[0])
    return data
  }

  const loadRecords = async (month: string) => {
    if (!month) { setRecords([]); setLoading(false); return }
    setLoading(true)
    const res = await fetch(`/api/tray/inventory?month=${encodeURIComponent(month)}`)
    const data = await res.json()
    setRecords(data)
    setLoading(false)
  }

  useEffect(() => {
    loadMonths().then(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedMonth) loadRecords(selectedMonth)
  }, [selectedMonth])

  const handleImportClick = () => {
    setError("")
    setShowConfirm(true)
  }

  const handleConfirmImport = () => {
    setShowConfirm(false)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError("")
    setImporting(true)
    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
      const parsed = lines.map(line => {
        const [rendo_tray_cd, qtyStr] = line.split(",")
        return { rendo_tray_cd: (rendo_tray_cd ?? "").trim(), remaining_qty: parseInt((qtyStr ?? "0").trim(), 10) || 0 }
      }).filter(r => r.rendo_tray_cd)

      const inventory_month = previousMonth()
      const res = await fetch("/api/tray/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventory_month, records: parsed }),
      })
      if (!res.ok) { setError("インポートに失敗しました"); return }
      await loadMonths()
      setSelectedMonth(inventory_month)
    } catch {
      setError("CSVの読み込みに失敗しました")
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleTemplateDownload = () => {
    window.open("/api/tray/inventory/template", "_blank")
  }

  const handleExport = () => {
    if (!selectedMonth) return
    window.open(`/api/tray/inventory/export?month=${encodeURIComponent(selectedMonth)}`, "_blank")
  }

  const targetMonth = previousMonth()

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">棚卸しデータ</h1>
          <p className="text-sm text-gray-400 mt-1">トレイの月次棚卸し残数管理</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleTemplateDownload} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <FileDown size={16} /> テンプレート
          </button>
          <button onClick={handleExport} disabled={!selectedMonth} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
            <Download size={16} /> エクスポート
          </button>
          <button onClick={handleImportClick} className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
            <Upload size={16} /> CSVインポート
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {importing && <p className="mb-4 text-sm text-amber-500">インポート中...</p>}

      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm text-gray-500">表示する年月：</label>
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-sm"
        >
          {months.length === 0 && <option value="">データなし</option>}
          {months.map(m => (
            <option key={m} value={m}>{formatMonth(m)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : records.length === 0 ? (
        <p className="text-sm text-gray-400">表示できる棚卸しデータがありません</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">連動トレイコード</th>
                <th className="px-4 py-2 font-medium text-right">残数</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{r.rendo_tray_cd}</td>
                  <td className="px-4 py-2 text-right">{r.remaining_qty.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">インポート確認</h2>
              <button onClick={() => setShowConfirm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              <span className="font-bold text-amber-600">{formatMonth(targetMonth)}</span>分の棚卸しデータとしてインポートします。よろしいですか？
            </p>
            <p className="mt-2 text-xs text-gray-400">同月分のデータが既にある場合は上書きされます。</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowConfirm(false)} className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                キャンセル
              </button>
              <button onClick={handleConfirmImport} className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
                この年月でCSVを選択
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
