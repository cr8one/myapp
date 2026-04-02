"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
type Part = {
  id?: string
  code: string
  name: string
  note?: string
}
type User = {
  id: string
  name: string
}
type Product = {
  id: string
  code: string
  name: string
  description?: string
  userId: string
  createdAt: string
  user: User
  parts: Part[]
}
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [userId, setUserId] = useState("")
  const [parts, setParts] = useState<Part[]>([{ code: "", name: "", note: "" }])
  const [searchQuery, setSearchQuery] = useState("")
  const fetchProducts = async () => {
    const res = await fetch("/api/products")
    const data = await res.json()
    setProducts(data)
  }
  const fetchUsers = async () => {
    const res = await fetch("/api/users")
    const data = await res.json()
    setUsers(data)
  }
  useEffect(() => {
    fetchProducts()
    fetchUsers()
  }, [])
  const handleExportCSV = () => {
    const headers = ["製品コード", "製品名", "担当ユーザー名", "登録日時", "パーツコード", "パーツ名"]
    const rows: string[][] = []
    products.forEach((product) => {
      if (product.parts.length === 0) {
        rows.push([
          product.code,
          product.name,
          product.user?.name ?? "",
          new Date(product.createdAt).toLocaleString("ja-JP"),
          "",
          "",
        ])
      } else {
        product.parts.forEach((part) => {
          rows.push([
            product.code,
            product.name,
            product.user?.name ?? "",
            new Date(product.createdAt).toLocaleString("ja-JP"),
            part.code,
            part.name,
          ])
        })
      }
    })
    const bom = "\uFEFF"
    const csvContent =
      bom +
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
        .join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `products_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  const filteredProducts = products.filter((product) => {
    const q = searchQuery.toLowerCase()
    return (
      product.name.toLowerCase().includes(q) ||
      product.code.toLowerCase().includes(q) ||
      product.user?.name?.toLowerCase().includes(q) ||
      product.parts.some(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q)
      )
    )
  })
  const resetForm = () => {
    setCode("")
    setName("")
    setDescription("")
    setUserId("")
    setParts([{ code: "", name: "", note: "" }])
    setError("")
    setEditProduct(null)
    setShowForm(false)
  }
  const handleEdit = (product: Product) => {
    setEditProduct(product)
    setCode(product.code)
    setName(product.name)
    setDescription(product.description ?? "")
    setUserId(product.userId)
    setParts(product.parts.length > 0 ? product.parts : [{ code: "", name: "", note: "" }])
    setShowForm(true)
  }
  const addPart = () => {
    setParts([...parts, { code: "", name: "", note: "" }])
  }
  const updatePart = (index: number, field: keyof Part, value: string) => {
    const updated = [...parts]
    updated[index] = { ...updated[index], [field]: value }
    setParts(updated)
  }
  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index))
  }
  const handleSubmit = async () => {
    setLoading(true)
    setError("")
    if (editProduct) {
      const res = await fetch(`/api/products/${editProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, description, userId, parts }),
      })
      if (!res.ok) {
        setError("更新に失敗しました。製品コードが重複している可能性があります。")
        setLoading(false)
        return
      }
    } else {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, description, parts }),
      })
      if (!res.ok) {
        setError("登録に失敗しました。製品コードが重複している可能性があります。")
        setLoading(false)
        return
      }
    }
    resetForm()
    setLoading(false)
    fetchProducts()
  }
  const handleDelete = async (id: string) => {
    if (!confirm("この製品を削除しますか？")) return
    await fetch(`/api/products/${id}`, { method: "DELETE" })
    fetchProducts()
  }
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">製品仕様一覧</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            CSVダウンロード
          </Button>
          <Button onClick={() => { resetForm(); setShowForm(!showForm) }}>
            {showForm ? "キャンセル" : "新規登録"}
          </Button>
        </div>
      </div>
      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editProduct ? "製品仕様編集" : "製品仕様登録"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>製品コード</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>製品名</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>説明・備考</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>担当者</Label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              >
                <option value="">選択してください</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>パーツ</Label>
                <Button variant="outline" size="sm" onClick={addPart}>
                  パーツ追加
                </Button>
              </div>
              {parts.map((part, index) => (
                <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                  <Input
                    placeholder="パーツコード"
                    value={part.code}
                    onChange={(e) => updatePart(index, "code", e.target.value)}
                  />
                  <Input
                    placeholder="パーツ名"
                    value={part.name}
                    onChange={(e) => updatePart(index, "name", e.target.value)}
                  />
                  <Input
                    placeholder="備考"
                    value={part.note ?? ""}
                    onChange={(e) => updatePart(index, "note", e.target.value)}
                  />
                  <Button variant="outline" size="sm" onClick={() => removePart(index)}>
                    削除
                  </Button>
                </div>
              ))}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? "処理中..." : editProduct ? "更新する" : "登録する"}
            </Button>
          </CardContent>
        </Card>
      )}
      <div className="mb-4">
        <Input
          placeholder="製品名・製品コード・担当者・パーツで検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="space-y-4">
        {filteredProducts.map((product) => (
          <Card key={product.id}>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-bold">{product.name}</p>
                      <p className="text-sm text-gray-500">コード: {product.code}</p>
                      {product.description && (
                        <p className="text-sm text-gray-500">{product.description}</p>
                      )}
                      <p className="text-sm text-gray-500">担当: {product.user?.name}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      パーツ数: {product.parts.length}
                    </div>
                  </div>
                  {product.parts.length > 0 && (
                    <div className="mt-2 border-t pt-2">
                      <p className="text-sm font-medium mb-1">パーツ一覧</p>
                      {product.parts.map((part, i) => (
                        <p key={i} className="text-sm text-gray-600">
                          {part.code} / {part.name} {part.note && `/ ${part.note}`}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                    編集
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>
                    削除
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredProducts.length === 0 && (
          <p className="text-center text-gray-500">
            {searchQuery ? "検索結果がありません" : "製品が登録されていません"}
          </p>
        )}
      </div>
    </div>
  )
}
