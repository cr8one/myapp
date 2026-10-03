"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

type Pending = {
  id: string
  submission_month: string
  usage_month: string
  rendo_tray_cd: string
  tray_name: string
  planned_qty: number
  item_name: string | null
  usage_person_name: string | null
}

function fmt(ym: string) {
  return `${ym.slice(0, 4)}年${Number(ym.slice(4, 6))}月`
}

export default function TrayUsageApprovalPage() {
  const [records, setRecords] = useState<Pending[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const load = async () => {
    setLoading(true)
    const res = await fetch("/api/tray/usage-approval")
    if (res.ok) {
      setRecords(await res.json())
      setSelected(new Set())
    } else {
      const e = await res.json().catch(() => ({}))
      setError(e.error ?? "読み込みに失敗しました")
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const allSelected = records.length > 0 && selected.size === records.length
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(records.map(r => r.id)))

  const approve = async () => {
    if (selected.size === 0) return
    if (!confirm(`${selected.size}件を承認します。よろしいですか？`)) return
    setError(""); setMessage(""); setBusy(true)
    const res = await fetch("/api/tray/usage-approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    })
    const d = await res.json().catch(() => ({}))
    setBusy(false)
    if (res.ok) {
      setMessage(`${d.count}件を承認しました${d.skipped ? `（${d.skipped}件は承認できませんでした）` : ""}`)
      load()
    } else {
      setError(d.error ?? "承認に失敗しました")
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-bold text-gray-800">トレイ使用予定 承認</h1>

      {error && <p className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {message && <p className="mb-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : records.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-gray-500">承認待ちの明細はありません。</div>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-3">
            <Button onClick={approve} disabled={busy || selected.size === 0}>選択した{selected.size}件を承認</Button>
            <span className="text-sm text-gray-500">承認待ち {records.length}件</span>
          </div>
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2"><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
                  <th className="px-3 py-2 text-left">提出月</th>
                  <th className="px-3 py-2 text-left">使用年月</th>
                  <th className="px-3 py-2 text-left">トレイ名</th>
                  <th className="px-3 py-2 text-right">数量</th>
                  <th className="px-3 py-2 text-left">タイトル</th>
                  <th className="px-3 py-2 text-left">作成者</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2 text-center"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} /></td>
                    <td className="px-3 py-2">{fmt(r.submission_month)}</td>
                    <td className="px-3 py-2">{fmt(r.usage_month)}</td>
                    <td className="px-3 py-2">{r.tray_name}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.planned_qty.toLocaleString()}</td>
                    <td className="px-3 py-2">{r.item_name || "—"}</td>
                    <td className="px-3 py-2">{r.usage_person_name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
