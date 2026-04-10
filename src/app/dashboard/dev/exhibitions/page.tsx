"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import JSZip from "jszip"

type DevExhibition = {
  id: string
  name: string
  location?: string
  startDate?: string
  endDate?: string
  notes?: string
  summary?: string
  description?: string
  visitors: { user: { id: string; name?: string }; impression?: string }[]
  contacts: { company: { id: string; name: string }; contact?: { id: string; name: string } | null; notes?: string }[]
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

export default function DevExhibitionsPage() {
  const router = useRouter()
  const [exhibitions, setExhibitions] = useState<DevExhibition[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [importMessage, setImportMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchExhibitions = async () => {
    const res = await fetch("/api/dev/exhibitions")
    const data = await res.json()
    setExhibitions(data)
  }

  useEffect(() => { fetchExhibitions() }, [])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("この展示会を削除しますか？")) return
    await fetch(`/api/dev/exhibitions/${id}`, { method: "DELETE" })
    fetchExhibitions()
  }

  const handleExport = async () => {
    const zip = new JSZip()

    // exhibitions.csv
    const exRows = exhibitions.map((e) => [
      e.id, e.name, e.location ?? "",
      e.startDate ? e.startDate.slice(0, 10) : "",
      e.endDate ? e.endDate.slice(0, 10) : "",
      e.summary ?? "", e.description ?? "", e.notes ?? "",
    ])
    zip.file("exhibitions.csv", "\uFEFF" + toCsv(
      ["id", "name", "location", "startDate", "endDate", "summary", "description", "notes"],
      exRows
    ))

    // exhibition_visitors.csv
    const vRows: string[][] = []
    for (const e of exhibitions) {
      for (const v of e.visitors) {
        vRows.push([e.id, e.name, v.user.id, v.user.name ?? "", v.impression ?? ""])
      }
    }
    zip.file("exhibition_visitors.csv", "\uFEFF" + toCsv(
      ["exhibitionId", "exhibitionName", "userId", "userName", "impression"],
      vRows
    ))

    // exhibition_contacts.csv
    const cRows: string[][] = []
    for (const e of exhibitions) {
      for (const c of e.contacts) {
        cRows.push([e.id, e.name, c.company.id, c.company.name, c.contact?.id ?? "", c.contact?.name ?? "", c.notes ?? ""])
      }
    }
    zip.file("exhibition_contacts.csv", "\uFEFF" + toCsv(
      ["exhibitionId", "exhibitionName", "companyId", "companyName", "contactId", "contactName", "notes"],
      cRows
    ))

    const blob = await zip.generateAsync({ type: "blob" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "exhibitions.zip"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportMessage("")

    try {
      const zip = await JSZip.loadAsync(file)

      const exFile = zip.file("exhibitions.csv")
      const vFile = zip.file("exhibition_visitors.csv")
      const cFile = zip.file("exhibition_contacts.csv")

      if (!exFile) { setImportMessage("エラー: exhibitions.csvが見つかりません"); return }

      const exText = await exFile.async("text")
      const exhibitions = parseCsv(exText)

      const visitors = vFile ? parseCsv(await vFile.async("text")).map((r) => ({
        exhibitionId: r.exhibitionId,
        userId: r.userId,
        impression: r.impression,
      })) : []

      const contacts = cFile ? parseCsv(await cFile.async("text")).map((r) => ({
        exhibitionId: r.exhibitionId,
        companyId: r.companyId,
        contactId: r.contactId || null,
        notes: r.notes,
      })) : []

      const res = await fetch("/api/dev/exhibitions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exhibitions, visitors, contacts }),
      })
      const data = await res.json()
      if (res.ok) {
        setImportMessage(data.message)
        fetchExhibitions()
      } else {
        setImportMessage(`エラー: ${data.error}`)
      }
    } catch {
      setImportMessage("エラー: ZIPファイルの読み込みに失敗しました")
    }
    e.target.value = ""
  }

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString("ja-JP") : ""

  const filtered = exhibitions.filter((e) => {
    const q = searchQuery.toLowerCase()
    return (
      e.name.toLowerCase().includes(q) ||
      (e.location ?? "").toLowerCase().includes(q) ||
      e.contacts.some((c) => c.company.name.toLowerCase().includes(q))
    )
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">展示会管理</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>CSVエクスポート</Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>CSVインポート</Button>
          <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={handleImport} />
          <Button onClick={() => router.push("/dashboard/dev/exhibitions/new")}>新規登録</Button>
        </div>
      </div>

      {importMessage && (
        <p className={`mb-4 text-sm px-4 py-2 rounded ${importMessage.startsWith("エラー") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
          {importMessage}
        </p>
      )}

      <div className="mb-4">
        <Input
          placeholder="展示会名・場所・会社名で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filtered.map((exhibition) => (
          <Card
            key={exhibition.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(`/dashboard/dev/exhibitions/${exhibition.id}`)}
          >
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-bold text-lg">{exhibition.name}</p>
                  <div className="flex gap-4 mt-1 text-sm text-gray-500">
                    {exhibition.location && <span>場所: {exhibition.location}</span>}
                    {(exhibition.startDate || exhibition.endDate) && (
                      <span>期間: {formatDate(exhibition.startDate)} 〜 {formatDate(exhibition.endDate)}</span>
                    )}
                  </div>
                  {exhibition.visitors.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      来場者: {exhibition.visitors.map((v) => v.user.name).join("、")}
                    </p>
                  )}
                  {exhibition.contacts.length > 0 && (
                    <p className="text-sm text-gray-500">
                      接触会社: {exhibition.contacts.map((c) => c.company.name).join("、")}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/dev/exhibitions/${exhibition.id}`)}>詳細</Button>
                  <Button variant="destructive" size="sm" onClick={(e) => handleDelete(exhibition.id, e)}>削除</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            {searchQuery ? "検索結果がありません" : "展示会が登録されていません"}
          </p>
        )}
      </div>
    </div>
  )
}
