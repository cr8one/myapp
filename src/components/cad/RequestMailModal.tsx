"use client"
import { useState, useEffect } from "react"
import { X, Send } from "lucide-react"

type User = { id: string; name: string | null; email: string; position: string | null; departmentLabels: string[] }
type MailRecipient = { id: string; email: string; sort_order: number }

type CadRequest = {
  id: string
  uid: string
  content: string | null
}

type Props = {
  record: CadRequest
  onClose: () => void
  onSent: (updated: unknown) => void
}

export default function RequestMailModal({ record, onClose, onSent }: Props) {
  const [toRecipients, setToRecipients] = useState<MailRecipient[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [ccList, setCcList] = useState<string[]>([])
  const [ccUserSelect, setCcUserSelect] = useState("")
  const [ccManualInput, setCcManualInput] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/cad/masters/mail-recipients").then(r => r.json()),
      fetch("/api/cad/masters/mail-template").then(r => r.json()),
      fetch("/api/users/list").then(r => r.json()),
    ]).then(([recipients, template, userList]) => {
      setToRecipients(recipients)
      setBody(template.body ?? "")
      setUsers(userList)
      setSubject(`CAD依頼 No${record.uid}_${record.content ?? ""}`)
      setLoading(false)
    })
  }, [record])

  const addCcFromUser = () => {
    if (!ccUserSelect) return
    const user = users.find(u => u.id === ccUserSelect)
    if (user?.email && !ccList.includes(user.email)) {
      setCcList(list => [...list, user.email])
    }
    setCcUserSelect("")
  }

  const addCcManual = () => {
    const v = ccManualInput.trim()
    if (v && !ccList.includes(v)) {
      setCcList(list => [...list, v])
    }
    setCcManualInput("")
  }

  const removeCc = (email: string) => {
    setCcList(list => list.filter(e => e !== email))
  }

  const handleSend = async () => {
    setSending(true); setError("")
    try {
      const res = await fetch(`/api/cad/requests/${record.id}/request-mail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cc: ccList, subject, body }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "送信に失敗しました")
      onSent(data.record)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-base font-bold text-gray-900">依頼メール送信</h2>
            <p className="text-xs text-gray-400 mt-0.5">CAD作業依頼書 No.{record.uid}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        {loading ? (
          <div className="p-6 text-sm text-gray-400">読み込み中...</div>
        ) : (
          <>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                <div className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                  {toRecipients.length > 0 ? toRecipients.map(r => r.email).join(", ") : (
                    <span className="text-red-500">送信先が未登録です（CAD/台紙マスタ管理 &gt; メール設定 から登録してください）</span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">CC</label>
                {ccList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {ccList.map(email => (
                      <span key={email} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                        {email}
                        <button onClick={() => removeCc(email)} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mb-2">
                  <select value={ccUserSelect} onChange={e => setCcUserSelect(e.target.value)}
                    className="flex-1 h-9 border border-gray-200 rounded-lg px-2 text-sm bg-white">
                    <option value="">-- 社内ユーザーから追加 --</option>
                    {users.filter(u => u.email).map(u => (
                      <option key={u.id} value={u.id}>{u.name}（{u.email}）</option>
                    ))}
                  </select>
                  <button onClick={addCcFromUser} className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700">追加</button>
                </div>
                <div className="flex gap-2">
                  <input type="text" value={ccManualInput} onChange={e => setCcManualInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCcManual() } }}
                    placeholder="メールアドレスを直接入力してEnterまたは追加"
                    className="flex-1 h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={addCcManual} className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700">追加</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">件名</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">本文</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={12}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">キャンセル</button>
              <button onClick={handleSend} disabled={sending || toRecipients.length === 0}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors shadow-sm">
                <Send className="w-4 h-4" />
                {sending ? "送信中..." : "送信する"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
