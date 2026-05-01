"use client"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ProjectFiles from "@/components/dev/project-files"
import { SingleSelectModal, MultiSelectModal } from "@/components/ui/searchable-select-modal"
import JSZip from "jszip"

type DevCompany = { id: string; name: string }
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
  assignees?: { user: { id: string; name: string } }[]
  estimatedAmount?: number
  orderedAmount?: number
  createdAt: string
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

export default function DevProjectsPage() {
  const [projects, setProjects] = useState<DevProject[]>([])
  const [allCompanies, setAllCompanies] = useState<DevCompany[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editProject, setEditProject] = useState<DevProject | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [importMessage, setImportMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

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
  useEffect(() => { fetchProjects(); fetchCompanies() }, [])

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

  const handleSubmit = async () => {
    setLoading(true); setError("")
    const body = {
      title, status, description,
      expectedOrderDate: expectedOrderDate || null,
      notes,
      primaryCompanyId: primaryCompanyId || null,
      companyIds: selectedCompanyIds,
    }
    const res = editProject
      ? await fetch(`/api/dev/projects/${editProject.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/dev/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (!res.ok) { setError("保存に失敗しました"); setLoading(false); return }
    resetForm(); setLoading(false); fetchProjects()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("この案件を削除しますか？")) return
    await fetch(`/api/dev/projects/${id}`, { method: "DELETE" })
    fetchProjects()
  }

  const handleExport = async () => {
    const zip = new JSZip()
    const projectRows = projects.map((p) => [
      p.id, p.title, p.status, p.description ?? "",
      p.expectedOrderDate ? p.expectedOrderDate.slice(0, 10) : "",
      p.notes ?? "", p.primaryCompanyId ?? "", p.primaryCompany?.name ?? "",
      p.estimatedAmount != null ? String(p.estimatedAmount) : "",
      p.orderedAmount != null ? String(p.orderedAmount) : "",
    ])
    zip.file("projects.csv", "\uFEFF" + toCsv(
      ["id", "title", "status", "description", "expectedOrderDate", "notes",
       "primaryCompanyId", "primaryCompanyName", "estimatedAmount", "orderedAmount"],
      projectRows
    ))
    const companyRows: string[][] = []
    for (const p of projects) {
      for (const c of p.companies) {
        companyRows.push([p.id, p.title, c.company.id, c.company.name])
      }
    }
    zip.file("project_companies.csv", "\uFEFF" + toCsv(
      ["projectId", "projectTitle", "companyId", "companyName"],
      companyRows
    ))
    const assigneeRows: string[][] = []
    for (const p of projects) {
      for (const a of p.assignees ?? []) {
        assigneeRows.push([p.id, p.title, a.user.id, a.user.name])
      }
    }
    zip.file("project_assignees.csv", "\uFEFF" + toCsv(
      ["projectId", "projectTitle", "userId", "userName"],
      assigneeRows
    ))
    const fileRes = await fetch("/api/dev/projects/export-files")
    const fileData: {
      projectId: string; projectTitle: string; id: string
      fileName: string; fileKey: string; fileSize: number; mimeType: string; comment: string
    }[] = fileRes.ok ? await fileRes.json() : []
    zip.file("project_files.csv", "\uFEFF" + toCsv(
      ["projectId", "projectTitle", "id", "fileName", "fileKey", "fileSize", "mimeType", "comment"],
      fileData.map((f) => [f.projectId, f.projectTitle, f.id, f.fileName, f.fileKey, String(f.fileSize), f.mimeType, f.comment ?? ""])
    ))
    const blob = await zip.generateAsync({ type: "blob" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "projects.zip"; a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportMessage("")
    try {
      const zip = await JSZip.loadAsync(file)
      const projectFile = zip.file("projects.csv")
      if (!projectFile) { setImportMessage("エラー: projects.csvが見つかりません"); return }
      const projectsData = parseCsv(await projectFile.async("text"))
      const companyFile = zip.file("project_companies.csv")
      const companiesData = companyFile ? parseCsv(await companyFile.async("text")) : []
      const assigneeFile = zip.file("project_assignees.csv")
      const assigneesData = assigneeFile ? parseCsv(await assigneeFile.async("text")) : []
      const filesFile = zip.file("project_files.csv")
      const filesData = filesFile ? parseCsv(await filesFile.async("text")) : []
      const res = await fetch("/api/dev/projects/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects: projectsData, companies: companiesData, assignees: assigneesData, files: filesData }),
      })
      const data = await res.json()
      if (res.ok) { setImportMessage(data.message); fetchProjects() }
      else { setImportMessage(`エラー: ${data.error}`) }
    } catch {
      setImportMessage("エラー: ZIPファイルの読み込みに失敗しました")
    }
    e.target.value = ""
  }

  const companyOptions = allCompanies.map((c) => ({ id: c.id, label: c.name }))
  const filtered = projects.filter((p) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      p.title.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q) ||
      (p.primaryCompany?.name ?? "").toLowerCase().includes(q) ||
      (p.description ?? "").toLowerCase().includes(q) ||
      (p.notes ?? "").toLowerCase().includes(q) ||
      p.companies.some((c) => c.company.name.toLowerCase().includes(q)) ||
      (p.assignees ?? []).some((a) => a.user.name.toLowerCase().includes(q)) ||
      (p.estimatedAmount ? String(p.estimatedAmount) : "").includes(q) ||
      (p.orderedAmount ? String(p.orderedAmount) : "").includes(q)
    )
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">案件管理</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>CSVエクスポート</Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>CSVインポート</Button>
          <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={handleImport} />
          <Button onClick={() => { resetForm(); setShowForm(!showForm) }}>
            {showForm ? "キャンセル" : "新規登録"}
          </Button>
        </div>
      </div>
      {importMessage && (
        <p className={`mb-4 text-sm px-4 py-2 rounded ${importMessage.startsWith("エラー") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
          {importMessage}
        </p>
      )}
      {showForm && (
        <Card className="mb-8">
          <CardHeader><CardTitle>{editProject ? "案件編集" : "案件登録"}</CardTitle></CardHeader>
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
                <SingleSelectModal label="主担当会社" options={companyOptions} value={primaryCompanyId} onChange={setPrimaryCompanyId} placeholder="会社を選択..." />
              </div>
              <div className="space-y-2">
                <Label>受注予定日</Label>
                <Input type="date" value={expectedOrderDate} onChange={(e) => setExpectedOrderDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>関連会社（複数選択可）</Label>
              <MultiSelectModal label="関連会社" options={companyOptions} values={selectedCompanyIds} onChange={setSelectedCompanyIds} placeholder="会社を選択..." />
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
            {editProject && <ProjectFiles projectId={editProject.id} mode="edit" />}
            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? "処理中..." : editProject ? "更新する" : "登録する"}
            </Button>
          </CardContent>
        </Card>
      )}
      <div className="mb-4">
        <Input
          placeholder="案件名・ステータス・会社名・担当者・内容・備考で検索..."
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
                    <a href={`/dashboard/dev/projects/${project.id}`} className="font-bold hover:underline text-blue-700">{project.title}</a>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(project.status)}`}>{project.status}</span>
                  </div>
                  {project.primaryCompany && <p className="text-sm text-gray-500">主担当: {project.primaryCompany.name}</p>}
                  {project.companies.length > 0 && <p className="text-sm text-gray-500">関連会社: {project.companies.map((c) => c.company.name).join("、")}</p>}
                  {project.expectedOrderDate && <p className="text-sm text-gray-500">受注予定: {new Date(project.expectedOrderDate).toLocaleDateString("ja-JP")}</p>}
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
          <p className="text-center text-gray-500">{searchQuery ? "検索結果がありません" : "案件が登録されていません"}</p>
        )}
      </div>
    </div>
  )
}
