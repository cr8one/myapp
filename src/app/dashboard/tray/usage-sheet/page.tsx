"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AutocompleteInput } from "@/components/ui/autocomplete-input"
import { UsageDetailModal } from "@/components/tray/UsageDetailModal"

type Setting = { submission_month: string; deadline: string | null; lock_a_flg: boolean }
type Row = { id: string; name: string; type: string; rendo_tray_cd: string | null; qty: number[] }
type SheetData = { setting: Setting | null; months: string[]; rows: Row[] }
type Department = { id: string; name: string; groups: { id: string; name: string }[] }
type User = { id: string; name: string | null; primaryDept: string; primaryGroup: string; departmentLabels: string[] }

const TYPE_FILTERS = ["すべて", "CD", "DVD", "BD", "その他"]

function fmt(ym: string) {
  return `${ym.slice(0, 4)}年${Number(ym.slice(4, 6))}月`
}
function monthLabel(ym: string) {
  return `${Number(ym.slice(4, 6))}月`
}
function addMonths(ym: string, n: number): string {
  const y = Number(ym.slice(0, 4))
  const m = Number(ym.slice(4, 6)) - 1 + n
  const yy = y + Math.floor(m / 12)
  const mm = ((m % 12) + 12) % 12 + 1
  return `${yy}${String(mm).padStart(2, "0")}`
}

