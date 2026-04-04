"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

type Part = {
  id: string
  code: string
  name: string
  note?: string
  product: {
    code: string
    name: string
  }
}

export default function PartsPage() {
  const [parts, setParts] = useState<Part[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [editPart, setEditPart] = useState<Part | null>(null)
  const [editCode, setEditCode] = useState("")
  const [editName, setEditName] = useState("")
  const [editNote, setEditNote] = useState("")
  const [loading, setLoading] = useState(false)

  const fetchParts = async () => {
    const res = await fetch("/api/parts")
    const data = await res.json()
    setParts(data)
  }

  useEffect(() => {
    fetchParts()
  }, [])

  const handleEdit = (part: Part) => {
    setEditPart(part)
    setEditCode(part.code)
    setEditName(part.name)
    setEditNote(part.note ?? "")
  }

  const handleUpdate = async () => {
    if (!editPart) return
    setLoading(true)
    await fetch(`/api/parts/${editPart.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: editCode, name: editName, note: editNote }),
    })
    setEditPart(null)
    setLoading(false)
    fetchParts()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("このパーツを削除しますか？")) return
    await fetch(`/api/parts/${id}`, { method: "DELETE" })
    fetchParts()
  }

  const filteredParts = parts.filter((part) => {
    const q = searchQuery.toLowerCase()
    return (
      part.code.toLowerCase().includes(q) ||
      part.name.toLowerCase().includes(q) ||
      part.product.code.toLowerCase().includes(q) ||
      part.product.name.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">パーツ一覧</h1>
      </div>

      <div className="mb-4">
        <Input
          placeholder="パーツコード・パーツ名・製品名で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {editPart && (
        <Card className="mb-6 border-blue-300">
          <CardContent className="pt-4 space-y-3">
            <p className="text-sm font-medium text-blue-600">パーツ編集中：{editPart.product.name}</p>
            <div className="grid grid-cols-3 gap-3">
              <Input
                placeholder="パーツコード"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
              />
              <Input
                placeholder="パーツ名"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <Input
                placeholder="備考"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdate} disabled={loading}>
                {loading ? "更新中..." : "更新する"}
              </Button>
              <Button variant="outline" onClick={() => setEditPart(null)}>
                キャンセル
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {filteredParts.map((part) => (
          <Card key={part.id}>
            <CardContent className="pt-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{part.name}</p>
                  <p className="text-sm text-gray-500">パーツコード: {part.code}</p>
                  {part.note && <p className="text-sm text-gray-500">備考: {part.note}</p>}
                  <p className="text-sm text-blue-500 mt-1">
                    製品: {part.product.name}（{part.product.code}）
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(part)}>
                    編集
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(part.id)}>
                    削除
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredParts.length === 0 && (
          <p className="text-center text-gray-500">
            {searchQuery ? "検索結果がありません" : "パーツが登録されていません"}
          </p>
        )}
      </div>
    </div>
  )
}
