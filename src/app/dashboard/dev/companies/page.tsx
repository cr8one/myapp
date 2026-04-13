"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import JSZip from "jszip"

type Contact = { id: string; name: string; isPrimary: boolean }
type TypeMaster = { id: string; name: string }
type DevCompanyType = { typeMaster: TypeMaster }
type DevCompany = {
  id: string; name: string; nameKana?: string; industry?: string; status: string
  phone?: string; address?: string; postalCode?: string; url?: string; notes?: string
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

function toCsv(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`
  return [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n")
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r/g, "").split("\n").filter(Boolean)
  const headers = lines[0].replace(/^\uFEFF/, "").split(",").map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const values: string[] = []
    let current = ""
    let inQuotes = false
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes }
      else if (char === "," && !inQuotes) { values.push(current.trim()); current = "" }
      else { current += char }
    }
    values.push(current.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? "" })
    return row
  })
}

export default function DevCompaniesPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<DevCompany[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [importMessage, setImportMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleExport = async () => {
    const zip = new JSZip()

    // companies.csv
    const companyRows = companies.map((c) => [
      c.id, c.name, c.nameKana ?? "", c.industry ?? "", c.status,
      c.postalCode ?? "", c.address ?? "", c.phone ?? "", c.url ?? "", c.notes ?? "",
    ])
    zip.file("companies.csv", "\uFEFF" + toCsv(
      ["id", "name", "nameKana", "industry", "status", "postalCode", "address", "phone", "url", "notes"],
      companyRows
    ))

    // company_contacts.csv
    const contactRows: string[][] = []
    for (const c of companies) {
      for (const ct of c.contacts) {
        contactRows.push([c.id, c.name, ct.id, ct.name, String(ct.isPrimary)])
      }
    }
    zip.file("company_contacts.csv", "\uFEFF" + toCsv(
      ["companyId", "companyName", "id", "name", "isPrimary"],
      contactRows
    ))

    // company_types.csv
    const typeRows: string[][] = []
    for (const c of companies) {
      for (const t of c.types) {
        typeRows.push([c.id, c.name, t.typeMaster.id, t.typeMaster.name])
      }
    }
    zip.file("company_types.csv", "\uFEFF" + toCsv(
      ["companyId", "companyName", "typeMasterId", "typeMasterName"],
      typeRows
    ))

    const blob = await zip.generateAsync({ type: "blob" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "companies.zip"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportMessage("")
    try {
      const zip = await JSZip.loadAsync(file)
      const companyFile = zip.file("companies.csv")
      if (!companyFile) { setImportMessage("エラー: companies.csvが見つかりません"); return }
      const companies = parseCsv(await companyFile.async("text"))
      const contactFile = zip.file("company_contacts.csv")
      const contacts = contactFile ? parseCsv(await contactFile.async("text")) : []
      const typeFile = zip.file("company_types.csv")
      const types = typeFile ? parseCsv(await typeFile.async("text")) : []

      const chunkSize = 10
      for (let i = 0; i < companies.length; i += chunkSize) {
        const chunk = companies.slice(i, i + chunkSize)
        const chunkIds = chunk.map((c: Record<string, string>) => c.id).filter(Boolean)
        const chunkContacts = contacts.filter((c: Record<string, string>) => chunkIds.includes(c.companyId))
        const chunkTypes = types.filter((t: Record<string, string>) => chunkIds.includes(t.companyId))
        const res = await fetch("/api/dev/companies/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companies: chunk, contacts: chunkContacts, types: chunkTypes }),
        })
        if (!res.ok) {
          const data = await res.json()
          setImportMessage(`エラー: ${data.error}`)
          e.target.value = ""
          return
        }
        setImportMessage(`インポート中... ${i + chunk.length}/${companies.length}件`)
      }
      setImportMessage(`インポート完了: ${companies.length}件`)
      fetchCompanies()
    } catch {
      setImportMessage("エラー: ZIPファイルの読み込みに失敗しました")
    }
    e.target.value = ""
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>CSVエクスポート</Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>CSVインポート</Button>
          <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={handleImport} />
          <Button onClick={() => router.push("/dashboard/dev/companies/new")}>新規登録</Button>
        </div>
      </div>

      {importMessage && (
        <p className={`mb-4 text-sm px-4 py-2 rounded ${importMessage.startsWith("エラー") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
          {importMessage}
        </p>
      )}

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
                    <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/dev/companies/${company.id}`)}>詳細</Button>
                    <Button variant="destructive" size="sm" onClick={(e) => handleDelete(company.id, e)}>削除</Button>
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
