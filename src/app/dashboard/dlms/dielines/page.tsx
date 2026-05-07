"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Search } from "lucide-react"

const GENRE_OPTIONS = ["CD", "BD", "DVD", "その他"]
const SPEC_OPTIONS = ["紙ジャケ", "トレー仕様", "12cmCD", "化粧紙", "その他"]
const HINMOKU_OPTIONS = ["ハコ", "オビ", "ラベル", "スペーサー", "E式ジャケット", "デジ本体", "その他"]

type Condition = { id: string; value: string }
type Child = { id: string; edaban: string; han: string | null; me: string | null; kiri: string | null; men: string | null; sizey: number | null; sizex: number | null; location: string | null }
type Parent = {
  id: string; uid_ntemp: string; kyugataban: string | null
  genre: string | null; spec: string | null; hinmoku: string | null
  sizey: number | null; sizex: number | null; widthy: number | null
  conditions: Condition[]; children: Child[]
}

export default function DielinesPage() {
  const router = useRouter()
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [genre, setGenre] = useState("")
  const [spec, setSpec] = useState("")
  const [hinmoku, setHinmoku] = useState("")
  const [condition, setCondition] = useState("")

  const fetchParents = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (genre) params.set("genre", genre)
    if (spec) params.set("spec", spec)
    if (hinmoku) params.set("hinmoku", hinmoku)
    if (condition) params.set("condition", condition)
    if (keyword) params.set("keyword", keyword)
    const res = await fetch(`/api/dlms/dielines?${params.toString()}`)
    const data = await res.json()
    setParents(data)
    setLoading(false)
  }

  useEffect(() => { fetchParents() }, [])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("この型台帳を削除しますか？")) return
    await fetch(`/api/dlms/dielines/${id}`, { method: "DELETE" })
    fetchParents()
  }

  const handleExport = () => {
    const rows = [["型番号", "旧型番号", "ジャンル", "仕様", "品目", "展開たて", "展開よこ", "天地", "左右", "背幅", "条件1", "条件2", "条件3", "条件4"]]
    parents.forEach(p => {
      const conds = p.conditions.map(c => c.value)
      while (conds.length < 4) conds.push("")
      rows.push([
        p.uid_ntemp, p.kyugataban ?? "", p.genre ?? "", p.spec ?? "", p.hinmoku ?? "",
        "", "", p.sizey?.toString() ?? "", p.sizex?.toString() ?? "", p.widthy?.toString() ?? "",
        conds[0], conds[1], conds[2], conds[3],
      ])
    })
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "抜き型台帳.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">抜き型管理</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="flex items-center gap-1">
            <Download className="w-4 h-4" />CSVエクスポート
          </Button>
          <Button onClick={() => router.push("/dashboard/dlms/dielines/new")}>新規登録</Button>
        </div>
      </div>

      {/* 検索 */}
      <div className="bg-white border rounded-lg p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-3">
          <Input value={keyword} onChange={e => setKeyword(e.target.value)}
            placeholder="型番号・旧型番" className="h-8 text-sm" />
          <select value={genre} onChange={e => setGenre(e.target.value)}
            className="h-8 border rounded px-2 text-sm bg-white">
            <option value="">ジャンル：すべて</option>
            {GENRE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={spec} onChange={e => setSpec(e.target.value)}
            className="h-8 border rounded px-2 text-sm bg-white">
            <option value="">仕様：すべて</option>
            {SPEC_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={hinmoku} onChange={e => setHinmoku(e.target.value)}
            className="h-8 border rounded px-2 text-sm bg-white">
            <option value="">品目：すべて</option>
            {HINMOKU_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <Input value={condition} onChange={e => setCondition(e.target.value)}
            placeholder="条件" className="h-8 text-sm" />
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={fetchParents} className="flex items-center gap-1">
            <Search className="w-3 h-3" />検索
          </Button>
        </div>
      </div>

      {/* 一覧 */}
      {loading ? (
        <p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p>
      ) : parents.length === 0 ? (
        <p className="text-center text-gray-500 py-8">データがありません</p>
      ) : (
        <div className="space-y-3">
          {parents.map(p => (
            <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/dashboard/dlms/dielines/${p.id}`)}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-bold text-lg text-gray-800">{p.uid_ntemp}</span>
                      {p.kyugataban && <span className="text-sm text-gray-400">旧：{p.kyugataban}</span>}
                      {[p.genre, p.spec, p.hinmoku].filter(Boolean).map((v, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{v}</span>
                      ))}
                    </div>
                    <div className="flex gap-4 text-sm text-gray-500 flex-wrap">
                      {p.sizey && p.sizex && <span>天地×左右：{p.sizey}×{p.sizex}mm</span>}
                      {p.widthy && <span>背幅：{p.widthy}mm</span>}
                      <span>枝番：{p.children.length}件</span>
                    </div>
                    {p.conditions.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {p.conditions.map(c => (
                          <span key={c.id} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{c.value}</span>
                        ))}
                      </div>
                    )}
                    {p.children.length > 0 && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {p.children.map(c => (
                          <span key={c.id} className="text-xs border border-gray-200 text-gray-500 px-2 py-0.5 rounded">
                            {p.uid_ntemp}-{c.edaban} {[c.han, c.me, c.kiri, c.men].filter(Boolean).join("/")}
                            {c.location && ` [${c.location}]`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4" onClick={e => e.stopPropagation()}>
                    <Button variant="outline" size="sm"
                      onClick={() => router.push(`/dashboard/dlms/dielines/${p.id}`)}>詳細</Button>
                    <Button variant="destructive" size="sm"
                      onClick={e => handleDelete(p.id, e)}>削除</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
