"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

type TypeMaster = { id: string; name: string }
type Contact = { id?: string; name: string; nameKana: string; email: string; phone: string; department: string; position: string; isPrimary: boolean; notes: string }
type DevCompany = {
  id: string; name: string; nameKana?: string; industry?: string; status: string
  postalCode?: string; address?: string; phone?: string; url?: string; notes?: string
  contacts: Contact[]
  types: { typeMaster: TypeMaster }[]
  primaryProjects: { id: string; title: string; status: string }[]
}

const STATUSES = ["登録のみ", "面識あり", "相談済", "見積り済", "受注済"]
const STATUS_COLORS: Record<string, string> = {
  "登録のみ": "bg-gray-100 text-gray-600",
  "面識あり": "bg-blue-100 text-blue-600",
  "相談済":   "bg-yellow-100 text-yellow-700",
  "見積り済": "bg-orange-100 text-orange-700",
  "受注済":   "bg-green-100 text-green-700",
}

const emptyContact = (): Contact => ({
  name: "", nameKana: "", email: "", phone: "", department: "", position: "", isPrimary: false, notes: ""
})

export default function DevCompanyDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [company, setCompany] = useState<DevCompany | null>(null)
  const [typeMasters, setTypeMasters] = useState<TypeMaster[]>([])
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // 編集用フォーム状態
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
  const [contacts, setContacts] = useState<Contact[]>([emptyContact()])

  const fetchCompany = async () => {
    const res = await fetch(`/api/dev/companies/${id}`)
    const data = await res.json()
    setCompany(data)
  }

  useEffect(() => {
    fetchCompany()
    fetch("/api/dev/company-type-masters").then((r) => r.json()).then(setTypeMasters)
  }, [id])

  const startEdit = () => {
    if (!company) return
    setName(company.name)
    setNameKana(company.nameKana ?? "")
    setIndustry(company.industry ?? "")
    setStatus(company.status)
    setPostalCode(company.postalCode ?? "")
    setAddress(company.address ?? "")
    setPhone(company.phone ?? "")
    setUrl(company.url ?? "")
    setNotes(company.notes ?? "")
    setSelectedTypeIds(company.types.map((t) => t.typeMaster.id))
    setContacts(company.contacts.length > 0 ? company.contacts : [emptyContact()])
    setEditing(true)
  }

  const toggleType = (tid: string) => {
    setSelectedTypeIds((prev) =>
      prev.includes(tid) ? prev.filter((t) => t !== tid) : [...prev, tid]
    )
  }

  const updateContact = (index: number, field: keyof Contact, value: string | boolean) => {
    setContacts((prev) => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }

  const handleSave = async () => {
    if (!name) { setError("会社名は必須です"); return }
    setLoading(true)
    setError("")
    const res = await fetch(`/api/dev/companies/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, nameKana, industry, status, postalCode, address, phone, url, notes,
        typeIds: selectedTypeIds,
        contacts: contacts.filter((c) => c.name),
      }),
    })
    if (!res.ok) { setError("保存に失敗しました"); setLoading(false); return }
    await fetchCompany()
    setEditing(false)
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm("この会社を削除しますか？")) return
    await fetch(`/api/dev/companies/${id}`, { method: "DELETE" })
    router.push("/dashboard/dev/companies")
  }

  if (!company) return <div className="p-8">読み込み中...</div>

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/dashboard/dev/companies")}>← 戻る</Button>
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[company.status] ?? "bg-gray-100 text-gray-600"}`}>
            {company.status}
          </span>
        </div>
        <div className="flex gap-2">
          {!editing && <Button onClick={startEdit}>編集</Button>}
          {!editing && <Button variant="destructive" onClick={handleDelete}>削除</Button>}
        </div>
      </div>

      {editing ? (
        <div className="space-y-6">
          {/* 基本情報 編集 */}
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
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
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

          {/* 取扱種別 編集 */}
          <Card>
            <CardHeader><CardTitle>取扱種別</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {typeMasters.map((t) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <Checkbox id={`edit-${t.id}`} checked={selectedTypeIds.includes(t.id)} onCheckedChange={() => toggleType(t.id)} />
                    <Label htmlFor={`edit-${t.id}`} className="cursor-pointer">{t.name}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 担当者 編集 */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>担当者</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setContacts((p) => [...p, emptyContact()])}>+ 追加</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {contacts.map((contact, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-sm">担当者 {index + 1}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Checkbox id={`ep-${index}`} checked={contact.isPrimary} onCheckedChange={(v) => updateContact(index, "isPrimary", !!v)} />
                        <Label htmlFor={`ep-${index}`} className="text-sm cursor-pointer">主担当</Label>
                      </div>
                      {contacts.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => setContacts((p) => p.filter((_, i) => i !== index))} className="text-red-500 h-6 px-2">削除</Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs">氏名 *</Label><Input value={contact.name} onChange={(e) => updateContact(index, "name", e.target.value)} /></div>
                    <div className="space-y-1"><Label className="text-xs">氏名（カナ）</Label><Input value={contact.nameKana} onChange={(e) => updateContact(index, "nameKana", e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs">部署</Label><Input value={contact.department} onChange={(e) => updateContact(index, "department", e.target.value)} /></div>
                    <div className="space-y-1"><Label className="text-xs">役職</Label><Input value={contact.position} onChange={(e) => updateContact(index, "position", e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs">メール</Label><Input value={contact.email} onChange={(e) => updateContact(index, "email", e.target.value)} /></div>
                    <div className="space-y-1"><Label className="text-xs">電話番号</Label><Input value={contact.phone} onChange={(e) => updateContact(index, "phone", e.target.value)} /></div>
                  </div>
                  <div className="space-y-1"><Label className="text-xs">備考</Label><Input value={contact.notes} onChange={(e) => updateContact(index, "notes", e.target.value)} /></div>
                </div>
              ))}
            </CardContent>
          </Card>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              {loading ? "保存中..." : "保存する"}
            </Button>
            <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">キャンセル</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 基本情報 表示 */}
          <Card>
            <CardHeader><CardTitle>基本情報</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div><dt className="text-gray-500">会社名</dt><dd className="font-medium">{company.name}</dd></div>
                <div><dt className="text-gray-500">カナ</dt><dd>{company.nameKana || "—"}</dd></div>
                <div><dt className="text-gray-500">業種</dt><dd>{company.industry || "—"}</dd></div>
                <div><dt className="text-gray-500">ステータス</dt>
                  <dd><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[company.status] ?? ""}`}>{company.status}</span></dd>
                </div>
                <div><dt className="text-gray-500">郵便番号</dt><dd>{company.postalCode || "—"}</dd></div>
                <div><dt className="text-gray-500">電話番号</dt><dd>{company.phone || "—"}</dd></div>
                <div className="col-span-2"><dt className="text-gray-500">住所</dt><dd>{company.address || "—"}</dd></div>
                <div className="col-span-2">
                  <dt className="text-gray-500">WebサイトURL</dt>
                  <dd>{company.url ? <a href={company.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{company.url}</a> : "—"}</dd>
                </div>
                <div className="col-span-2"><dt className="text-gray-500">備考</dt><dd>{company.notes || "—"}</dd></div>
              </dl>
            </CardContent>
          </Card>

          {/* 取扱種別 表示 */}
          <Card>
            <CardHeader><CardTitle>取扱種別</CardTitle></CardHeader>
            <CardContent>
              {company.types.length > 0
                ? <div className="flex gap-2 flex-wrap">{company.types.map((t) => <Badge key={t.typeMaster.id} variant="secondary">{t.typeMaster.name}</Badge>)}</div>
                : <p className="text-sm text-gray-500">設定なし</p>
              }
            </CardContent>
          </Card>

          {/* 担当者 表示 */}
          <Card>
            <CardHeader><CardTitle>担当者</CardTitle></CardHeader>
            <CardContent>
              {company.contacts.length > 0 ? (
                <div className="space-y-4">
                  {company.contacts.map((c) => (
                    <div key={c.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium">{c.name}</p>
                        {c.isPrimary && <Badge className="text-xs">主担当</Badge>}
                      </div>
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                        {c.nameKana && <div><dt className="text-gray-500">カナ</dt><dd>{c.nameKana}</dd></div>}
                        {c.department && <div><dt className="text-gray-500">部署</dt><dd>{c.department}</dd></div>}
                        {c.position && <div><dt className="text-gray-500">役職</dt><dd>{c.position}</dd></div>}
                        {c.email && <div><dt className="text-gray-500">メール</dt><dd>{c.email}</dd></div>}
                        {c.phone && <div><dt className="text-gray-500">電話</dt><dd>{c.phone}</dd></div>}
                        {c.notes && <div className="col-span-2"><dt className="text-gray-500">備考</dt><dd>{c.notes}</dd></div>}
                      </dl>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">担当者が登録されていません</p>
              )}
            </CardContent>
          </Card>

          {/* 関連案件 表示 */}
          {company.primaryProjects.length > 0 && (
            <Card>
              <CardHeader><CardTitle>関連案件</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {company.primaryProjects.map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-sm border rounded px-3 py-2">
                      <span>{p.title}</span>
                      <Badge variant="outline">{p.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}