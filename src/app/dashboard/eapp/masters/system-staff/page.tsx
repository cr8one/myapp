"use client"
import { useEffect, useState } from "react"
import { Plus, Trash2, UserCog } from "lucide-react"

type UserOption = { id: string; name: string | null; email: string }
type Staff = {
  id: string
  sort_order: number
  user: { id: string; name: string | null; email: string }
}

export default function SystemStaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [userId, setUserId] = useState("")

  const fetchAll = async () => {
    setLoading(true)
    const [staffRes, userRes] = await Promise.all([
      fetch("/api/eapp/masters/system-staff"),
      fetch("/api/users/list"),
    ])
    setStaff(await staffRes.json())
    setUsers(await userRes.json())
    setLoading(false)
  }
  useEffect(() => { fetchAll() }, [])

  const add = async () => {
    if (!userId) return
    await fetch("/api/eapp/masters/system-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, sort_order: staff.length }),
    })
    setShowForm(false)
    setUserId("")
    fetchAll()
  }
  const remove = async (id: string) => {
    if (!confirm("このシステム担当者を削除しますか？")) return
    await fetch(`/api/eapp/masters/system-staff/${id}`, { method: "DELETE" })
    fetchAll()
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <UserCog className="w-6 h-6 text-slate-600" />
          <h1 className="text-xl font-bold text-gray-900">システム担当者マスタ</h1>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 px-3 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800">
          <Plus className="w-4 h-4" /> 追加
        </button>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        得意先申請の全ステップ承認完了時に「PRINSER登録依頼」メールが届く担当者です。ここに登録されたユーザーのみ、承認完了後の申請を「登録済み」に変更できます。
      </p>
      {showForm && (
        <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex gap-2">
            <select className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={userId} onChange={e => setUserId(e.target.value)}>
              <option value="">-- ユーザーを選択 --</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <button onClick={add} className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800">保存</button>
            <button onClick={() => setShowForm(false)} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">キャンセル</button>
          </div>
        </div>
      )}
      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : staff.length === 0 ? (
        <p className="text-sm text-gray-400">まだ登録されていません。</p>
      ) : (
        <div className="space-y-2">
          {staff.map(s => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm">
              <span className="flex-1 font-medium text-gray-900">{s.user.name}</span>
              <span className="text-xs text-gray-400">{s.user.email}</span>
              <button onClick={() => remove(s.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
