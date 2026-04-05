"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type DevCompany = {
  id: string
  name: string
}

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
  createdAt: string
}

const STATUS_OPTIONS = ["商談中", "提案済", "受注", "失注"]

export default function DevProjectsPage() {
  const [projects, setProjects] = useState<DevProject[]>([])
  const [allCompanies, setAllCompanies] = useState<DevCompany[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editProject, setEditProject] = useState<DevProject | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const [title, setTitle] = useState("")
  const [status, setStatus] = useState("商談中")
  const [description, setDescription] = useState("")
  const [expectedOrderDate, setExpectedOrderDate] = useState("")
  const [notes, setNotes] = useState("")
  const [primaryCompanyId, setPrimaryCompanyId] = useState("")
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([])

  const fetchProjects = async () => {
    const res = await fetch("/api/dev/projects")
    const data = await res.json()
    setProjects(data)
  }

  const fetchCompanies = async () => {
    const res = await fetch("/api/dev/companies")
    const data = await res.json()
    setAllCompanies(data)
  }

  useEffect(() => {
    fetchProjects()
    fetchCompanies()
  }, [])

  const resetForm = () => {
    setTitle(""); setStatus("商談中"); setDescription("")
    setExpectedOrderDate(""); setNotes(""); setPrimaryCompanyId("")
    setSelectedCompanyIds([]); setError(""); setEditProject(null); setShowForm(false)
  }

  const handleEdit = (project: DevProject) => {
    setEditProject(project)
    setTitle(project.title)
    setStatus(project.status)
    setDescription(project.description ?? "")
    setExpectedOrderDate(project.expectedOrderDate ? project.expectedOrderDate.slice(0, 10) : "")
    setNotes(project.notes ?? "")
    setPrimaryCompanyId(project.primaryCompanyId ?? "")
    setSelectedCompanyIds(project.companies.map((c) => c.company.id))
    setShowForm(true)
  }

  const toggleCompany = (id: string) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError("")
    const body = {
      title, status, description,
      expectedOrderDate: expectedOrderDate || null,
      notes,
      primaryCompanyId: primaryCompanyId || null,
      companyIds: selectedCompanyIds,
    }
    const res = editProject
      ? await fetch(`/api/dev/projects/${editProject.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      : await fetch("/api/dev/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
    if (!res.ok) {
      setError("保存に失敗しました")
      setLoading(false)
      return
    }
    resetForm()
    setLoading(false)
    fetchProjects()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("この案件を削除しますか？")) return
    await fetch(`/api/dev/projects/${id}`, { method: "DELETE" })
    fetchProjects()
  }

  const statusColor = (s: string) => {
    switch (s) {
      case "商談中": return "bg-blue-100 text-blue-700"
      case "提案済": return "bg-yellow-100 text-yellow-700"
      case "受注":   return "bg-green-100 text-green-700"
      case "失注":   return "bg-gray-100 text-gray-500"
      default:       return "bg-gray-100 text-gray-700"
    }
  }

  const filtered = projects.filter((p) => {
    const q = searchQuery.toLowerCase()
    return (
      p.title.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q) ||
      (p.primaryCompany?.name ?? "").toLowerCase().includes(q) ||
      p.companies.some((c) => c.company.name.toLowerCase().includes(q))
    )
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">案件管理</h1>
        <Button onClick={() => { resetForm(); setShowForm(!showForm) }}>
          {showForm ? "キャンセル" : "新規登録"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editProject ? "案件編集" : "案件登録"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>案件名 *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>ステータス</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>主担当会社</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={primaryCompanyId}
                  onChange={(e) => setPrimaryCompanyId(e.target.value)}
                >
                  <option value="">選択してください</option>
                  {allCompanies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>受注予定日</Label>
                <Input
                  type="date"
                  value={expectedOrderDate}
                  onChange={(e) => setExpectedOrderDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>関連会社（複数選択可）</Label>
              <div className="border rounded-md p-3 flex flex-wrap gap-2">
                {allCompanies.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCompany(c.id)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      selectedCompanyIds.includes(c.id)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
                {allCompanies.length === 0 && (
                  <p className="text-sm text-gray-400">会社が登録されていません</p>
                )}
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
            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? "処理中..." : editProject ? "更新する" : "登録する"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mb-4">
        <Input
          placeholder="案件名・ステータス・会社名で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filtered.map((project) => (
          <Card key={project.id}>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold">{project.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  {project.primaryCompany && (
                    <p className="text-sm text-gray-500">主担当: {project.primaryCompany.name}</p>
                  )}
                  {project.companies.length > 0 && (
                    <p className="text-sm text-gray-500">
                      関連会社: {project.companies.map((c) => c.company.name).join("、")}
                    </p>
                  )}
                  {project.expectedOrderDate && (
                    <p className="text-sm text-gray-500">
                      受注予定: {new Date(project.expectedOrderDate).toLocaleDateString("ja-JP")}
                    </p>
                  )}
                  {project.description && <p className="text-sm text-gray-500">内容: {project.description}</p>}
                  {project.notes && <p className="text-sm text-gray-500">備考: {project.notes}</p>}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(project)}>編集</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(project.id)}>削除</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-500">
            {searchQuery ? "検索結果がありません" : "案件が登録されていません"}
          </p>
        )}
      </div>
    </div>
  )
}
