"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type DevCompany = {
  id: string
  name: string
  nameKana?: string
  industry?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  notes?: string
  createdAt: string
}

export default function DevCompaniesPage() {
  const [companies, setCompanies] = useState<DevCompany[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editCompany, setEditCompany] = useState<DevCompany | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const [name, setName] = useState("")
  const [nameKana, setNameKana] = useState("")
  const [industry, setIndustry] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [notes, setNotes] = useState("")

  const fetchCompanies = async () => {
    const res = await fetch("/api/dev/companies")
    const data = await res.json()
    setCompanies(data)
  }

  useEffect(() => { fetchCompanies() }, [])

  const resetForm = () => {
    setName(""); setNameKana(""); setIndustry("")
    setContactName(""); setContactEmail(""); setContactPhone(""); setNotes("")
    setError(""); setEditCompany(null); setShowForm(false)
  }

  const handleEdit = (company: DevCompany) => {
    setEditCompany(company)
    setName(company.name)
    setNameKana(company.nameKana ?? "")
    setIndustry(company.industry ?? "")
    setContactName(company.contactName ?? "")
    setContactEmail(company.contactEmail ?? "")
    setContactPhone(company.contactPhone ?? "")
    setNotes(company.notes ?? "")
    setShowForm(true)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError("")
    const body = { name, nameKana, industry, contactName, contactEmail, contactPhone, notes }
    const res = editCompany
      ? await fetch(`/api/dev/companies/${editCompany.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      : await fetch("/api/dev/companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
    if (!res.ok) {
      setError("保存に失敗しました")
      setLoading(false)
      return
    }
    resetForm()
    setLoading(false)
    fetchCompanies()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("この会社を削除しますか？")) return
    await fetch(`/api/dev/companies/${id}`, { method: "DELETE" })
    fetchCompanies()
  }

  const filtered = companies.filter((c) => {
    const q = searchQuery.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      (c.nameKana ?? "").toLowerCase().includes(q) ||
      (c.industry ?? "").toLowerCase().includes(q) ||
      (c.contactName ?? "").toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">会社管理</h1>
        <Button onClick={() => { resetForm(); setShowForm(!showForm) }}>
          {showForm ? "キャンセル" : "新規登録"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editCompany ? "会社編集" : "会社登録"}</CardTitle>
          </CardHeader>
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
            <div className="space-y-2">
              <Label>業種</Label>
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>担当者名</Label>
                <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>メール</Label>
                <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>電話番号</Label>
                <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>備考</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? "処理中..." : editCompany ? "更新する" : "登録する"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mb-4">
        <Input
          placeholder="会社名・カナ・業種・担当者で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filtered.map((company) => (
          <Card key={company.id}>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-bold">{company.name}</p>
                  {company.nameKana && <p className="text-sm text-gray-500">{company.nameKana}</p>}
                  {company.industry && <p className="text-sm text-gray-500">業種: {company.industry}</p>}
                  {company.contactName && <p className="text-sm text-gray-500">担当: {company.contactName}</p>}
                  {company.contactEmail && <p className="text-sm text-gray-500">メール: {company.contactEmail}</p>}
                  {company.contactPhone && <p className="text-sm text-gray-500">電話: {company.contactPhone}</p>}
                  {company.notes && <p className="text-sm text-gray-500">備考: {company.notes}</p>}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(company)}>編集</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(company.id)}>削除</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-500">
            {searchQuery ? "検索結果がありません" : "会社が登録されていません"}
          </p>
        )}
      </div>
    </div>
  )
}
