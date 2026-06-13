"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Plus, Trash2 } from "lucide-react"

const GENRE_OPTIONS = ["CD", "BD", "DVD", "その他"]
const SPEC_OPTIONS = ["紙ジャケ", "トレー仕様", "12cmCD", "化粧紙", "その他"]
const HINMOKU_OPTIONS = ["ハコ", "オビ", "ラベル", "スペーサー", "E式ジャケット", "デジ本体", "その他"]

type TypeCondition = { id: number; genre: string | null; spec: string | null; hinmoku: string | null; tag1: string | null; tag2: string | null }
type PartForm = { part_name: string; developy: string; developx: string; develop_depths: string[]; sizey: string; sizex: string; widthy: string; inner_height: string; inner_width: string; inner_depth: string }

const emptyPart = (): PartForm => ({
  part_name: "", developy: "", developx: "", develop_depths: [],
  sizey: "", sizex: "", widthy: "",
  inner_height: "", inner_width: "", inner_depth: "",
})

export default function NewDielinePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [genre, setGenre] = useState("")
  const [spec, setSpec] = useState("")
  const [hinmoku, setHinmoku] = useState("")
  const [kyugataban, setKyugataban] = useState("")
  const [parts, setParts] = useState<PartForm[]>([emptyPart()])
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [typeConditions, setTypeConditions] = useState<TypeCondition[]>([])
  const [showAllConditions, setShowAllConditions] = useState(false)

  useEffect(() => {
    fetch("/api/dlms/type-conditions?all=true").then(r => r.json()).then(d => setTypeConditions(d.records ?? []))
  }, [])

  const toggleCondition = (name: string) => {
    setSelectedConditions(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    )
  }

  const filtered = typeConditions.filter(tc =>
    (!genre || tc.genre === genre) &&
    (!spec || tc.spec === spec) &&
    (!hinmoku || tc.hinmoku === hinmoku)
  )
  const filteredTags = [...new Set([
    ...filtered.map(tc => tc.tag1).filter(Boolean),
    ...filtered.map(tc => tc.tag2).filter(Boolean),
  ])] as string[]
  const allTags = [...new Set([
    ...typeConditions.map(tc => tc.tag1).filter(Boolean),
    ...typeConditions.map(tc => tc.tag2).filter(Boolean),
  ])] as string[]
  const displayTags = showAllConditions ? allTags : filteredTags

  const setPart = (index: number, key: keyof PartForm, value: string) => {
    setParts(prev => prev.map((p, i) => i === index ? { ...p, [key]: value } : p))
  }
  const addDepth = (index: number) => setParts(prev => prev.map((p, i) => i === index ? { ...p, develop_depths: [...p.develop_depths, ""] } : p))
  const setDepth = (index: number, depthIndex: number, value: string) => setParts(prev => prev.map((p, i) => i === index ? { ...p, develop_depths: p.develop_depths.map((d, di) => di === depthIndex ? value : d) } : p))
  const removeDepth = (index: number, depthIndex: number) => setParts(prev => prev.map((p, i) => i === index ? { ...p, develop_depths: p.develop_depths.filter((_, di) => di !== depthIndex) } : p))
  const addPart = () => setParts(prev => [...prev, emptyPart()])
  const removePart = (index: number) => setParts(prev => prev.filter((_, i) => i !== index))

  const handleSubmit = async () => {
    setLoading(true)
    setError("")
    const res = await fetch("/api/dlms/dielines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        genre: genre || null, spec: spec || null, hinmoku: hinmoku || null,
        kyugataban: kyugataban || null,
        conditions: selectedConditions,
        parts: parts.map(p => ({
          part_name: p.part_name || null,
          developy: p.developy || null,
          developx: p.developx || null,
          develop_depths: p.develop_depths.filter(d => d && !isNaN(parseFloat(d))),
          sizey: p.sizey || null,
          sizex: p.sizex || null,
          widthy: p.widthy || null,
          inner_height: p.inner_height || null,
          inner_width: p.inner_width || null,
          inner_depth: p.inner_depth || null,
        })),
      }),
    })
    if (!res.ok) { setError("登録に失敗しました"); setLoading(false); return }
    const data = await res.json()
    router.push(`/dashboard/dlms/dielines/${data.id}`)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>← 戻る</Button>
        <h1 className="text-2xl font-bold">型台帳 新規登録</h1>
      </div>
      <div className="space-y-6">
        {/* 基本情報 */}
        <Card>
          <CardHeader><CardTitle>基本情報</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>ジャンル</Label>
                <select value={genre} onChange={e => { setGenre(e.target.value); setShowAllConditions(false) }}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                  <option value="">未選択</option>
                  {GENRE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>仕様</Label>
                <select value={spec} onChange={e => { setSpec(e.target.value); setShowAllConditions(false) }}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                  <option value="">未選択</option>
                  {SPEC_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>品目</Label>
                <select value={hinmoku} onChange={e => { setHinmoku(e.target.value); setShowAllConditions(false) }}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                  <option value="">未選択</option>
                  {HINMOKU_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>旧型番号</Label>
              <Input value={kyugataban} onChange={e => setKyugataban(e.target.value)} autoComplete="off" className="max-w-xs" />
            </div>
          </CardContent>
        </Card>

        {/* パーツ情報 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>パーツ情報</CardTitle>
              <Button variant="outline" size="sm" onClick={addPart}>
                <Plus className="w-4 h-4 mr-1" /> パーツ追加
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {parts.map((part, index) => (
              <div key={index} className={`space-y-4 ${parts.length > 1 ? "p-4 border rounded-xl" : ""}`}>
                {parts.length > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-600">パーツ {index + 1}</span>
                      <Input
                        value={part.part_name}
                        onChange={e => setPart(index, "part_name", e.target.value)}
                        placeholder="パーツ名（例：身、蓋）"
                        autoComplete="off"
                        className="h-8 text-sm w-40"
                      />
                    </div>
                    {parts.length > 1 && (
                      <button onClick={() => removePart(index)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
                <div>
                  <Label className="text-sm text-gray-500 mb-2 block">展開サイズ（mm）</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label className="text-xs">天地</Label>
                      <Input type="number" value={part.developy} onChange={e => setPart(index, "developy", e.target.value)} autoComplete="off" /></div>
                    <div className="space-y-2"><Label className="text-xs">左右</Label>
                      <Input type="number" value={part.developx} onChange={e => setPart(index, "developx", e.target.value)} autoComplete="off" /></div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs">背</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => addDepth(index)} className="h-6 px-2 text-xs">
                        <Plus className="w-3 h-3 mr-1" />展開背を追加
                      </Button>
                    </div>
                    {part.develop_depths.length > 0 && (
                      <p className="text-xs text-orange-600 mb-2">※表 見開き 左側から</p>
                    )}
                    {part.develop_depths.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {part.develop_depths.map((d, di) => (
                          <div key={di} className="flex items-center gap-2">
                            <Input type="number" value={d} onChange={e => setDepth(index, di, e.target.value)} autoComplete="off" placeholder={`背${di + 1}`} className="text-sm" />
                            <button type="button" onClick={() => removeDepth(index, di)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-500 mb-2 block">仕上サイズ（外寸）（mm）</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label className="text-xs">背</Label>
                      <Input type="number" value={part.sizey} onChange={e => setPart(index, "sizey", e.target.value)} autoComplete="off" /></div>
                    <div className="space-y-2"><Label className="text-xs">高さ</Label>
                      <Input type="number" value={part.sizex} onChange={e => setPart(index, "sizex", e.target.value)} autoComplete="off" /></div>
                    <div className="space-y-2"><Label className="text-xs">奥行き</Label>
                      <Input type="number" value={part.widthy} onChange={e => setPart(index, "widthy", e.target.value)} autoComplete="off" /></div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-500 mb-2 block">内寸（mm）</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label className="text-xs">背</Label>
                      <Input type="number" value={part.inner_height} onChange={e => setPart(index, "inner_height", e.target.value)} autoComplete="off" /></div>
                    <div className="space-y-2"><Label className="text-xs">高さ</Label>
                      <Input type="number" value={part.inner_width} onChange={e => setPart(index, "inner_width", e.target.value)} autoComplete="off" /></div>
                    <div className="space-y-2"><Label className="text-xs">奥行き</Label>
                      <Input type="number" value={part.inner_depth} onChange={e => setPart(index, "inner_depth", e.target.value)} autoComplete="off" /></div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 条件 */}
        <Card>
          <CardHeader><CardTitle>条件</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-400">
                  {filteredTags.length > 0 ? `${genre || ""}${spec || ""}${hinmoku || ""}に対応する候補` : "全条件"}
                </span>
                <button type="button" onClick={() => setShowAllConditions(v => !v)}
                  className="text-xs text-blue-500 hover:text-blue-700 underline">
                  {showAllConditions ? "絞り込む" : "全件表示"}
                </button>
              </div>
              {displayTags.length === 0 ? (
                <p className="text-sm text-gray-400">条件候補がありません。</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {displayTags.map(tag => (
                    <button key={tag} type="button" onClick={() => toggleCondition(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        selectedConditions.includes(tag)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600"
                      }`}>
                      {tag}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <input type="text" placeholder="手入力で追加" autoComplete="off"
                  className="px-2 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value.trim()
                      if (val) { toggleCondition(val); (e.target as HTMLInputElement).value = "" }
                    }
                  }}
                />
                <span className="text-xs text-gray-400">Enterで追加</span>
              </div>
              {selectedConditions.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2 border-t">
                  <span className="text-xs text-gray-400 mr-1 self-center">選択中：</span>
                  {selectedConditions.map(c => (
                    <span key={c} className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {c}
                      <button onClick={() => toggleCondition(c)} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? "登録中..." : "登録する"}
        </Button>
      </div>
    </div>
  )
}
