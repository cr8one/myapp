"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

type Counts = { total: number; unapproved: number; tempLocked: number; locked: number }
type MonthRow = { submission_month: string; deadline: string | null; lock_a_flg: boolean; counts: Counts }

function fmt(ym: string) {
  return `${ym.slice(0, 4)}年${Number(ym.slice(4, 6))}月`
}

export default function TrayUsageAdminPage() {
  const [rows, setRows] = useState<MonthRow[]>([])
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [newMonth, setNewMonth] = useState("")
  const [newDeadline, setNewDeadline] = useState("")

  const load = async () => {
    setLoading(true)
    const res = await fetch("/api/tray/usage-admin")
    if (res.status === 403) {
      setDenied(true)
    } else if (res.ok) {
      setRows(await res.json())
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const run = async (fn: () => Promise<Response>, successMsg: (d: Record<string, unknown>) => string) => {
    setError(""); setMessage(""); setBusy(true)
    const res = await fn()
    const d = await res.json().catch(() => ({}))
    setBusy(false)
    if (res.ok) {
      setMessage(successMsg(d))
      load()
    } else {
      setError((d as { error?: string }).error ?? "操作に失敗しました")
    }
  }

  const createMonth = () => run(
    () => fetch("/api/tray/usage-admin", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submission_month: newMonth, deadline: newDeadline || null }),
    }),
    () => `${newMonth} を作成しました`,
  ).then(() => { setNewMonth(""); setNewDeadline("") })

  const updateSetting = (month: string, body: Record<string, unknown>, msg: string) => run(
    () => fetch("/api/tray/usage-admin", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submission_month: month, ...body }),
    }),
    () => msg,
  )

  const tempLock = (month: string) => {
    if (!confirm("入力明細に仮ロックをかけて、営業側から編集・削除ができなくなります。よろしいですか？")) return
    run(
      () => fetch("/api/tray/usage-admin/temp-lock", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_month: month }),
      }),
      d => `${d.count}件、仮ロックをかけました`,
    )
  }
  const closeMonth = (month: string) => {
    if (!confirm(`${fmt(month)}の締め作業を行います。\n明細に本ロックをかけ、翌月の提出月を作成し、翌々月以降の明細を複製します。よろしいですか？`)) return
    run(
      () => fetch("/api/tray/usage-admin/close", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_month: month }),
      }),
      d => `締め作業が完了しました（本ロック ${d.locked}件、${fmt(String(d.newMonth))}へ複製 ${d.copied}件）`,
    )
  }
  const tempUnlock = (month: string) => {
    if (!confirm("仮ロックを外します。よろしいですか？（本ロック済みの明細は外れません）")) return
    run(
      () => fetch("/api/tray/usage-admin/temp-lock", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_month: month }),
      }),
      d => `${d.count}件、仮ロックを外しました`,
    )
  }

  if (denied) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-gray-800">使用予定 管理（購買担当）</h1>
        <p className="mt-3 text-gray-500">購買担当者のみ操作できます。</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-bold text-gray-800">使用予定 管理（購買担当）</h1>

      {error && <p className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {message && <p className="mb-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}

      <div className="mb-6 rounded-lg border bg-white p-4">
        <div className="mb-2 text-sm font-semibold text-gray-700">提出月を作成</div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <div className="mb-1 text-xs text-gray-500">提出月（6桁・例：202610）</div>
            <input value={newMonth} onChange={e => setNewMonth(e.target.value)} maxLength={6} className="h-9 w-32 rounded-md border px-2 text-sm" />
          </div>
          <div>
            <div className="mb-1 text-xs text-gray-500">営業の締め切り日</div>
            <input type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} className="h-9 rounded-md border px-2 text-sm" />
          </div>
          <Button onClick={createMonth} disabled={busy || !/^\d{6}$/.test(newMonth)}>作成</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">提出月</th>
                <th className="px-3 py-2 text-left">締め切り日</th>
                <th className="px-3 py-2 text-left">新規登録</th>
                <th className="px-3 py-2 text-right">明細</th>
                <th className="px-3 py-2 text-right">未承認</th>
                <th className="px-3 py-2 text-right">仮ロック</th>
                <th className="px-3 py-2 text-right">本ロック</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.submission_month} className="border-t">
                  <td className="px-3 py-2 font-semibold">{fmt(r.submission_month)}</td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      defaultValue={r.deadline ? r.deadline.slice(0, 10) : ""}
                      onBlur={e => {
                        const v = e.target.value
                        if (v !== (r.deadline ? r.deadline.slice(0, 10) : "")) updateSetting(r.submission_month, { deadline: v || null }, "締め切り日を更新しました")
                      }}
                      className="h-8 rounded-md border px-2 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.lock_a_flg ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {r.lock_a_flg ? "停止中（ロックA）" : "受付中"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.counts.total}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.counts.unapproved}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.counts.tempLocked}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.counts.locked}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <Button size="sm" variant="outline" disabled={busy} className="mr-2"
                      onClick={() => updateSetting(r.submission_month, { lock_a_flg: !r.lock_a_flg }, r.lock_a_flg ? "ロックAを解除しました" : "ロックAをかけました")}>
                      {r.lock_a_flg ? "ロックA解除" : "ロックA（新規登録を停止）"}
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy} className="mr-2" onClick={() => tempLock(r.submission_month)}>仮ロック（ロックB）</Button>
                    <Button size="sm" variant="outline" disabled={busy} className="mr-2" onClick={() => tempUnlock(r.submission_month)}>仮ロック解除</Button>
                    <Button size="sm" disabled={busy} onClick={() => closeMonth(r.submission_month)}>締め作業</Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">提出月がまだありません。上のフォームから作成してください。</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
