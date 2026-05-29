"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X } from "lucide-react"

const GENRE_OPTIONS = ["CD", "BD", "DVD", "その他"]
const SPEC_OPTIONS = ["紙ジャケ", "トレー仕様", "12cmCD", "化粧紙", "その他"]
const HINMOKU_OPTIONS = ["ハコ", "オビ", "ラベル", "スペーサー", "E式ジャケット", "デジ本体", "その他"]

type TypeCondition = { id: number; genre: string | null; spec: string | null; hinmoku: string | null; tag1: string | null; tag2: string | null }

export default function NewDielinePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [genre, setGenre] = useState("")
  const [spec, setSpec] = useState("")
  const [hinmoku, setHinmoku] = useState("")
  const [kyugataban, setKyugataban] = useState("")
  const [developy, setDevelopy] = useState("")
  const [developx, setDevelopx] = useState("")
  const [developDepth, setDevelopDepth] = useState("")
  const [sizey, setSizey] = useState("")
  const [sizex, setSizex] = useState("")
  const [widthy, setWidthy] = useState("")
  const [innerHeight, setInnerHeight] = useState("")
  const [innerWidth, setInnerWidth] = useState("")
  const [innerDepth, setInnerDepth] = useState("")
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [typeConditions, setTypeConditions] = useState<TypeCondition[]>([])
  const [showAllConditions, setShowAllConditions] = useState(false)

  useEffect(() => {
    fetch("/api/dlms/type-conditions").then(r => r.json()).then(setTypeConditions)
  }, [])

  const toggleCondition = (name: string) => {
    setSelectedConditions(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    )
  }

  // ジャンル・仕様・品目に応じて絞り込み
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

  const handleSubmit = async () => {
    setLoading(true)
    setError("")
    const res = await fetch("/api/dlms/dielines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        genre: genre || null, spec: spec || null, hinmoku: hinmoku || null,
        kyugataban: kyugataban || null,
        developy: developy ? parseFloat(developy) : null,
        developx: developx ? parseFloat(developx) : null,
        develop_depth: developDepth ? parseFloat(developDepth) : null,
        sizey: sizey ? parseFloat(sizey) : null,
        sizex: sizex ? parseFloat(sizex) : null,
        widthy: widthy ? parseFloat(widthy) : null,
        inner_height: innerHeight ? parseFloat(innerHeight) : null,
        inner_width: innerWidth ? parseFloat(innerWidth) : null,
        inner_depth: innerDepth ? parseFloat(innerDepth) : null,
        conditions: selectedConditions,
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
            <div>
              <Label className="text-sm text-gray-500 mb-2 block">展開サイズ（mm）</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label className="text-xs">天地</Label>
                  <Input type="number" value={developy} onChange={e => setDevelopy(e.target.value)} autoComplete="off" /></div>
                <div className="space-y-2"><Label className="text-xs">左右</Label>
                  <Input type="number" value={developx} onChange={e => setDevelopx(e.target.value)} autoComplete="off" /></div>
                <div className="space-y-2"><Label className="text-xs">背</Label>
                  <Input type="number" value={developDepth} onChange={e => setDevelopDepth(e.target.value)} autoComplete="off" /></div>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-500 mb-2 block">仕上サイズ（外寸）（mm）</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label className="text-xs">背</Label>
                  <Input type="number" value={sizey} onChange={e => setSizey(e.target.value)} autoComplete="off" /></div>
                <div className="space-y-2"><Label className="text-xs">高さ</Label>
                  <Input type="number" value={sizex} onChange={e => setSizex(e.target.value)} autoComplete="off" /></div>
                <div className="space-y-2"><Label className="text-xs">奥行き</Label>
                  <Input type="number" value={widthy} onChange={e => setWidthy(e.target.value)} autoComplete="off" /></div>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-500 mb-2 block">内寸（mm）</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label className="text-xs">背</Label>
                  <Input type="number" value={innerHeight} onChange={e => setInnerHeight(e.target.value)} autoComplete="off" /></div>
                <div className="space-y-2"><Label className="text-xs">高さ</Label>
                  <Input type="number" value={innerWidth} onChange={e => setInnerWidth(e.target.value)} autoComplete="off" /></div>
                <div className="space-y-2"><Label className="text-xs">奥行き</Label>
                  <Input type="number" value={innerDepth} onChange={e => setInnerDepth(e.target.value)} autoComplete="off" /></div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                <p className="text-sm text-gray-400">条件候補がありません。ジャンル・仕様・品目を選択するか、全件表示してください。</p>
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
              {/* 手入力 */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="手入力で追加"
                  autoComplete="off"
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
                      <button onClick={() => toggleCondition(c)} className="hover:text-blue-900">
                        <X className="w-3 h-3" />
                      </button>
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
