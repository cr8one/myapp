"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
type User = {
  id: string
  name: string
  email: string
  department?: string
  position?: string
  phone?: string
  createdAt: string
}
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [department, setDepartment] = useState("")
  const [position, setPosition] = useState("")
  const [phone, setPhone] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const fetchUsers = async () => {
    const res = await fetch("/api/users")
    const data = await res.json()
    setUsers(data)
  }
  useEffect(() => {
    fetchUsers()
  }, [])
  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase()
    return (
      user.name?.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.department?.toLowerCase().includes(q) ||
      user.position?.toLowerCase().includes(q)
    )
  })
  const resetForm = () => {
    setName("")
    setEmail("")
    setPassword("")
    setDepartment("")
    setPosition("")
    setPhone("")
    setError("")
    setEditUser(null)
    setShowForm(false)
  }
  const handleEdit = (user: User) => {
    setEditUser(user)
    setName(user.name ?? "")
    setEmail(user.email)
    setDepartment(user.department ?? "")
    setPosition(user.position ?? "")
    setPhone(user.phone ?? "")
    setPassword("")
    setShowForm(true)
  }
  const handleSubmit = async () => {
    setLoading(true)
    setError("")
    if (editUser) {
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, department, position, phone, password: password || undefined }),
      })
      if (!res.ok) {
        setError("更新に失敗しました。")
        setLoading(false)
        return
      }
    } else {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, department, position, phone }),
      })
      if (!res.ok) {
        setError("登録に失敗しました。メールアドレスが重複している可能性があります。")
        setLoading(false)
        return
      }
    }
    resetForm()
    setLoading(false)
    fetchUsers()
  }
  const handleDelete = async (id: string) => {
    if (!confirm("このユーザーを削除しますか？")) return
    await fetch(`/api/users/${id}`, { method: "DELETE" })
    fetchUsers()
  }
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ユーザー管理</h1>
        <Button onClick={() => { resetForm(); setShowForm(!showForm) }}>
          {showForm ? "キャンセル" : "新規登録"}
        </Button>
      </div>
      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editUser ? "ユーザー編集" : "ユーザー登録"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>名前</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              {!editUser && (
                <div className="space-y-2">
                  <Label>メールアドレス</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{editUser ? "新しいパスワード（変更する場合のみ）" : "パスワード"}</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>電話番号</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>部署</Label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>役職</Label>
                <Input value={position} onChange={(e) => setPosition(e.target.value)} />
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? "処理中..." : editUser ? "更新する" : "登録する"}
            </Button>
          </CardContent>
        </Card>
      )}
      <div className="mb-4">
        <Input
          placeholder="名前・メール・部署・役職で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div>
                    <p className="font-bold">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div>
                    {user.department && (
                      <p className="text-sm text-gray-500">部署: {user.department}</p>
                    )}
                    {user.position && (
                      <p className="text-sm text-gray-500">役職: {user.position}</p>
                    )}
                    {user.phone && (
                      <p className="text-sm text-gray-500">電話: {user.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                    編集
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(user.id)}>
                    削除
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredUsers.length === 0 && (
          <p className="text-center text-gray-500">
            {searchQuery ? "検索結果がありません" : "ユーザーが登録されていません"}
          </p>
        )}
      </div>
    </div>
  )
}
