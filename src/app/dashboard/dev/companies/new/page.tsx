"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

type TypeMaster = { id: string; name: string }
type ContactForm = { name: string; nameKana: string; email: string; phone: string; department: string; position: string; isPrimary: boolean; notes: string }

const STATUSES = ["登録のみ", "面識あり", "相談済", "見積り済", "受注済"]

const emptyContact = (): ContactForm => ({
  name: "", nameKana: "", email: "", phone: "", department: "", position: "", isPrimary: false, notes: ""
})

export default function NewDevCompanyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [typeMasters, setTypeMasters] = useState<TypeMaster[]>([])

  const [name, setName] = useState("")
  const [nameKana, setNameKana] = useState("")
  const [industry, setIndustry] = useState("")
  const [status, setStatus] = useState("登録のみ")
  const [postalCode, setPostalCode] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [url, setUrl] = useState("")
  const [notes, setNotes] = useState("")
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([])
  const [contacts, setContacts] = useState<ContactForm[]>([emptyContact()])

  useEffect(() => {
    fetch("/api/dev/company-type-masters").then((r) => r.json()).then(setTypeMasters)
  }, [])

  const toggleType = (id: string) => {
    setSelectedTypeIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  const updateContact = (index: number, field: keyof ContactForm, value: string | boolean) => {
    setContacts((prev) => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }

  const addContact = () => setContacts((prev) => [...prev, emptyContact()])
  const removeContact = (index: number) => setContacts((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = async () => {
    if (!name) { setError("会社名は必須です"); return }
    setLoading(true)
    setError("")
    const res = await fetch("/api/dev/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, nameKana, industry, status, postalCode, address, phone, url, notes,
        typeIds: selectedTypeIds,
        contacts: contacts.filter((c) => c.name),
      }),
    })
    if (!res.ok) { setError("登録に失敗しました"); setLoading(false); return }
    const data = await res.json()
    router.push(`/dashboard/dev/companies/${data.id}`)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>← 戻る</Button>
        <h1 className="text-2xl font-bold">会社登録</h1>
      </div>

      <div className="space-y-6">
        {/* 基本情報 */}
        <Card>
          <CardHeader><CardTitle>基本情報</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>会社名 *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>会社名（カナ）</Label>
                <Input value={nameKana} onChange={(e) => setNameKana(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>業種</Label>
                <Input value={industry} onChange={(e) => setIndustry(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>ステータス</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>郵便番号</Label>
                <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="000-0000" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>住所</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>電話番号</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>WebサイトURL</Label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>備考</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* 取扱種別 */}
        <Card>
          <CardHeader><CardTitle>取扱種別</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {typeMasters.map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  <Checkbox
                    id={t.id}
                    checked={selectedTypeIds.includes(t.id)}
                    onCheckedChange={() => toggleType(t.id)}
                  />
                  <Label htmlFor={t.id} className="cursor-pointer">{t.name}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 担当者 */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>担当者</CardTitle>
              <Button variant="outline" size="sm" onClick={addContact}>+ 追加</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {contacts.map((contact, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="font-medium text-sm">担当者 {index + 1}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Checkbox
                        id={`primary-${index}`}
                        checked={contact.isPrimary}
                        onCheckedChange={(v) => updateContact(index, "isPrimary", !!v)}
                      />
                      <Label htmlFor={`primary-${index}`} className="text-sm cursor-pointer">主担当</Label>
                    </div>
                    {contacts.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeContact(index)} className="text-red-500 h-6 px-2">削除</Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">氏名 *</Label>
                    <Input value={contact.name} onChange={(e) => updateContact(index, "name", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">氏名（カナ）</Label>
                    <Input value={contact.nameKana} onChange={(e) => updateContact(index, "nameKana", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">部署</Label>
                    <Input value={contact.department} onChange={(e) => updateContact(index, "department", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">役職</Label>
                    <Input value={contact.position} onChange={(e) => updateContact(index, "position", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">メール</Label>
                    <Input value={contact.email} onChange={(e) => updateContact(index, "email", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">電話番号</Label>
                    <Input value={contact.phone} onChange={(e) => updateContact(index, "phone", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">備考</Label>
                  <Input value={contact.notes} onChange={(e) => updateContact(index, "notes", e.target.value)} />
                </div>
              </div>
            ))}
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