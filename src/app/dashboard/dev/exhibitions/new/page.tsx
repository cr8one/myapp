"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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

export default function NewDevExhibitionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<DevCompany[]>([])
  const [allContacts, setAllContacts] = useState<DevCompanyContact[]>([])

  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [notes, setNotes] = useState("")
  const [summary, setSummary] = useState("")
  const [description, setDescription] = useState("")
  const [visitorUserIds, setVisitorUserIds] = useState<string[]>([])
  const [contacts, setContacts] = useState<ContactForm[]>([])

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then(setUsers)
    fetch("/api/dev/companies").then((r) => r.json()).then(setCompanies)
    fetch("/api/dev/company-contacts").then((r) => r.json()).then(setAllContacts)
  }, [])

  const toggleVisitor = (uid: string) => {
    setVisitorUserIds((prev) => prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid])
  }

  const addContact = () => setContacts((prev) => [...prev, { companyId: "", contactId: "", notes: "" }])
  const updateContact = (index: number, field: keyof ContactForm, value: string) => {
    setContacts((prev) => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }
  const removeContact = (index: number) => setContacts((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = async () => {
    if (!name) { setError("展示会名は必須です"); return }
    setLoading(true)
    setError("")
    const res = await fetch("/api/dev/exhibitions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, location, notes, summary, description,
        startDate: startDate || null,
        endDate: endDate || null,
        visitorUserIds,
        contacts: contacts.filter((c) => c.companyId),
      }),
    })
    if (!res.ok) { setError("登録に失敗しました"); setLoading(false); return }
    const data = await res.json()
    router.push(`/dashboard/dev/exhibitions/${data.id}`)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>← 戻る</Button>
        <h1 className="text-2xl font-bold">展示会登録</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>基本情報</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>展示会名 *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>開催場所</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} list="location-list" placeholder="会場を入力または選択" />
                <datalist id="location-list">
                  <option value="東京国際展示場（東京ビッグサイト）" />
                  <option value="幕張メッセ" />
                  <option value="サンシャインシティ 文化会館ビル" />
                  <option value="秋葉原UDX AKIBA_SQUARE" />
                </datalist>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>開始日</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>終了日</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>説明</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>サマリー</Label>
              <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>備考</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>来場者（社内）</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-2">
                  <Checkbox id={u.id} checked={visitorUserIds.includes(u.id)} onCheckedChange={() => toggleVisitor(u.id)} />
                  <Label htmlFor={u.id} className="cursor-pointer">{u.name ?? u.id}</Label>
                </div>
              ))}
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
                  <Button variant="ghost" size="sm" onClick={() => removeContact(index)} className="text-red-500 h-6 px-2">削除</Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">会社 *</Label>
                  <select
                    value={contact.companyId}
                    onChange={(e) => updateContact(index, "companyId", e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">選択してください</option>
                    {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">担当者（任意）</Label>
                  <select
                    value={contact.contactId}
                    onChange={(e) => updateContact(index, "contactId", e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">選択してください</option>
                    {allContacts
                      .filter((c) => !contact.companyId || c.companyId === contact.companyId)
                      .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">メモ</Label>
                  <Input value={contact.notes} onChange={(e) => updateContact(index, "notes", e.target.value)} />
                </div>
              </div>
            ))}
            {contacts.length === 0 && (
              <p className="text-sm text-gray-400">「+ 追加」から接触先を追加してください</p>
            )}
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? "登録中..." : "登録する"}
        </Button>
      </div>
    </div>
  )
}