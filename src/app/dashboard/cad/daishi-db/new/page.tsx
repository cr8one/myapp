"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, X } from "lucide-react"

export default function DaishiDbNewPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [remarks, setRemarks] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput("")
  }

  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t))

  const handleSubmit = async () => {
    setSaving(true)
    const res = await fetch("/api/cad/daishi-db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remarks, tags }),
    })
    if (res.ok) {
      const data = await res.json()
      router.push(`/dashboard/cad/daishi-db/${data.id}`)
    } else {
      alert("登録に失敗しました")
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>← 戻る</Button>
        <h1 className="text-2xl font-bold">DXF・台紙DB 新規登録</h1>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">備考</label>
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm resize-none"
              rows={3}
              autoComplete="off"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">タグ</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag() } }}
                placeholder="タグを入力してEnter"
                className="flex-1 border rounded px-3 py-2 text-sm"
                autoComplete="off"
              />
              <Button variant="outline" size="sm" onClick={addTag}><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  {t}
                  <button onClick={() => removeTag(t)} className="text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-400">※ファイルのアップロードは登録後の詳細画面から行えます</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => router.back()}>キャンセル</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? "登録中..." : "登録する"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
