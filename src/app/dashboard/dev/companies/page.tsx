"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Contact = {
  id: string
  name: string
  isPrimary: boolean
}

type TypeMaster = {
  id: string
  name: string
}

type DevCompanyType = {
  typeMaster: TypeMaster
}

type DevCompany = {
  id: string
  name: string
  nameKana?: string
  industry?: string
  status: string
  phone?: string
  address?: string
  notes?: string
  createdAt: string
  contacts: Contact[]
  types: DevCompanyType[]
}

const STATUS_COLORS: Record<string, string> = {
  "登録のみ":  "bg-gray-100 text-gray-600",
  "面識あり":  "bg-blue-100 text-blue-600",
  "相談済":    "bg-yellow-100 text-yellow-700",
  "見積り済":  "bg-orange-100 text-orange-700",
  "受注済":    "bg-green-100 text-green-700",
}

export default function DevCompaniesPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<DevCompany[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const fetchCompanies = async () => {
    const res = await fetch("/api/dev/companies")
    const data = await res.json()
    setCompanies(data)
  }

  useEffect(() => { fetchCompanies() }, [])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("この会社を削除しますか？")) return
    await fetch(`/api/dev/companies/${id}`, { method: "DELETE" })
    fetchCompanies()
  }

  const filtered = companies.filter((c) => {
    const q = searchQuery.toLowerCase()
    const primaryContact = c.contacts.find((ct) => ct.isPrimary)
    return (
      c.name.toLowerCase().includes(q) ||
      (c.nameKana ?? "").toLowerCase().includes(q) ||
      (c.industry ?? "").toLowerCase().includes(q) ||
      (primaryContact?.name ?? "").toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">会社管理</h1>
        <Button onClick={() => router.push("/dashboard/dev/companies/new")}>
          新規登録
        </Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="会社名・カナ・業種・担当者で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filtered.map((company) => {
          const primaryContact = company.contacts.find((c) => c.isPrimary)
          return (
            <Card
              key={company.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/dashboard/dev/companies/${company.id}`)}
            >
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-lg">{company.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[company.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {company.status}
                      </span>
                    </div>
                    {company.nameKana && (
                      <p className="text-sm text-gray-500">{company.nameKana}</p>
                    )}
                    <div className="flex gap-4 mt-1 text-sm text-gray-500">
                      {company.industry && <span>業種: {company.industry}</span>}
                      {primaryContact && <span>主担当: {primaryContact.name}</span>}
                      {company.phone && <span>TEL: {company.phone}</span>}
                    </div>
                    {company.types.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {company.types.map((t) => (
                          <Badge key={t.typeMaster.id} variant="secondary" className="text-xs">
                            {t.typeMaster.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/dev/companies/${company.id}`)}
                    >
                      詳細
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => handleDelete(company.id, e)}
                    >
                      削除
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            {searchQuery ? "検索結果がありません" : "会社が登録されていません"}
          </p>
        )}
      </div>
    </div>
  )
}