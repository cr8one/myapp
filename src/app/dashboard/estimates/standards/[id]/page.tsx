"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"

type Cell = { value: number | null; is_lump: boolean }
type Sheet = {
  code: string
  name: string
  kind: string
  source: { standard_id: string; name: string; inherited: boolean }
  items?: { id: string; name: string; value: number | null; is_lump: boolean }[]
  columns?: { id: string; name: string }[]
  tiers?: { id: string; lot_from: number; lot_to: number | null; cells: Record<string, Cell> }[]
}
type Content = {
  standard: { id: string; name: string; remarks: string | null; is_archived: boolean; parent: { id: string; name: string } | null }
  sheets: Sheet[]
}

const fmt = (v: number | null) => (v === null ? "" : v.toLocaleString("ja-JP", { maximumFractionDigits: 4 }))
const lotLabel = (from: number, to: number | null) => `${from.toLocaleString()}〜${to === null ? "" : to.toLocaleString()}`

export default function EstimateStandardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<Content | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await fetch(`/api/estimates/standards/${id}/content`)
      const body = await res.json().catch(() => null)
      if (!res.ok) setError(body?.error ?? "読み込みに失敗しました")
      else setData(body)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="p-6 text-sm text-gray-400">読み込み中...</div>
  if (error || !data) return <div className="p-6 text-sm text-red-600">{error || "データがありません"}</div>

  const { standard, sheets } = data

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold text-gray-900">
          {standard.name}
          {standard.is_archived && <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">アーカイブ</span>}
        </h1>
        <Link href="/dashboard/estimates/standards" className="text-sm text-gray-500 hover:text-gray-700">← 見積書マスタに戻る</Link>
      </div>
      <p className="text-xs text-gray-400 mb-1">
        {standard.parent ? (
          <>親の基準：<Link href={`/dashboard/estimates/standards/${standard.parent.id}`} className="text-blue-700 hover:underline">{standard.parent.name}</Link></>
        ) : "親の基準：なし"}
        {standard.remarks ? `　備考：${standard.remarks}` : ""}
      </p>
      <p className="text-xs text-gray-400 mb-6">
        <span className="inline-block px-1.5 py-0.5 bg-amber-50 text-amber-800 font-semibold rounded mr-1">黄色</span>
        は、一式の金額（損紙では、固定の枚数）です。そうでない数字は、単価（損紙では、率）です。空欄は、未設定です。
      </p>

      <div className="space-y-8">
        {sheets.map(s => (
          <section key={s.code}>
            <div className="flex items-baseline gap-3 mb-2">
              <h2 className="text-base font-bold text-gray-800">{s.name}</h2>
              {s.source.inherited && (
                <span className="text-xs text-blue-700">親の基準「{s.source.name}」から引き継ぎ</span>
              )}
            </div>

            {s.kind === "matrix" ? (
              !s.tiers || s.tiers.length === 0 ? (
                <p className="text-sm text-gray-400">この表には、値がありません。</p>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm">
                  <table className="text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="sticky left-0 bg-slate-50 border-b border-r border-gray-200 px-3 py-2 text-left whitespace-nowrap">ロット範囲</th>
                        {s.columns!.map(c => (
                          <th key={c.id} className="border-b border-gray-200 px-3 py-2 text-left font-medium text-gray-700 min-w-[110px]">{c.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.tiers.map(t => (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="sticky left-0 bg-white border-b border-r border-gray-100 px-3 py-1.5 whitespace-nowrap text-gray-700">
                            {lotLabel(t.lot_from, t.lot_to)}
                          </td>
                          {s.columns!.map(c => {
                            const cell = t.cells[c.id]
                            return (
                              <td
                                key={c.id}
                                className={`border-b border-gray-100 px-3 py-1.5 text-right tabular-nums ${cell?.is_lump ? "bg-amber-50 font-semibold text-amber-900" : "text-gray-700"}`}
                              >
                                {fmt(cell?.value ?? null)}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : !s.items || s.items.length === 0 ? (
              <p className="text-sm text-gray-400">この表には、値がありません。</p>
            ) : (
              <div className="border border-gray-200 rounded-xl bg-white shadow-sm divide-y divide-gray-100 max-w-2xl">
                {s.items.map(it => (
                  <div key={it.id} className="flex items-center justify-between px-4 py-2 text-sm">
                    <span className="text-gray-800">{it.name}</span>
                    <span className={`tabular-nums px-2 py-0.5 rounded ${it.is_lump ? "bg-amber-50 font-semibold text-amber-900" : "text-gray-700"}`}>
                      {it.value === null ? "—" : fmt(it.value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}