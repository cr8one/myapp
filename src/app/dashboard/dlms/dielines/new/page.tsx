"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const GENRE_OPTIONS = ["CD", "BD", "DVD", "その他"]
const SPEC_OPTIONS = ["紙ジャケ", "トレー仕様", "12cmCD", "化粧紙", "その他"]
const HINMOKU_OPTIONS = ["ハコ", "オビ", "ラベル", "スペーサー", "E式ジャケット", "デジ本体", "その他"]

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
  const [conditions, setConditions] = useState(["", "", "", ""])

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
        conditions: conditions.filter(c => c.trim() !== ""),
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
                  <Input type="number" value={developy} onChange={e => setDevelopy(e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-xs">よこ</Label>
                  <Input type="number" value={developx} onChange={e => setDevelopx(e.target.value)} /></div>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-500 mb-2 block">仕上サイズ（mm）</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label className="text-xs">天地</Label>
                  <Input type="number" value={sizey} onChange={e => setSizey(e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-xs">左右</Label>
                  <Input type="number" value={sizex} onChange={e => setSizex(e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-xs">背幅</Label>
                  <Input type="number" value={widthy} onChange={e => setWidthy(e.target.value)} /></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>条件（最大4件）</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {conditions.map((c, i) => (
                <div key={i} className="space-y-1">
                  <Label className="text-xs">条件{i + 1}</Label>
                  <Input value={c} onChange={e => {
                    const conds = [...conditions]; conds[i] = e.target.value; setConditions(conds)
                  }} autoComplete="off" />
                </div>
              ))}
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
