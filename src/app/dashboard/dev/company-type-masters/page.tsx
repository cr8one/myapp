"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type TypeMaster = {
  id: string
  name: string
  description?: string
  sortOrder: number
}

export default function DevCompanyTypeMastersPage() {
  const [masters, setMasters] = useState<TypeMaster[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<TypeMaster | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [sortOrder, setSortOrder] = useState(0)

  const fetchMasters = async () => {
    const res = await fetch("/api/dev/company-type-masters")
    const data = await res.json()
    setMasters(data)
  }

  useEffect(() => { fetchMasters() }, [])

  const resetForm = () => {
    setName(""); setDescription(""); setSortOrder(0)
    setError(""); setEditTarget(null); setShowForm(false)
  }

  const handleEdit = (master: TypeMaster) => {
    setEditTarget(master)
    setName(master.name)
    setDescription(master.description ?? "")
    setSortOrder(master.sortOrder)
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!name) { setError("種別名は必須です"); return }
    setLoading(true)
    setError("")
    const body = { name, description, sortOrder }
    const res = editTarget
      ? await fetch(`/api/dev/company-type-masters/${editTarget.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      : await fetch("/api/dev/company-type-masters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
    if (!res.ok) { setError("保存に失敗しました"); setLoading(false); return }
    resetForm()
    setLoading(false)
    fetchMasters()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("この種別を削除しますか？\n※この種別を設定している会社からも削除されます")) return
    await fetch(`/api/dev/company-type-masters/${id}`, { method: "DELETE" })
    fetchMasters()
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">種別管理</h1>
        <Button onClick={() => { resetForm(); setShowForm(!showForm) }}>
          {showForm ? "キャンセル" : "新規追加"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editTarget ? "種別編集" : "種別追加"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>種別名 *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例：OEM生産" />
            </div>
            <div className="space-y-2">
              <Label>説明</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>表示順</Label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-24"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? "処理中..." : editTarget ? "更新する" : "追加する"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {masters.map((master) => (
          <Card key={master.id}>
            <CardContent className="pt-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{master.name}</p>
                  {master.description && (
                    <p className="text-sm text-gray-500">{master.description}</p>
                  )}
                  <p className="text-xs text-gray-400">表示順: {master.sortOrder}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(master)}>編集</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(master.id)}>削除</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {masters.length === 0 && (
          <p className="text-center text-gray-500 py-8">種別が登録されていません</p>
        )}
      </div>
    </div>
  )
}