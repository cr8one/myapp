"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

type User = { id: string; name?: string }
type DevCompany = { id: string; name: string }
type DevCompanyContact = { id: string; name: string; companyId: string }
type ContactForm = { companyId: string; contactId: string; notes: string }
type VisitorForm = { userId: string; impression: string }
type DevExhibition = {
  id: string; name: string; location?: string
  startDate?: string; endDate?: string
  notes?: string; summary?: string; description?: string
  visitors: { user: { id: string; name?: string }; impression?: string }[]
  contacts: { company: { id: string; name: string }; contact?: { id: string; name: string } | null; notes?: string }[]
}

export default function DevExhibitionDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [exhibition, setExhibition] = useState<DevExhibition | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<DevCompany[]>([])
  const [allContacts, setAllContacts] = useState<DevCompanyContact[]>([])
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [notes, setNotes] = useState("")
  const [summary, setSummary] = useState("")
  const [description, setDescription] = useState("")
  const [visitors, setVisitors] = useState<VisitorForm[]>([])
  const [contacts, setContacts] = useState<ContactForm[]>([])

  const fetchExhibition = async () => {
    const res = await fetch(`/api/dev/exhibitions/${id}`)
    const data = await res.json()
    setExhibition(data)
  }

  useEffect(() => {
    fetchExhibition()
    fetch("/api/users").then((r) => r.json()).then(setUsers)
    fetch("/api/dev/companies").then((r) => r.json()).then(setCompanies)
    fetch("/api/dev/company-contacts").then((r) => r.json()).then(setAllContacts)
  }, [id])

  const startEdit = () => {
    if (!exhibition) return
    setName(exhibition.name)
    setLocation(exhibition.location ?? "")
    setStartDate(exhibition.startDate ? exhibition.startDate.slice(0, 10) : "")
    setEndDate(exhibition.endDate ? exhibition.endDate.slice(0, 10) : "")
    setNotes(exhibition.notes ?? "")
    setSummary(exhibition.summary ?? "")
    setDescription(exhibition.description ?? "")
    setVisitors(exhibition.visitors.map((v) => ({
      userId: v.user.id,
      impression: v.impression ?? "",
    })))
    setContacts(exhibition.contacts.map((c) => ({
      companyId: c.company.id,
      contactId: c.contact?.id ?? "",
      notes: c.notes ?? "",
    })))
    setEditing(true)
  }

  const toggleVisitor = (uid: string) => {
    setVisitors((prev) =>
      prev.some((v) => v.userId === uid)
        ? prev.filter((v) => v.userId !== uid)
        : [...prev, { userId: uid, impression: "" }]
    )
  }

  const updateImpression = (uid: string, impression: string) => {
    setVisitors((prev) => prev.map((v) => v.userId === uid ? { ...v, impression } : v))
  }

  const addContact = () => setContacts((prev) => [...prev, { companyId: "", contactId: "", notes: "" }])
  const updateContact = (index: number, field: keyof ContactForm, value: string) => {
    setContacts((prev) => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }

  const handleSave = async () => {
    if (!name) { setError("展示会名は必須です"); return }
    setLoading(true)
    setError("")
    const res = await fetch(`/api/dev/exhibitions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, location, notes, summary, description,
        startDate: startDate || null,
        endDate: endDate || null,
        visitors,
        contacts: contacts.filter((c) => c.companyId),
      }),
    })
    if (!res.ok) { setError("保存に失敗しました"); setLoading(false); return }
    await fetchExhibition()
    setEditing(false)
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm("この展示会を削除しますか？")) return
    await fetch(`/api/dev/exhibitions/${id}`, { method: "DELETE" })
    router.push("/dashboard/dev/exhibitions")
  }

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString("ja-JP") : "—"

  if (!exhibition) return <div className="p-8">読み込み中...</div>

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/dashboard/dev/exhibitions")}>← 戻る</Button>
          <h1 className="text-2xl font-bold">{exhibition.name}</h1>
        </div>
        <div className="flex gap-2">
          {!editing && <Button onClick={startEdit}>編集</Button>}
          {!editing && <Button variant="destructive" onClick={handleDelete}>削除</Button>}
        </div>
      </div>

      {editing ? (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>基本情報</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>展示会名 *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="space-y-2"><Label>開催場所</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>開始日</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
                <div className="space-y-2"><Label>終了日</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>説明</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
              <div className="space-y-2"><Label>サマリー</Label><Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} /></div>
              <div className="space-y-2"><Label>備考</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>来場者（社内）</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((u) => {
                  const visitor = visitors.find((v) => v.userId === u.id)
                  const checked = !!visitor
                  return (
                    <div key={u.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`ev-${u.id}`}
                          checked={checked}
                          onCheckedChange={() => toggleVisitor(u.id)}
                        />
                        <Label htmlFor={`ev-${u.id}`} className="cursor-pointer font-medium">{u.name ?? u.id}</Label>
                      </div>
                      {checked && (
                        <div className="pl-6 space-y-1">
                          <Label className="text-xs text-gray-500">所感</Label>
                          <Textarea
                            value={visitor?.impression ?? ""}
                            onChange={(e) => updateImpression(u.id, e.target.value)}
                            rows={2}
                            placeholder="展示会での所感を入力..."
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>接触会社・担当者</CardTitle>
                <Button variant="outline" size="sm" onClick={addContact}>+ 追加</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {contacts.map((contact, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-sm">接触先 {index + 1}</p>
                    <Button variant="ghost" size="sm" onClick={() => setContacts((p) => p.filter((_, i) => i !== index))} className="text-red-500 h-6 px-2">削除</Button>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">会社 *</Label>
                    <select value={contact.companyId} onChange={(e) => updateContact(index, "companyId", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                      <option value="">選択してください</option>
                      {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">担当者（任意）</Label>
                    <select value={contact.contactId} onChange={(e) => updateContact(index, "contactId", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                      <option value="">選択してください</option>
                      {allContacts.filter((c) => !contact.companyId || c.companyId === contact.companyId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">メモ</Label>
                    <Input value={contact.notes} onChange={(e) => updateContact(index, "notes", e.target.value)} />
                  </div>
                </div>
              ))}
              {contacts.length === 0 && <p className="text-sm text-gray-400">「+ 追加」から接触先を追加してください</p>}
            </CardContent>
          </Card>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={loading} className="flex-1">{loading ? "保存中..." : "保存する"}</Button>
            <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">キャンセル</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>基本情報</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div><dt className="text-gray-500">展示会名</dt><dd className="font-medium">{exhibition.name}</dd></div>
                <div><dt className="text-gray-500">開催場所</dt><dd>{exhibition.location || "—"}</dd></div>
                <div><dt className="text-gray-500">開始日</dt><dd>{formatDate(exhibition.startDate)}</dd></div>
                <div><dt className="text-gray-500">終了日</dt><dd>{formatDate(exhibition.endDate)}</dd></div>
                {exhibition.description && <div className="col-span-2"><dt className="text-gray-500">説明</dt><dd className="whitespace-pre-wrap">{exhibition.description}</dd></div>}
                {exhibition.summary && <div className="col-span-2"><dt className="text-gray-500">サマリー</dt><dd className="whitespace-pre-wrap">{exhibition.summary}</dd></div>}
                {exhibition.notes && <div className="col-span-2"><dt className="text-gray-500">備考</dt><dd>{exhibition.notes}</dd></div>}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>来場者（社内）</CardTitle></CardHeader>
            <CardContent>
              {exhibition.visitors.length > 0 ? (
                <div className="space-y-3">
                  {exhibition.visitors.map((v) => (
                    <div key={v.user.id} className="border rounded-lg p-3">
                      <p className="font-medium text-sm">{v.user.name}</p>
                      {v.impression && (
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{v.impression}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">来場者が登録されていません</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>接触会社・担当者</CardTitle></CardHeader>
            <CardContent>
              {exhibition.contacts.length > 0 ? (
                <div className="space-y-3">
                  {exhibition.contacts.map((c, i) => (
                    <div key={i} className="border rounded-lg p-3 text-sm">
                      <p className="font-medium">{c.company.name}</p>
                      {c.contact && <p className="text-gray-500">担当: {c.contact.name}</p>}
                      {c.notes && <p className="text-gray-500">メモ: {c.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">接触先が登録されていません</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
