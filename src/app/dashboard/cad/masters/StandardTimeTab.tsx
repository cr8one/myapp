"use client"

import { useEffect, useState } from "react"

type Row = {
  option_id: string
  name: string
  min_kosei: number | null
  min_yugata: number | null
  min_shinki: number | null
  note: string | null
}

type Draft = {
  min_kosei: string
  min_yugata: string
  min_shinki: string
  note: string
}

type MinuteKey = "min_kosei" | "min_yugata" | "min_shinki"

const COLUMNS: { key: MinuteKey; label: string }[] = [
  { key: "min_kosei", label: "校正カット" },
  { key: "min_yugata", label: "有型 白ダミー" },
  { key: "min_shinki", label: "新規形 白ダミー" },
]

const CANDIDATES = [15, 20, 25, 30, 35, 60]

function toDraft(r: Row): Draft {
  return {
    min_kosei: r.min_kosei === null ? "" : String(r.min_kosei),
    min_yugata: r.min_yugata === null ? "" : String(r.min_yugata),
    min_shinki: r.min_shinki === null ? "" : String(r.min_shinki),
    note: r.note ?? "",
  }
}

export default function StandardTimeTab() {
  const [rows, setRows] = useState<Row[]>([])
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [saved, setSaved] = useState<Record<string, Draft>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/cad/masters/standard-times")
      .then(async res => {
        if (res.ok === false) throw new Error("読み込みに失敗しました")
        return res.json() as Promise<Row[]>
      })
      .then(data => {
        const d: Record<string, Draft> = {}
        data.forEach(r => { d[r.option_id] = toDraft(r) })
        setRows(data)
        setDrafts(d)
        setSaved(d)
      })
      .catch(e => setLoadError(e instanceof Error ? e.message : "読み込みに失敗しました"))
      .finally(() => setLoading(false))
  }, [])

  const setField = (id: string, key: keyof Draft, value: string) => {
    setDrafts(prev => ({ ...prev, [id]: { ...prev[id], [key]: value } }))
  }

  const isChanged = (id: string) => {
    const a = drafts[id]
    const b = saved[id]
    if (a === undefined || b === undefined) return false
    return a.min_kosei !== b.min_kosei || a.min_yugata !== b.min_yugata || a.min_shinki !== b.min_shinki || a.note !== b.note
  }

  const save = async (id: string) => {
    const d = drafts[id]
    if (d === undefined) return
    setSavingId(id)
    try {
      const res = await fetch("/api/cad/masters/standard-times", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          option_id: id,
          min_kosei: d.min_kosei === "" ? null : Number(d.min_kosei),
          min_yugata: d.min_yugata === "" ? null : Number(d.min_yugata),
          min_shinki: d.min_shinki === "" ? null : Number(d.min_shinki),
          note: d.note,
        }),
      })
      const data = await res.json()
      if (res.ok === false) {
        alert(data.error ?? "保存に失敗しました")
        return
      }
      const next = toDraft(data as Row)
      setDrafts(prev => ({ ...prev, [id]: next }))
      setSaved(prev => ({ ...prev, [id]: next }))
    } finally {
      setSavingId(null)
    }
  }

  if (loading) return <p className="text-sm text-gray-400">読み込み中...</p>
  if (loadError !== "") return <p className="text-sm text-red-600">{loadError}</p>

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        品目名（入力候補）ごとに、依頼内容別の作業標準時間（分・標準個数4個）を登録します。品目名そのものは「入力候補」タブで管理します。
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">品目名が登録されていません。先に「入力候補」タブで品目名を登録してください。</p>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-600">
                <th className="text-left px-4 py-2 font-medium">品目名</th>
                {COLUMNS.map(c => (
                  <th key={c.key} className="text-right px-4 py-2 font-medium whitespace-nowrap">{c.label}（分）</th>
                ))}
                <th className="text-left px-4 py-2 font-medium">備考</th>
                <th className="px-4 py-2 w-24" />
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const d = drafts[r.option_id]
                if (d === undefined) return null
                return (
                  <tr key={r.option_id} className="border-b last:border-b-0">
                    <td className="px-4 py-2 whitespace-nowrap">{r.name}</td>
                    {COLUMNS.map(c => (
                      <td key={c.key} className="px-4 py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          list="standard-time-candidates"
                          value={d[c.key]}
                          onChange={e => setField(r.option_id, c.key, e.target.value)}
                          className="h-8 w-20 border rounded px-2 text-sm text-right"
                          autoComplete="off"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={d.note}
                        onChange={e => setField(r.option_id, "note", e.target.value)}
                        className="h-8 w-full min-w-40 border rounded px-2 text-sm"
                        autoComplete="off"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      {isChanged(r.option_id) && (
                        <button
                          onClick={() => save(r.option_id)}
                          disabled={savingId === r.option_id}
                          className="h-8 px-3 rounded bg-lime-600 text-white text-sm hover:bg-lime-700 disabled:opacity-50"
                        >
                          {savingId === r.option_id ? "保存中..." : "保存"}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <datalist id="standard-time-candidates">
            {CANDIDATES.map(m => <option key={m} value={m} />)}
          </datalist>
        </div>
      )}
    </div>
  )
}