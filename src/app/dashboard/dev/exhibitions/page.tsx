"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

type DevExhibition = {
  id: string
  name: string
  location?: string
  startDate?: string
  endDate?: string
  notes?: string
  summary?: string
  description?: string
  visitors: { user: { id: string; name?: string } }[]
  contacts: { company: { name: string } }[]
}

export default function DevExhibitionsPage() {
  const router = useRouter()
  const [exhibitions, setExhibitions] = useState<DevExhibition[]>([])
  const [searchQuery, setSearchQuery] = useState("")

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
        <Button onClick={() => router.push("/dashboard/dev/exhibitions/new")}>新規登録</Button>
      </div>

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