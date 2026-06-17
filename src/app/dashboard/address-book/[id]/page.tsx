"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, ExternalLink, Map } from "lucide-react"
const HONORIFICS = ["様", "御中", "殿", "先生"]
type AddressBookRecord = {
  id: string; uid: string
  company_name: string | null; company_name_kana: string | null
  department: string | null; position: string | null
  name: string | null; honorific: string | null
  postal_code: string | null; address1: string | null
  address2: string | null; remarks: string | null
  created_at: string; updated_at: string
}
type Permission = {
  addressBookEdit: boolean
} | null
const FIELDS: { key: keyof AddressBookRecord; label: string; span?: number }[] = [
  { key: "company_name", label: "会社名" },
  { key: "company_name_kana", label: "会社名フリガナ" },
  { key: "department", label: "部門名" },
  { key: "position", label: "役職名" },
  { key: "name", label: "氏名" },
  { key: "honorific", label: "敬称" },
  { key: "postal_code", label: "郵便番号" },
  { key: "address1", label: "住所1", span: 2 },
  { key: "address2", label: "住所2", span: 2 },
]
export default function AddressBookDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [record, setRecord] = useState<AddressBookRecord | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [isAdmin, setIsAdmin] = useState(false)
  const [permission, setPermission] = useState<Permission>(null)
  const [permLoaded, setPermLoaded] = useState(false)
  const fetchRecord = async () => {
    const res = await fetch(`/api/address-book/${id}`)
    const data: AddressBookRecord = await res.json()
    setRecord(data)
    setForm({
      company_name: data.company_name ?? "",
      company_name_kana: data.company_name_kana ?? "",
      department: data.department ?? "",
      position: data.position ?? "",
      name: data.name ?? "",
      honorific: data.honorific ?? "",
      postal_code: data.postal_code ?? "",
      address1: data.address1 ?? "",
      address2: data.address2 ?? "",
      remarks: data.remarks ?? "",
    })
  }
  useEffect(() => {
    fetchRecord()
    fetch("/api/users/me").then(r => r.json()).then(data => {
      setIsAdmin(data.isAdmin)
      setPermission(data.permission)
      setPermLoaded(true)
    })
  }, [id])
  const canEdit = isAdmin || permission?.addressBookEdit === true
  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))
  const handleSave = async () => {
    setSaving(true)
    await fetch(`/api/address-book/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setEditing(false)
    setSaving(false)
    fetchRecord()
  }
  const handleDelete = async () => {
    if (!confirm("この住所録データを削除しますか？")) return
    await fetch(`/api/address-book/${id}`, { method: "DELETE" })
    router.push("/dashboard/address-book")
  }
  if (!record || !permLoaded) return <p className="p-8 text-gray-400 animate-pulse">読み込み中...</p>
  const fmtDate = (s: string) => new Date(s).toLocaleDateString("ja-JP")
  const fmtTime = (s: string) => new Date(s).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/address-book")}>← 一覧</Button>
          <h1 className="text-2xl font-bold">住所録 No.{record.uid}</h1>
        </div>
        <div className="flex gap-2">
          {canEdit ? (
            editing ? (
              <>
                <Button variant="outline" onClick={() => setEditing(false)}>キャンセル</Button>
                <Button onClick={handleSave} disabled={saving}>{saving ? "保存中..." : "保存する"}</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleDelete} className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                <Button onClick={() => setEditing(true)}>編集</Button>
              </>
            )
          ) : (
            <Button onClick={() => router.push(`/dashboard/address-book/${id}/change-request`)}
              className="bg-amber-600 hover:bg-amber-700 text-white">
              変更依頼
            </Button>
          )}
        </div>
      </div>
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-500">
            <div>作成日時：{fmtDate(record.created_at)} {fmtTime(record.created_at)}</div>
            <div>修正日時：{fmtDate(record.updated_at)} {fmtTime(record.updated_at)}</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {FIELDS.map(f => (
              <div key={f.key} className={f.span === 2 ? "col-span-2" : ""}>
                <label className="text-sm font-medium text-gray-700 mb-1 block">{f.label}</label>
                {editing ? (
                  f.key === "honorific" ? (
                    <>
                      <input value={form[f.key]} onChange={e => update(f.key, e.target.value)}
                        list="honorific-options" className="w-full border rounded px-3 py-2 text-sm" autoComplete="off" />
                      <datalist id="honorific-options">
                        {HONORIFICS.map(h => <option key={h} value={h} />)}
                      </datalist>
                    </>
                  ) : (
                    <input value={form[f.key]} onChange={e => update(f.key, e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm" autoComplete="off" />
                  )
                ) : (
                  <p className="text-sm text-gray-800 flex items-center gap-2">
                    <span>{record[f.key] || <span className="text-gray-300">—</span>}</span>
                    {f.key === "company_name" && record.company_name && (
                      <a href={`https://www.google.com/search?q=${encodeURIComponent(record.company_name)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-600">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">備考</label>
            {editing ? (
              <textarea value={form.remarks} onChange={e => update("remarks", e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm resize-none" rows={3} autoComplete="off" />
            ) : (
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{record.remarks || <span className="text-gray-300">—</span>}</p>
            )}
          </div>
          {(record.address1 || record.postal_code) && !editing && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">地図</span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([record.postal_code, record.address1, record.address2].filter(Boolean).join(" "))}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <Map className="w-3 h-3" /> 大きな地図で見る
                </a>
              </div>
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent([record.postal_code, record.address1, record.address2].filter(Boolean).join(" "))}&output=embed&hl=ja`}
                className="w-full h-64 rounded border border-gray-200"
                loading="lazy"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
