"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

type UserOption = { id: string; name: string | null }
type UploadedFile = { fileKey: string; fileName: string }

export default function RingiNewPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [users, setUsers] = useState<UserOption[]>([])
  const [requesterUserId, setRequesterUserId] = useState("")
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [recordId, setRecordId] = useState("")

  useEffect(() => {
    fetch("/api/users/list").then(r => r.json()).then(setUsers)
    fetch("/api/auth/session").then(r => r.json()).then(s => {
      if (s?.user?.id) setRequesterUserId(s.user.id)
      if (s?.user?.name) setForm(f => ({ ...f, requester_names: s.user.name }))
    })
  }, [])

  const [form, setForm] = useState({
    title: "",
    content: "",
    destination: "",
    cost: "",
    requester_names: "",
    requester_department: "",
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  // 添付ファイルは、レコード未作成の状態でも選択できるよう、先に下書きレコードを作成してIDを確保する
  const ensureRecordId = async () => {
    if (recordId) return recordId
    const res = await fetch("/api/eapp/ringi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, requester_user_id: requesterUserId, status: "下書き", send_mail: false }),
    })
    const data = await res.json()
    setRecordId(data.id)
    return data.id
  }

  const handleFileChange = async (fileList: FileList) => {
    setUploading(true)
    try {
      const id = await ensureRecordId()
      for (const file of Array.from(fileList)) {
        const presignRes = await fetch(`/api/eapp/ringi/${id}/presign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name }),
        })
        const { url, key } = await presignRes.json()
        await fetch(url, { method: "PUT", body: file })
        await fetch(`/api/eapp/ringi/${id}/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileKey: key, fileName: file.name, fileType: file.type || "file" }),
        })
        setFiles(prev => [...prev, { fileKey: key, fileName: file.name }])
      }
    } catch (e) {
      console.error(e)
      alert("ファイルのアップロードに失敗しました")
    } finally {
      setUploading(false)
    }
  }

  const [confirmDialog, setConfirmDialog] = useState(false)
  const submit = async (asDraft: boolean, sendMail: boolean) => {
    setConfirmDialog(false)
    setSaving(true)
    const id = recordId || await ensureRecordId()
    const res = await fetch(`/api/eapp/ringi/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        requester_user_id: requesterUserId,
        status: asDraft ? "下書き" : "起案部承認中",
        send_mail: sendMail,
      }),
    })
    if (res.ok) {
      router.push(`/dashboard/eapp/ringi/${id}`)
    } else {
      alert("登録に失敗しました")
      setSaving(false)
    }
  }

  const labelCls = "text-xs font-medium text-gray-500 w-28 shrink-0 pt-2"
  const inputCls = "h-8 text-sm flex-1"
  const rowCls = "flex items-center gap-3"

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>← 戻る</Button>
          <h1 className="text-2xl font-bold">稟議書 新規作成</h1>
        </div>
      </div>
      <div className="bg-white border rounded-lg shadow-sm p-6 space-y-4">
        <div className={rowCls}>
          <label className={labelCls}>件名 <span className="text-red-500">*</span></label>
          <Input value={form.title} onChange={e => set("title", e.target.value)} className={inputCls} autoComplete="off" placeholder="〇〇のご提案の件" />
        </div>
        <div className={rowCls}>
          <label className={labelCls}>起案者</label>
          <Input value={form.requester_names} onChange={e => set("requester_names", e.target.value)} className={inputCls} autoComplete="off" placeholder="連名の場合はカンマ区切り" />
        </div>
        <div className={rowCls}>
          <label className={labelCls}>起案部</label>
          <Input value={form.requester_department} onChange={e => set("requester_department", e.target.value)} className={inputCls} autoComplete="off" />
        </div>
        <div className={rowCls}>
          <label className={labelCls}>承認ルート設定</label>
          <select value={requesterUserId} onChange={e => setRequesterUserId(e.target.value)}
            className="flex-1 h-8 border rounded px-2 text-sm bg-white">
            <option value="">-- 選択してください --</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className={rowCls}>
          <label className={labelCls}>依頼先</label>
          <Input value={form.destination} onChange={e => set("destination", e.target.value)} className={inputCls} autoComplete="off" />
        </div>
        <div className={rowCls}>
          <label className={labelCls}>費用</label>
          <Input value={form.cost} onChange={e => set("cost", e.target.value)} className={inputCls} autoComplete="off" placeholder="初期費用〇〇円＋月額〇〇円" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">目的・内容</label>
          <textarea
            value={form.content}
            onChange={e => set("content", e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm resize-none"
            rows={12}
            autoComplete="off"
            placeholder="目的・内容を自由に記入してください"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">添付ファイル（見積書・カタログ等）</label>
          <input
            type="file"
            multiple
            disabled={uploading}
            onChange={e => e.target.files && e.target.files.length > 0 && handleFileChange(e.target.files)}
            className="text-sm"
          />
          {uploading && <p className="text-xs text-amber-700 mt-1">アップロード中...</p>}
          {files.length > 0 && (
            <ul className="mt-2 space-y-1">
              {files.map(f => (
                <li key={f.fileKey} className="text-xs text-gray-600 flex items-center gap-1">
                  <span>{f.fileName}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={() => router.back()}>キャンセル</Button>
        <Button variant="outline" onClick={() => submit(true, false)} disabled={saving}>
          {saving ? "保存中..." : "下書き保存"}
        </Button>
        <Button onClick={() => setConfirmDialog(true)} disabled={saving}>
          {saving ? "登録中..." : "申請する"}
        </Button>
      </div>
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">申請の確認</h3>
            <p className="text-sm text-gray-600 mb-4">最初の承認者にメールで通知しますか？</p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => submit(false, true)}>送信して申請する</Button>
              <Button variant="outline" onClick={() => submit(false, false)}>送信せず申請する</Button>
              <button onClick={() => setConfirmDialog(false)} className="text-xs text-gray-400 hover:text-gray-600 mt-1">キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
