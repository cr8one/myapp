"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type DevCompany = {
  id: string
  name: string
}

type DevExhibition = {
  id: string
  name: string
  location?: string
  startDate?: string
  endDate?: string
  notes?: string
  companies: { company: DevCompany }[]
  createdAt: string
}

export default function DevExhibitionsPage() {
  const [exhibitions, setExhibitions] = useState<DevExhibition[]>([])
  const [allCompanies, setAllCompanies] = useState<DevCompany[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editExhibition, setEditExhibition] = useState<DevExhibition | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [notes, setNotes] = useState("")
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([])

  const fetchExhibitions = async () => {
    const res = await fetch("/api/dev/exhibitions")
    const data = await res.json()
    setExhibitions(data)
  }

  const fetchCompanies = async () => {
    const res = await fetch("/api/dev/companies")
    const data = await res.json()
    setAllCompanies(data)
  }

  useEffect(() => {
    fetchExhibitions()
    fetchCompanies()
  }, [])

  const resetForm = () => {
    setName(""); setLocation(""); setStartDate(""); setEndDate(""); setNotes("")
    setSelectedCompanyIds([]); setError(""); setEditExhibition(null); setShowForm(false)
  }

  const handleEdit = (exhibition: DevExhibition) => {
    setEditExhibition(exhibition)
    setName(exhibition.name)
    setLocation(exhibition.location ?? "")
    setStartDate(exhibition.startDate ? exhibition.startDate.slice(0, 10) : "")
    setEndDate(exhibition.endDate ? exhibition.endDate.slice(0, 10) : "")
    setNotes(exhibition.notes ?? "")
    setSelectedCompanyIds(exhibition.companies.map((c) => c.company.id))
    setShowForm(true)
  }

  const toggleCompany = (id: string) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError("")
    const body = {
      name, location,
      startDate: startDate || null,
      endDate: endDate || null,
      notes,
      companyIds: selectedCompanyIds,
    }
    const res = editExhibition
      ? await fetch(`/api/dev/exhibitions/${editExhibition.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      : await fetch("/api/dev/exhibitions", {
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
    fetchExhibitions()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("この展示会を削除しますか？")) return
    await fetch(`/api/dev/exhibitions/${id}`, { method: "DELETE" })
    fetchExhibitions()
  }

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("ja-JP") : ""

  const filtered = exhibitions.filter((e) => {
    const q = searchQuery.toLowerCase()
    return (
      e.name.toLowerCase().includes(q) ||
      (e.location ?? "").toLowerCase().includes(q) ||
      e.companies.some((c) => c.company.name.toLowerCase().includes(q))
    )
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">展示会管理</h1>
        <Button onClick={() => { resetForm(); setShowForm(!showForm) }}>
          {showForm ? "キャンセル" : "新規登録"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editExhibition ? "展示会編集" : "展示会登録"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>展示会名 *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>開催場所</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} />
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
              <Label>接触会社（複数選択可）</Label>
              <div className="border rounded-md p-3 flex flex-wrap gap-2">
                {allCompanies.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCompany(c.id)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      selectedCompanyIds.includes(c.id)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
                {allCompanies.length === 0 && (
                  <p className="text-sm text-gray-400">会社が登録されていません</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>備考</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? "処理中..." : editExhibition ? "更新する" : "登録する"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mb-4">
        <Input
          placeholder="展示会名・場所・会社名で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filtered.map((exhibition) => (
          <Card key={exhibition.id}>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-bold">{exhibition.name}</p>
                  {exhibition.location && (
                    <p className="text-sm text-gray-500">場所: {exhibition.location}</p>
                  )}
                  {(exhibition.startDate || exhibition.endDate) && (
                    <p className="text-sm text-gray-500">
                      期間: {formatDate(exhibition.startDate)} 〜 {formatDate(exhibition.endDate)}
                    </p>
                  )}
                  {exhibition.companies.length > 0 && (
                    <p className="text-sm text-gray-500">
                      接触会社: {exhibition.companies.map((c) => c.company.name).join("、")}
                    </p>
                  )}
                  {exhibition.notes && (
                    <p className="text-sm text-gray-500">備考: {exhibition.notes}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(exhibition)}>編集</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(exhibition.id)}>削除</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-500">
            {searchQuery ? "検索結果がありません" : "展示会が登録されていません"}
          </p>
        )}
      </div>
    </div>
  )
}
