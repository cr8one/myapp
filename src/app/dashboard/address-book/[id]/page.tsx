"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, ExternalLink, Map, Plus } from "lucide-react"
const HONORIFICS = ["様", "御中", "殿", "先生"]
const DEPT_IN_CHARGE = ["社長", "相談役", "総務", "SP", "MP1", "MP2", "開発G", "PP", "DPP", "静岡"]
type Contact = { id?: string; department: string; position: string; name: string; honorific: string; sort_order?: number }
type AddressBookRecord = {
  id: string; uid: string
  company_name: string | null; company_name_kana: string | null
  postal_code: string | null; address1: string | null; address2: string | null
  department_in_charge: string | null; remarks: string | null
  created_at: string; updated_at: string
  contacts: Contact[]
}
type Permission = { addressBookEdit: boolean } | null
export default function AddressBookDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [record, setRecord] = useState<AddressBookRecord | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [contacts, setContacts] = useState<Contact[]>([])
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
      postal_code: data.postal_code ?? "",
      address1: data.address1 ?? "",
      address2: data.address2 ?? "",
      department_in_charge: data.department_in_charge ?? "",
      remarks: data.remarks ?? "",
    })
    setContacts(data.contacts.map(c => ({
      id: c.id, department: c.department ?? "", position: c.position ?? "",
      name: c.name ?? "", honorific: c.honorific ?? "",
    })))
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
  const updateContact = (i: number, key: keyof Contact, value: string) =>
    setContacts(prev => prev.map((c, idx) => idx === i ? { ...c, [key]: value } : c))
  const addContact = () => setContacts(prev => [...prev, { department: "", position: "", name: "", honorific: "" }])
  const removeContact = (i: number) => setContacts(prev => prev.filter((_, idx) => idx !== i))
  const handleSave = async () => {
    setSaving(true)
    await fetch(`/api/address-book/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, contacts }),
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
                <Button variant="outline" onClick={() => { setEditing(false); fetchRecord() }}>キャンセル</Button>
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
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-700">会社・住所情報</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "company_name", label: "会社名", withLink: true },
                { key: "company_name_kana", label: "会社名フリガナ" },
                { key: "postal_code", label: "郵便番号" },
                { key: "department_in_charge", label: "担当部署", datalist: "dept-in-charge" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">{f.label}</label>
                  {editing ? (
                    f.datalist ? (
                      <>
                        <input value={form[f.key]} onChange={e => update(f.key, e.target.value)}
                          list={`${f.datalist}-options`} className="w-full border rounded px-3 py-2 text-sm" autoComplete="off" />
                        <datalist id={`${f.datalist}-options`}>
                          {DEPT_IN_CHARGE.map(d => <option key={d} value={d} />)}
                        </datalist>
                      </>
                    ) : (
                      <input value={form[f.key]} onChange={e => update(f.key, e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm" autoComplete="off" />
                    )
                  ) : (
                    <p className="text-sm text-gray-800 flex items-center gap-2">
                      <span>{record[f.key as keyof AddressBookRecord] as string || <span className="text-gray-300">—</span>}</span>
                      {f.withLink && record.company_name && (
                        <a href={`https://www.google.com/search?q=${encodeURIComponent(record.company_name)}`}
                          target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </p>
                  )}
                </div>
              ))}
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1 block">住所1</label>
                {editing ? (
                  <input value={form.address1} onChange={e => update("address1", e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm" autoComplete="off" />
                ) : (
                  <p className="text-sm text-gray-800">{record.address1 || <span className="text-gray-300">—</span>}</p>
                )}
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1 block">住所2</label>
                {editing ? (
                  <input value={form.address2} onChange={e => update("address2", e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm" autoComplete="off" />
                ) : (
                  <p className="text-sm text-gray-800">{record.address2 || <span className="text-gray-300">—</span>}</p>
                )}
              </div>
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
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-700">担当者</h2>
              {editing && (
                <Button variant="outline" size="sm" onClick={addContact}>
                  <Plus className="w-4 h-4 mr-1" /> 追加
                </Button>
              )}
            </div>
            {editing ? (
              <div className="space-y-4">
                {contacts.map((c, i) => (
                  <div key={i} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">担当者 {i + 1}</span>
                      <button onClick={() => removeContact(i)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">部門名</label>
                        <input value={c.department} onChange={e => updateContact(i, "department", e.target.value)}
                          className="w-full border rounded px-3 py-1.5 text-sm" autoComplete="off" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">役職名</label>
                        <input value={c.position} onChange={e => updateContact(i, "position", e.target.value)}
                          className="w-full border rounded px-3 py-1.5 text-sm" autoComplete="off" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">氏名</label>
                        <input value={c.name} onChange={e => updateContact(i, "name", e.target.value)}
                          className="w-full border rounded px-3 py-1.5 text-sm" autoComplete="off" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">敬称</label>
                        <input value={c.honorific} onChange={e => updateContact(i, "honorific", e.target.value)}
                          list="honorific-options" className="w-full border rounded px-3 py-1.5 text-sm" autoComplete="off" />
                        <datalist id="honorific-options">
                          {HONORIFICS.map(h => <option key={h} value={h} />)}
                        </datalist>
                      </div>
                    </div>
                  </div>
                ))}
                {contacts.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">担当者がいません。追加ボタンから追加してください。</p>
                )}
              </div>
            ) : (
              record.contacts.length === 0 ? (
                <p className="text-sm text-gray-300">—</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {record.contacts.map((c, i) => (
                    <div key={i} className="py-3 grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-500 text-xs">部門</span><p className="text-gray-800">{c.department || "—"}</p></div>
                      <div><span className="text-gray-500 text-xs">役職</span><p className="text-gray-800">{c.position || "—"}</p></div>
                      <div><span className="text-gray-500 text-xs">氏名</span><p className="text-gray-800">{c.name ? `${c.name}${c.honorific ? ` ${c.honorific}` : ""}` : "—"}</p></div>
                    </div>
                  ))}
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
