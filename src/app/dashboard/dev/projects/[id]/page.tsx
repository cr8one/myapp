"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type DevCompany = { id: string; name: string }
type AssigneeUser = { id: string; name: string; department?: string; position?: string }
type DevProject = {
  id: string
  title: string
  status: string
  description?: string
  expectedOrderDate?: string
  notes?: string
  primaryCompanyId?: string
  primaryCompany?: DevCompany
  companies: { company: DevCompany }[]
  assignees: { user: AssigneeUser }[]
  estimatedAmount?: number
  orderedAmount?: number
  createdAt: string
  updatedAt: string
}

const STATUS_OPTIONS = ["商談中", "提案済", "受注", "失注"]

const statusColor = (s: string) => {
  switch (s) {
    case "商談中": return "bg-blue-100 text-blue-700"
    case "提案済": return "bg-yellow-100 text-yellow-700"
    case "受注":   return "bg-green-100 text-green-700"
    case "失注":   return "bg-gray-100 text-gray-500"
    default:       return "bg-gray-100 text-gray-700"
  }
}

export default function DevProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<DevProject | null>(null)
  const [allCompanies, setAllCompanies] = useState<DevCompany[]>([])
  const [allUsers, setAllUsers] = useState<AssigneeUser[]>([])
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [title, setTitle] = useState("")
  const [status, setStatus] = useState("商談中")
  const [description, setDescription] = useState("")
  const [expectedOrderDate, setExpectedOrderDate] = useState("")
  const [notes, setNotes] = useState("")
  const [primaryCompanyId, setPrimaryCompanyId] = useState("")
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([])
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([])
  const [estimatedAmount, setEstimatedAmount] = useState("")
  const [orderedAmount, setOrderedAmount] = useState("")

  const fetchProject = async () => {
    const res = await fetch(`/api/dev/projects/${id}`)
    const data = await res.json()
    setProject(data)
  }

  useEffect(() => {
    fetchProject()
    fetch("/api/dev/companies").then(r => r.json()).then(setAllCompanies)
    fetch("/api/users").then(r => r.json()).then(setAllUsers)
  }, [id])

  const startEdit = () => {
    if (!project) return
    setTitle(project.title)
    setStatus(project.status)
    setDescription(project.description ?? "")
    setExpectedOrderDate(project.expectedOrderDate ? project.expectedOrderDate.slice(0, 10) : "")
    setNotes(project.notes ?? "")
    setPrimaryCompanyId(project.primaryCompanyId ?? "")
    setSelectedCompanyIds(project.companies.map((c) => c.company.id))
    setSelectedAssigneeIds(project.assignees.map((a) => a.user.id))
    setEstimatedAmount(project.estimatedAmount ? String(project.estimatedAmount) : "")
    setOrderedAmount(project.orderedAmount ? String(project.orderedAmount) : "")
    setEditing(true)
  }

  const toggleItem = (id: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  const handleSave = async () => {
    setLoading(true)
    setError("")
    const res = await fetch(`/api/dev/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, status, description,
        expectedOrderDate: expectedOrderDate || null,
        notes,
        primaryCompanyId: primaryCompanyId || null,
        companyIds: selectedCompanyIds,
        assigneeIds: selectedAssigneeIds,
        estimatedAmount: estimatedAmount || null,
        orderedAmount: orderedAmount || null,
      }),
    })
    if (!res.ok) { setError("保存に失敗しました"); setLoading(false); return }
    setEditing(false)
    setLoading(false)
    fetchProject()
  }

  const handleDelete = async () => {
    if (!confirm("この案件を削除しますか？")) return
    await fetch(`/api/dev/projects/${id}`, { method: "DELETE" })
    router.push("/dashboard/dev/projects")
  }

  if (!project) return <div className="p-8">読み込み中...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <button onClick={() => router.push("/dashboard/dev/projects")}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
            ← 案件一覧に戻る
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${statusColor(project.status)}`}>
              {project.status}
            </span>
          </div>
        </div>
        {!editing && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={startEdit}>編集</Button>
            <Button variant="destructive" onClick={handleDelete}>削除</Button>
          </div>
        )}
      </div>

      {editing ? (
        <Card className="mb-6">
          <CardHeader><CardTitle>案件編集</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>案件名 *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>ステータス</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm"
                  value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>主担当会社</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm"
                  value={primaryCompanyId} onChange={(e) => setPrimaryCompanyId(e.target.value)}>
                  <option value="">選択してください</option>
                  {allCompanies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>受注予定日</Label>
                <Input type="date" value={expectedOrderDate} onChange={(e) => setExpectedOrderDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>関連会社（複数選択可）</Label>
              <div className="border rounded-md p-3 flex flex-wrap gap-2">
                {allCompanies.map((c) => (
                  <button key={c.id} type="button"
                    onClick={() => toggleItem(c.id, selectedCompanyIds, setSelectedCompanyIds)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      selectedCompanyIds.includes(c.id)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>担当者（複数選択可）</Label>
              <div className="border rounded-md p-3 flex flex-wrap gap-2">
                {allUsers.map((u) => (
                  <button key={u.id} type="button"
                    onClick={() => toggleItem(u.id, selectedAssigneeIds, setSelectedAssigneeIds)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      selectedAssigneeIds.includes(u.id)
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}>
                    {u.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>見積金額（円）</Label>
                <Input type="number" value={estimatedAmount}
                  onChange={(e) => setEstimatedAmount(e.target.value)} placeholder="例: 1000000" />
              </div>
              <div className="space-y-2">
                <Label>受注金額（円）</Label>
                <Input type="number" value={orderedAmount}
                  onChange={(e) => setOrderedAmount(e.target.value)} placeholder="例: 900000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>内容</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>備考</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={loading} className="flex-1">
                {loading ? "保存中..." : "保存する"}
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>キャンセル</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>基本情報</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">主担当会社</p>
                <p className="font-medium">{project.primaryCompany?.name ?? "未設定"}</p>
              </div>
              <div>
                <p className="text-gray-500">受注予定日</p>
                <p className="font-medium">
                  {project.expectedOrderDate
                    ? new Date(project.expectedOrderDate).toLocaleDateString("ja-JP")
                    : "未設定"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">関連会社</p>
                <p className="font-medium">
                  {project.companies.length > 0
                    ? project.companies.map((c) => c.company.name).join("、")
                    : "未設定"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">登録日</p>
                <p className="font-medium">{new Date(project.createdAt).toLocaleDateString("ja-JP")}</p>
              </div>
              {project.description && (
                <div className="col-span-2">
                  <p className="text-gray-500">内容</p>
                  <p className="font-medium whitespace-pre-wrap">{project.description}</p>
                </div>
              )}
              {project.notes && (
                <div className="col-span-2">
                  <p className="text-gray-500">備考</p>
                  <p className="font-medium whitespace-pre-wrap">{project.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>金額情報</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">見積金額</p>
                <p className="font-medium text-lg">
                  {project.estimatedAmount ? `¥${project.estimatedAmount.toLocaleString()}` : "未設定"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">受注金額</p>
                <p className="font-medium text-lg">
                  {project.orderedAmount ? `¥${project.orderedAmount.toLocaleString()}` : "未設定"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>担当者</CardTitle></CardHeader>
            <CardContent>
              {project.assignees.length === 0 ? (
                <p className="text-sm text-gray-400">担当者が設定されていません</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {project.assignees.map(({ user }) => (
                    <div key={user.id} className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        {(user.department || user.position) && (
                          <p className="text-xs text-gray-500">
                            {[user.department, user.position].filter(Boolean).join(" / ")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
