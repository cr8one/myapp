"use client"
import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Permission = {
  productsView: boolean
  productsEdit: boolean
  partsView: boolean
  partsEdit: boolean
  devView: boolean
  devEdit: boolean
}

type User = {
  id: string
  name: string
  email: string
  department?: string
  position?: string
  phone?: string
  role: "ADMIN" | "USER"
  createdAt: string
  permission?: Permission
}

const defaultPermission: Permission = {
  productsView: true,
  productsEdit: false,
  partsView: true,
  partsEdit: false,
  devView: true,
  devEdit: false,
}

const permissionLabels: { key: keyof Permission; label: string }[] = [
  { key: "productsView", label: "製品：閲覧" },
  { key: "productsEdit", label: "製品：編集" },
  { key: "partsView",    label: "パーツ：閲覧" },
  { key: "partsEdit",    label: "パーツ：編集" },
  { key: "devView",      label: "新規開発：閲覧" },
  { key: "devEdit",      label: "新規開発：編集" },
]

export default function UsersPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"

  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const importRef = useRef<HTMLInputElement>(null)

  // フォーム
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [department, setDepartment] = useState("")
  const [position, setPosition] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<"ADMIN" | "USER">("USER")
  const [permission, setPermission] = useState<Permission>(defaultPermission)

  const fetchUsers = async () => {
    const res = await fetch("/api/users")
    const data = await res.json()
    setUsers(data)
  }

  useEffect(() => { fetchUsers() }, [])

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
    setName(""); setEmail(""); setPassword("")
    setDepartment(""); setPosition(""); setPhone("")
    setRole("USER"); setPermission(defaultPermission)
    setError(""); setEditUser(null); setShowForm(false)
  }

  const handleEdit = (user: User) => {
    setEditUser(user)
    setName(user.name ?? "")
    setEmail(user.email)
    setDepartment(user.department ?? "")
    setPosition(user.position ?? "")
    setPhone(user.phone ?? "")
    setPassword("")
    setRole(user.role)
    setPermission(user.permission ?? defaultPermission)
    setShowForm(true)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError("")
    const body = {
      name, email, password: password || undefined,
      department, position, phone, role,
      permission: role === "ADMIN" ? undefined : permission,
    }
    const res = editUser
      ? await fetch(`/api/users/${editUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      : await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "処理に失敗しました")
      setLoading(false)
      return
    }
    resetForm()
    setLoading(false)
    fetchUsers()
  }

  const handleDelete = async (id: string) => {
    if (id === session?.user?.id) {
      alert("自分自身は削除できません")
      return
    }
    if (!confirm("このユーザーを削除しますか？")) return
    await fetch(`/api/users/${id}`, { method: "DELETE" })
    fetchUsers()
  }

  const handleExport = () => {
    window.location.href = "/api/users/export"
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/users/import", { method: "POST", body: formData })
    const result = await res.json()
    if (res.ok) {
      alert(`インポート完了：${result.created}件登録、${result.skipped}件スキップ${result.errors.length > 0 ? `\nエラー：${result.errors.join("\n")}` : ""}`)
      fetchUsers()
    } else {
      alert(`エラー：${result.error}`)
    }
    e.target.value = ""
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ユーザー管理</h1>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button variant="outline" onClick={handleExport}>CSVエクスポート</Button>
              <Button variant="outline" onClick={() => importRef.current?.click()}>CSVインポート</Button>
              <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
              <Button onClick={() => { resetForm(); setShowForm(!showForm) }}>
                {showForm ? "キャンセル" : "新規登録"}
              </Button>
            </>
          )}
        </div>
      </div>

      {showForm && isAdmin && (
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

            <div className="space-y-2">
              <Label>ロール</Label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value as "ADMIN" | "USER")}
              >
                <option value="USER">一般ユーザー</option>
                <option value="ADMIN">管理者（ADMIN）</option>
              </select>
            </div>

            {role === "USER" && (
              <div className="space-y-2">
                <Label>権限設定</Label>
                <div className="grid grid-cols-3 gap-2 border rounded p-3">
                  {permissionLabels.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permission[key]}
                        onChange={(e) => setPermission((p) => ({ ...p, [key]: e.target.checked }))}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            )}

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
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{user.name}</p>
                      {user.role === "ADMIN" && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">ADMIN</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    {user.department && <p className="text-sm text-gray-500">部署: {user.department}</p>}
                    {user.position  && <p className="text-sm text-gray-500">役職: {user.position}</p>}
                    {user.phone     && <p className="text-sm text-gray-500">電話: {user.phone}</p>}
                  </div>
                  {user.role === "USER" && user.permission && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">権限</p>
                      <div className="flex flex-wrap gap-1">
                        {permissionLabels
                          .filter(({ key }) => user.permission![key])
                          .map(({ key, label }) => (
                            <span key={key} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                              {label}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>編集</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(user.id)}>削除</Button>
                  </div>
                )}
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