export default function TrayUsageSheetPage() {
  const [submissionMonth, setSubmissionMonth] = useState("")
  const [typeFilter, setTypeFilter] = useState("すべて")
  const [dept, setDept] = useState("")
  const [group, setGroup] = useState("")
  const [personId, setPersonId] = useState("")
  const [departments, setDepartments] = useState<Department[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [data, setData] = useState<SheetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [selectedRow, setSelectedRow] = useState<Row | null>(null)

  // 初期化：部署・ユーザーの選択肢と、ログイン中ユーザーのメイン部署を既定値にする
  useEffect(() => {
    Promise.all([
      fetch("/api/masters/departments").then(r => r.json()),
      fetch("/api/users/list").then(r => r.json()),
      fetch("/api/auth/session").then(r => r.json()),
    ]).then(([deps, us, session]) => {
      setDepartments(deps)
      setUsers(us)
      const me = (us as User[]).find(u => u.id === session?.user?.id)
      if (me?.primaryDept) setDept(me.primaryDept)
      if (me?.primaryGroup) setGroup(me.primaryGroup)
      setInitialized(true)
    })
  }, [])

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (submissionMonth) params.set("submission_month", submissionMonth)
    if (typeFilter !== "すべて") params.set("type", typeFilter)
    if (dept) params.set("dept", dept)
    if (group) params.set("group", group)
    if (personId) params.set("person_id", personId)
    const res = await fetch(`/api/tray/usage-sheet?${params.toString()}`)
    if (res.ok) {
      const d: SheetData = await res.json()
      setData(d)
      if (!submissionMonth && d.setting) setSubmissionMonth(d.setting.submission_month)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (initialized) load()
  }, [initialized, submissionMonth, typeFilter, dept, group, personId])

  useEffect(() => {
    if (!personId) return
    const stillValid = users.some(u => u.id === personId && (
      !dept ? true
        : group ? u.departmentLabels.includes(`${dept} ${group}`)
        : u.departmentLabels.some(l => l === dept || l.startsWith(`${dept} `))
    ))
    if (!stillValid) setPersonId("")
  }, [dept, group, users])

  const deptOptions = departments.map(d => ({ id: d.id, label: d.name }))
  const groupNames = departments.find(d => d.name === dept)?.groups.map(g => g.name) ?? []
  // 作成者の選択肢：部署・グループに合わせて絞り込む
  const filteredUsers = users.filter(u => {
    if (!dept) return true
    if (group) return u.departmentLabels.includes(`${dept} ${group}`)
    return u.departmentLabels.some(l => l === dept || l.startsWith(`${dept} `))
  })

  const setting = data?.setting ?? null
  const status = !setting ? "準備中" : setting.lock_a_flg ? "新規登録 締め切り済み" : "入力受付中"
  const statusCls = !setting
    ? "bg-gray-100 text-gray-600"
    : setting.lock_a_flg
      ? "bg-red-100 text-red-700"
      : "bg-green-100 text-green-700"

  const monthHeaders = data && submissionMonth
    ? [
        `${monthLabel(data.months[0])}（翌月）`,
        `${monthLabel(data.months[1])}（2ヶ月後）`,
        `${monthLabel(data.months[2])}（3ヶ月後）`,
        `${monthLabel(addMonths(submissionMonth, 4))}以降`,
      ]
    : []

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-800">トレイ使用予定表</h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border bg-white p-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={!submissionMonth} onClick={() => setSubmissionMonth(addMonths(submissionMonth, -1))}>‹</Button>
          <div>
            <div className="text-xs text-gray-500">提出月</div>
            <div className="text-lg font-bold text-gray-800">{submissionMonth ? fmt(submissionMonth) : "—"}</div>
          </div>
          <Button variant="outline" size="sm" disabled={!submissionMonth} onClick={() => setSubmissionMonth(addMonths(submissionMonth, 1))}>›</Button>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${statusCls}`}>{status}</span>
        {setting?.deadline && (
          <span className="text-sm text-gray-600">締め切り：{new Date(setting.deadline).toLocaleDateString("ja-JP")}</span>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <div className="mb-1 text-xs text-gray-500">トレイの種類</div>
          <div className="flex gap-1">
            {TYPE_FILTERS.map(t => (
              <button key={t} type="button" onClick={() => setTypeFilter(t)}
                className={`rounded px-3 py-1.5 text-sm ${typeFilter === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="w-56">
          <div className="mb-1 text-xs text-gray-500">部署</div>
          <AutocompleteInput value={dept} onChange={v => { setDept(v); setGroup("") }} options={deptOptions} className="h-[38px] py-2" />
        </div>
        <div className="w-56">
          <div className="mb-1 text-xs text-gray-500">グループ</div>
          <select value={group} onChange={e => setGroup(e.target.value)} disabled={!dept || groupNames.length === 0}
            className="h-[38px] w-full rounded-md border px-2 text-sm disabled:bg-gray-100">
            <option value="">すべて（部署の全員）</option>
            {groupNames.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="w-48">
          <div className="mb-1 text-xs text-gray-500">作成者</div>
          <select value={personId} onChange={e => setPersonId(e.target.value)} className="h-[38px] w-full rounded-md border px-2 text-sm">
            <option value="">すべて</option>
            {filteredUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : !data?.setting ? (
        <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
          この提出月は、まだ準備中です。購買担当者が提出月を作成すると、入力できるようになります。
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">種類</th>
                <th className="px-3 py-2 text-left">トレイ名</th>
                {monthHeaders.map(h => <th key={h} className="px-3 py-2 text-right">{h}</th>)}
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-500">{r.type}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  {r.qty.map((q, i) => (
                    <td key={i} className="px-3 py-2 text-right tabular-nums">{q > 0 ? q.toLocaleString() : ""}</td>
                  ))}
                  <td className="px-3 py-2 text-right">
                    {r.rendo_tray_cd ? (
                      <Button size="sm" onClick={() => setSelectedRow(r)}>入力</Button>
                    ) : (
                      <span className="text-xs text-gray-400">連動コード未設定</span>
                    )}
                  </td>
                </tr>
              ))}
              {data.rows.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">該当するトレイがありません</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {selectedRow && selectedRow.rendo_tray_cd && submissionMonth && (
        <UsageDetailModal
          submissionMonth={submissionMonth}
          trayName={selectedRow.name}
          rendoTrayCd={selectedRow.rendo_tray_cd}
          onClose={() => { setSelectedRow(null); load() }}
        />
      )}
    </div>
  )
}
