"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
type TargetYear = {
  id: string
  name: string
}
export default function DevTargetYearMastersPage() {
  const [years, setYears] = useState<TargetYear[]>([])
  const [fetching, setFetching] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<TargetYear | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [name, setName] = useState("")
  const fetchYears = async () => {
    setFetching(true)
    const res = await fetch("/api/dev/target-year-masters")
    const data = await res.json()
    setYears(data)
    setFetching(false)
  }
  useEffect(() => { fetchYears() }, [])
  const resetForm = () => {
    setName(""); setError(""); setEditTarget(null); setShowForm(false)
  }
  const handleEdit = (year: TargetYear) => {
    setEditTarget(year)
    setName(year.name)
    setError("")
    setShowForm(true)
  }
  const handleSubmit = async () => {
    if (!name.trim()) { setError("年度名は必須です"); return }
    setLoading(true); setError("")
    const body = { name }
    const res = editTarget
      ? await fetch(`/api/dev/target-year-masters/${editTarget.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/dev/target-year-masters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? "保存に失敗しました"); setLoading(false); return
    }
    resetForm(); setLoading(false); fetchYears()
  }
  const handleDelete = async (id: string) => {
    if (!confirm("この年度を削除しますか？\n※この年度を設定している会社からも外れます")) return
    await fetch(`/api/dev/target-year-masters/${id}`, { method: "DELETE" })
    fetchYears()
  }
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex flex-wrap gap-2 justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">対象年度管理</h1>
        <Button onClick={() => { resetForm(); setShowForm(!showForm) }}>
          {showForm ? "キャンセル" : "新規追加"}
        </Button>
      </div>
      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle>{editTarget ? "年度編集" : "年度追加"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>年度名 *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例：2027年度" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? "処理中..." : editTarget ? "更新する" : "追加する"}
            </Button>
          </CardContent>
        </Card>
      )}
      {fetching ? (
        <p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p>
      ) : years.length === 0 ? (
        <p className="text-center text-gray-500 py-8">年度が登録されていません</p>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col style={{ width: "60%" }} />
              <col style={{ width: "40%" }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-50 border-b text-xs text-gray-500">
                <th className="px-3 py-2 text-left font-medium">年度名</th>
                <th className="px-3 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {years.map((year) => (
                <tr key={year.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-800">{year.name}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(year)}>編集</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(year.id)}>削除</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
