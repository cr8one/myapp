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

type ConditionMaster = { id: number; name: string }

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
  const [sizey, setSizey] = useState("")
  const [sizex, setSizex] = useState("")
  const [widthy, setWidthy] = useState("")
  const [innerHeight, setInnerHeight] = useState("")
  const [innerWidth, setInnerWidth] = useState("")
  const [innerDepth, setInnerDepth] = useState("")
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [conditionMasters, setConditionMasters] = useState<ConditionMaster[]>([])

  useEffect(() => {
    fetch("/api/dlms/conditions").then(r => r.json()).then(setConditionMasters)
  }, [])

  const toggleCondition = (name: string) => {
    setSelectedConditions(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    )
  }

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
                <select value={genre} onChange={e => setGenre(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                  <option value="">未選択</option>
                  {GENRE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>仕様</Label>
                <select value={spec} onChange={e => setSpec(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                  <option value="">未選択</option>
                  {SPEC_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>品目</Label>
                <select value={hinmoku} onChange={e => setHinmoku(e.target.value)}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-xs">たて</Label>
                  <Input type="number" value={developy} onChange={e => setDevelopy(e.target.value)} autoComplete="off" /></div>
                <div className="space-y-2"><Label className="text-xs">よこ</Label>
                  <Input type="number" value={developx} onChange={e => setDevelopx(e.target.value)} autoComplete="off" /></div>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-500 mb-2 block">仕上サイズ（外寸）（mm）</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label className="text-xs">天地</Label>
                  <Input type="number" value={sizey} onChange={e => setSizey(e.target.value)} autoComplete="off" /></div>
                <div className="space-y-2"><Label className="text-xs">左右</Label>
                  <Input type="number" value={sizex} onChange={e => setSizex(e.target.value)} autoComplete="off" /></div>
                <div className="space-y-2"><Label className="text-xs">背幅</Label>
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
            {conditionMasters.length === 0 ? (
              <p className="text-sm text-gray-400">条件マスタが登録されていません。DLMSマスタ管理から追加してください。</p>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {conditionMasters.map(c => (
                    <button key={c.id} type="button" onClick={() => toggleCondition(c.name)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        selectedConditions.includes(c.name)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600"
                      }`}>
                      {c.name}
                    </button>
                  ))}
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
            )}
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
