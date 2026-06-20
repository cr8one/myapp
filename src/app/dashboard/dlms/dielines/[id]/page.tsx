"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pencil, Plus, Trash2, X, FileText, Info } from "lucide-react"

const GENRE_OPTIONS = ["CD", "BD", "DVD", "その他"]
const SPEC_OPTIONS = ["紙ジャケ", "トレー仕様", "12cmCD", "化粧紙", "その他"]
const HINMOKU_OPTIONS = ["ハコ", "オビ", "ラベル", "スペーサー", "E式ジャケット", "デジ本体", "その他"]
const LOCATION_OPTIONS = ["J 1", "島田PC", "島田ダイマト", "本社", "東京ユニオン", "イシイ埼玉", "パックウェル"]
const HAN_OPTIONS = ["4/6", "菊", "A", "B", "特", "K", "L", "ハトロン"]
const EDABAN_OPTIONS = ["01", "02", "03", "04", "11", "21"]
const EDABAN_NOTES: Record<string, string> = {
  "01": "四六半以上",
  "02": "A/菊/K半",
  "03": "3切・4切",
  "04": "くるみ中芯",
  "11": "ダイマト専用型（現在ほぼ使用してません）",
  "21": "UVクリア反転用型",
}
const ME_OPTIONS = ["Y", "T"]
const KIRI_OPTIONS = ["1", "2", "3", "4", "長6", "角6", "8"]
const MEN_OPTIONS = Array.from({ length: 18 }, (_, i) => String(i + 1))

type TypeCondition = { id: number; genre: string | null; spec: string | null; hinmoku: string | null; tag1: string | null; tag2: string | null }
type Condition = { id: string; value: string; sortOrder: number }
type Request = { id: string; request_no: string; haichi_kakunin: string; dtindt: string }
type Child = {
  id: string; edaban: string; han: string | null; me: string | null
  kiri: string | null; men: string | null; sizey: number | null
  sizex: number | null; 咥え: number | null; location: string | null
  requests: Request[]
}
type Part = {
  id: string; part_name: string | null
  developy: number | null; developx: number | null; develop_depths: number[]
  sizey: number | null; sizex: number | null; widthy: number | null
  inner_height: number | null; inner_width: number | null; inner_depth: number | null
  sort_order: number
}
type Parent = {
  id: string; uid_ntemp: string; kyugataban: string | null
  genre: string | null; spec: string | null; hinmoku: string | null
  conditions: Condition[]; children: Child[]; parts: Part[]
}
type ChildForm = { edaban: string; han: string; me: string; kiri: string; men: string; sizey: string; sizex: string; 咥え: string; location: string }
type PartForm = { part_name: string; developy: string; developx: string; develop_depths: string[]; sizey: string; sizex: string; widthy: string; inner_height: string; inner_width: string; inner_depth: string }

const fmt = (v: number | null) => v === null ? "—" : Number.isInteger(v) ? v.toFixed(1) : String(v)
const emptyChildForm: ChildForm = { edaban: "", han: "", me: "", kiri: "", men: "", sizey: "", sizex: "", 咥え: "", location: "" }
const emptyPartForm = (): PartForm => ({ part_name: "", developy: "", developx: "", develop_depths: [], sizey: "", sizex: "", widthy: "", inner_height: "", inner_width: "", inner_depth: "" })

function PartSizeEdit({ part, index, partsLength, setPart, removePart, addDepth, setDepth, removeDepth }: { part: PartForm; index: number; partsLength: number; setPart: (index: number, key: keyof PartForm, value: string) => void; removePart: (index: number) => void; addDepth: (index: number) => void; setDepth: (index: number, depthIndex: number, value: string) => void; removeDepth: (index: number, depthIndex: number) => void }) {
  return (
    <div className="space-y-3">
      {partsLength > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">パーツ {index + 1}</span>
            <Input value={part.part_name} onChange={e => setPart(index, "part_name", e.target.value)} placeholder="パーツ名（例：身、蓋）" autoComplete="off" className="h-8 text-sm w-40" />
          </div>
          <button onClick={() => removePart(index)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
        </div>
      )}
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">展開サイズ（mm）</Label>
        <div className="grid grid-cols-3 gap-3">
          <div><Label className="text-xs">天地</Label><Input type="number" value={part.developy} onChange={e => setPart(index, "developy", e.target.value)} autoComplete="off" className="mt-1 h-8 text-sm" /></div>
          <div><Label className="text-xs">左右</Label><Input type="number" value={part.developx} onChange={e => setPart(index, "developx", e.target.value)} autoComplete="off" className="mt-1 h-8 text-sm" /></div>
        </div>
        <div className="mt-2">
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
                  <Input type="number" value={d} onChange={e => setDepth(index, di, e.target.value)} autoComplete="off" placeholder={`背${di + 1}`} className="mt-1 h-8 text-sm" />
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
        <Label className="text-xs text-gray-500 mb-1 block">仕上サイズ（外寸）（mm）</Label>
        <div className="grid grid-cols-3 gap-3">
          <div><Label className="text-xs">背</Label><Input type="number" value={part.sizey} onChange={e => setPart(index, "sizey", e.target.value)} autoComplete="off" className="mt-1 h-8 text-sm" /></div>
          <div><Label className="text-xs">高さ</Label><Input type="number" value={part.sizex} onChange={e => setPart(index, "sizex", e.target.value)} autoComplete="off" className="mt-1 h-8 text-sm" /></div>
          <div><Label className="text-xs">奥行き</Label><Input type="number" value={part.widthy} onChange={e => setPart(index, "widthy", e.target.value)} autoComplete="off" className="mt-1 h-8 text-sm" /></div>
        </div>
      </div>
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">内寸（mm）</Label>
        <div className="grid grid-cols-3 gap-3">
          <div><Label className="text-xs">背</Label><Input type="number" value={part.inner_height} onChange={e => setPart(index, "inner_height", e.target.value)} autoComplete="off" className="mt-1 h-8 text-sm" /></div>
          <div><Label className="text-xs">高さ</Label><Input type="number" value={part.inner_width} onChange={e => setPart(index, "inner_width", e.target.value)} autoComplete="off" className="mt-1 h-8 text-sm" /></div>
          <div><Label className="text-xs">奥行き</Label><Input type="number" value={part.inner_depth} onChange={e => setPart(index, "inner_depth", e.target.value)} autoComplete="off" className="mt-1 h-8 text-sm" /></div>
        </div>
      </div>
    </div>
  )
}

export default function DielineDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [parent, setParent] = useState<Parent | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [typeConditions, setTypeConditions] = useState<TypeCondition[]>([])
  const [showAllConditions, setShowAllConditions] = useState(false)
  const [genre, setGenre] = useState("")
  const [spec, setSpec] = useState("")
  const [hinmoku, setHinmoku] = useState("")
  const [kyugataban, setKyugataban] = useState("")
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [editParts, setEditParts] = useState<PartForm[]>([emptyPartForm()])
  const [childModalOpen, setChildModalOpen] = useState(false)
  const [editChild, setEditChild] = useState<Child | null>(null)
  const [childForm, setChildForm] = useState<ChildForm>(emptyChildForm)
  const [requestModalChild, setRequestModalChild] = useState<Child | null>(null)

  const fetchParent = async () => {
    const res = await fetch(`/api/dlms/dielines/${id}`)
    const data = await res.json()
    setParent(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchParent()
    fetch("/api/dlms/type-conditions?all=true").then(r => r.json()).then(d => setTypeConditions(d.records ?? []))
  }, [id])

  const toggleCondition = (name: string) => {
    setSelectedConditions(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    )
  }

  const startEdit = () => {
    if (!parent) return
    setGenre(parent.genre ?? "")
    setSpec(parent.spec ?? "")
    setHinmoku(parent.hinmoku ?? "")
    setKyugataban(parent.kyugataban ?? "")
    setSelectedConditions(parent.conditions.map(c => c.value))
    setEditParts(parent.parts.length > 0 ? parent.parts.map(p => ({
      part_name: p.part_name ?? "",
      developy: p.developy?.toString() ?? "",
      developx: p.developx?.toString() ?? "",
      develop_depths: p.develop_depths.map(d => d.toString()),
      sizey: p.sizey?.toString() ?? "",
      sizex: p.sizex?.toString() ?? "",
      widthy: p.widthy?.toString() ?? "",
      inner_height: p.inner_height?.toString() ?? "",
      inner_width: p.inner_width?.toString() ?? "",
      inner_depth: p.inner_depth?.toString() ?? "",
    })) : [emptyPartForm()])
    setEditing(true)
  }

  const setPart = (index: number, key: keyof PartForm, value: string) => {
    setEditParts(prev => prev.map((p, i) => i === index ? { ...p, [key]: value } : p))
  }
  const addDepth = (index: number) => setEditParts(prev => prev.map((p, i) => i === index ? { ...p, develop_depths: [...p.develop_depths, ""] } : p))
  const setDepth = (index: number, depthIndex: number, value: string) => setEditParts(prev => prev.map((p, i) => i === index ? { ...p, develop_depths: p.develop_depths.map((d, di) => di === depthIndex ? value : d) } : p))
  const removeDepth = (index: number, depthIndex: number) => setEditParts(prev => prev.map((p, i) => i === index ? { ...p, develop_depths: p.develop_depths.filter((_, di) => di !== depthIndex) } : p))

  const handleSaveParent = async () => {
    setSaving(true)
    await fetch(`/api/dlms/dielines/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        genre: genre || null, spec: spec || null, hinmoku: hinmoku || null,
        kyugataban: kyugataban || null,
        conditions: selectedConditions,
        parts: editParts.map(p => ({
          part_name: p.part_name || null,
          developy: p.developy || null, developx: p.developx || null, develop_depths: p.develop_depths.filter(d => d && !isNaN(parseFloat(d))),
          sizey: p.sizey || null, sizex: p.sizex || null, widthy: p.widthy || null,
          inner_height: p.inner_height || null, inner_width: p.inner_width || null, inner_depth: p.inner_depth || null,
        })),
      }),
    })
    setSaving(false)
    setEditing(false)
    fetchParent()
  }

  const openCreateChild = () => { setEditChild(null); setChildForm(emptyChildForm); setChildModalOpen(true) }
  const openEditChild = (c: Child) => {
    setEditChild(c)
    setChildForm({ edaban: c.edaban, han: c.han ?? "", me: c.me ?? "", kiri: c.kiri ?? "", men: c.men ?? "", sizey: c.sizey?.toString() ?? "", sizex: c.sizex?.toString() ?? "", 咥え: c.咥え?.toString() ?? "", location: c.location ?? "" })
    setChildModalOpen(true)
  }

  const handleSaveChild = async () => {
    setSaving(true)
    const payload = {
      edaban: childForm.edaban || null, han: childForm.han || null, me: childForm.me || null,
      kiri: childForm.kiri || null, men: childForm.men || null,
      sizey: childForm.sizey ? parseFloat(childForm.sizey) : null,
      sizex: childForm.sizex ? parseFloat(childForm.sizex) : null,
      咥え: childForm.咥え ? parseFloat(childForm.咥え) : null,
      location: childForm.location || null,
    }
    if (editChild) {
      await fetch(`/api/dlms/dielines/${id}/children/${editChild.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    } else {
      await fetch(`/api/dlms/dielines/${id}/children`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    }
    setSaving(false)
    setChildModalOpen(false)
    fetchParent()
  }

  const handleDeleteChild = async (childId: string) => {
    if (!confirm("この枝番を削除しますか？")) return
    await fetch(`/api/dlms/dielines/${id}/children/${childId}`, { method: "DELETE" })
    fetchParent()
  }

  const handleDeleteParent = async () => {
    if (!confirm("この型台帳を削除しますか？")) return
    await fetch(`/api/dlms/dielines/${id}`, { method: "DELETE" })
    router.push("/dashboard/dlms/dielines")
  }

  if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">読み込み中...</div>
  if (!parent) return <div className="p-8 text-center text-gray-500">データが見つかりません</div>

  const filtered = typeConditions.filter(tc => (!genre || tc.genre === genre) && (!spec || tc.spec === spec) && (!hinmoku || tc.hinmoku === hinmoku))
  const filteredTags = [...new Set([...filtered.map(tc => tc.tag1).filter(Boolean), ...filtered.map(tc => tc.tag2).filter(Boolean)])] as string[]
  const allTags = [...new Set([...typeConditions.map(tc => tc.tag1).filter(Boolean), ...typeConditions.map(tc => tc.tag2).filter(Boolean)])] as string[]
  const displayTags = showAllConditions ? allTags : filteredTags

  const PartSizeDisplay = ({ part }: { part: Part }) => (
    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm mt-2">
      <div><span className="text-gray-400 text-xs">展開サイズ</span><p className="mt-0.5">天地 {fmt(part.developy)} / 左右 {fmt(part.developx)} / 背 {part.develop_depths.length > 0 ? part.develop_depths.map(d => fmt(d)).join(", ") : "—"}</p></div>
      <div><span className="text-gray-400 text-xs">仕上サイズ 外寸</span><p className="mt-0.5">背 {fmt(part.sizey)} / 高さ {fmt(part.sizex)} / 奥行き {fmt(part.widthy)}</p></div>
      <div><span className="text-gray-400 text-xs">内寸</span><p className="mt-0.5">背 {fmt(part.inner_height)} / 高さ {fmt(part.inner_width)} / 奥行き {fmt(part.inner_depth)}</p></div>
    </div>
  )

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.push("/dashboard/dlms/dielines")}>← 戻る</Button>
        <h1 className="text-2xl font-bold">{parent.uid_ntemp}</h1>
        {!editing && (
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={startEdit} className="flex items-center gap-1"><Pencil className="w-4 h-4" />編集</Button>
            <Button variant="destructive" onClick={handleDeleteParent}>削除</Button>
          </div>
        )}
      </div>
      <div className="space-y-6">
        {/* 基本情報 */}
        <Card>
          <CardHeader><CardTitle>基本情報</CardTitle></CardHeader>
          <CardContent>
            {!editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div><span className="text-gray-400">旧型番号</span><p className="mt-0.5">{parent.kyugataban ?? "—"}</p></div>
                  <div><span className="text-gray-400">ジャンル</span><p className="mt-0.5">{parent.genre ?? "—"}</p></div>
                  <div><span className="text-gray-400">仕様</span><p className="mt-0.5">{parent.spec ?? "—"}</p></div>
                  <div><span className="text-gray-400">品目</span><p className="mt-0.5">{parent.hinmoku ?? "—"}</p></div>
                  {parent.conditions.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-gray-400">条件</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {parent.conditions.map(c => (
                          <span key={c.id} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{c.value}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* パーツ表示 */}
                {parent.parts.length === 0 ? (
                  <p className="text-sm text-gray-400">パーツ情報なし</p>
                ) : parent.parts.length === 1 ? (
                  <PartSizeDisplay part={parent.parts[0]} />
                ) : (
                  <div className="space-y-3 border-t pt-3">
                    <p className="text-xs font-medium text-orange-600">複数パーツあり</p>
                    {parent.parts.map((part, i) => (
                      <div key={part.id} className="border border-orange-100 rounded-lg p-3 bg-orange-50">
                        <p className="text-sm font-semibold text-orange-700 mb-1">パーツ {i + 1}{part.part_name ? `：${part.part_name}` : ""}</p>
                        <PartSizeDisplay part={part} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>ジャンル</Label>
                    <select value={genre} onChange={e => setGenre(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                      <option value="">未選択</option>{GENRE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2"><Label>仕様</Label>
                    <select value={spec} onChange={e => setSpec(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                      <option value="">未選択</option>{SPEC_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2"><Label>品目</Label>
                    <select value={hinmoku} onChange={e => setHinmoku(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                      <option value="">未選択</option>{HINMOKU_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2"><Label>旧型番号</Label>
                  <Input value={kyugataban} onChange={e => setKyugataban(e.target.value)} autoComplete="off" className="max-w-xs" />
                </div>
                {/* パーツ編集 */}
                <div className="border rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">パーツ情報</Label>
                    <Button variant="outline" size="sm" onClick={() => setEditParts(prev => [...prev, emptyPartForm()])}>
                      <Plus className="w-4 h-4 mr-1" />パーツ追加
                    </Button>
                  </div>
                  {editParts.map((part, index) => (
                    <div key={index} className={editParts.length > 1 ? "border border-orange-200 rounded-lg p-3 bg-orange-50" : ""}>
                      <PartSizeEdit part={part} index={index} partsLength={editParts.length} setPart={setPart} removePart={(i) => setEditParts(prev => prev.filter((_, idx) => idx !== i))} addDepth={addDepth} setDepth={setDepth} removeDepth={removeDepth} />
                    </div>
                  ))}
                </div>
                {/* 条件 */}
                <div>
                  <Label className="text-sm text-gray-500 mb-2 block">条件</Label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400">{filteredTags.length > 0 ? `${genre || ""}${spec || ""}${hinmoku || ""}に対応する候補` : "全条件"}</span>
                      <button type="button" onClick={() => setShowAllConditions(v => !v)} className="text-xs text-blue-500 hover:text-blue-700 underline">
                        {showAllConditions ? "絞り込む" : "全件表示"}
                      </button>
                    </div>
                    {displayTags.length === 0 ? <p className="text-sm text-gray-400">条件候補がありません。</p> : (
                      <div className="flex flex-wrap gap-2">
                        {displayTags.map(tag => (
                          <button key={tag} type="button" onClick={() => toggleCondition(tag)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${selectedConditions.includes(tag) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600"}`}>
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <input type="text" placeholder="手入力で追加" autoComplete="off"
                        className="px-2 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
                        onKeyDown={e => { if (e.key === "Enter") { const val = (e.target as HTMLInputElement).value.trim(); if (val) { toggleCondition(val); (e.target as HTMLInputElement).value = "" } } }}
                      />
                      <span className="text-xs text-gray-400">Enterで追加</span>
                    </div>
                    {selectedConditions.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2 border-t">
                        <span className="text-xs text-gray-400 mr-1 self-center">選択中：</span>
                        {selectedConditions.map(c => (
                          <span key={c} className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {c}<button onClick={() => toggleCondition(c)} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveParent} disabled={saving}>{saving ? "保存中..." : "保存"}</Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>キャンセル</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 枝番一覧 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>枝番一覧</CardTitle>
              <Button size="sm" onClick={openCreateChild} className="flex items-center gap-1"><Plus className="w-4 h-4" />枝番追加</Button>
            </div>
          </CardHeader>
          <CardContent>
            {parent.children.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">枝番がありません</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {["枝番","判","目","切","面","天地","左右","咥え","依頼書","所在",""].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parent.children.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">{parent.uid_ntemp}-{c.edaban}</td>
                        <td className="px-3 py-2 text-gray-600">{c.han ?? "—"}</td>
                        <td className="px-3 py-2 text-gray-600">{c.me ?? "—"}</td>
                        <td className="px-3 py-2 text-gray-600">{c.kiri ?? "—"}</td>
                        <td className="px-3 py-2 text-gray-600">{c.men ?? "—"}</td>
                        <td className="px-3 py-2 text-gray-600">{c.sizey ?? "—"}</td>
                        <td className="px-3 py-2 text-gray-600">{c.sizex ?? "—"}</td>
                        <td className="px-3 py-2 text-gray-600">{c.咥え ?? "—"}</td>
                        <td className="px-3 py-2">
                          <button onClick={() => setRequestModalChild(c)}
                            className={`text-xs font-medium px-2 py-0.5 rounded-full border transition-colors ${c.requests.length > 0 ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"}`}>
                            {c.requests.length > 0 ? `発行済 ${c.requests.length}件` : "未発行"}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-gray-600">{c.location ?? "—"}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <button onClick={() => openEditChild(c)} className="p-1 text-gray-400 hover:text-blue-600 rounded"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteChild(c.id)} className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 枝番編集モーダル */}
      {childModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">{editChild ? "枝番を編集" : "枝番を追加"} — {parent.uid_ntemp}</h2>
              <button onClick={() => setChildModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <div className="flex items-center gap-1">
                  <Label className="text-xs">枝番</Label>
                  <div className="relative group">
                    <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                    <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block w-64 bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3 space-y-0.5">
                      <p>-01…四六半以上</p>
                      <p>-02…A/菊/K半</p>
                      <p>-03…3切・4切</p>
                      <p>-04…くるみ中芯</p>
                      <p>-11…ダイマト専用型（現在ほぼ使用してません）</p>
                      <p>-21…UVクリア反転用型</p>
                    </div>
                  </div>
                </div>
                <select value={childForm.edaban} onChange={e => setChildForm(f => ({ ...f, edaban: e.target.value }))} className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                  <option value="">—</option>
                  {EDABAN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {childForm.edaban && EDABAN_NOTES[childForm.edaban] && (
                  <p className="text-xs text-gray-400 mt-1">{EDABAN_NOTES[childForm.edaban]}</p>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[{ label: "判", key: "han", options: HAN_OPTIONS }, { label: "目", key: "me", options: ME_OPTIONS }, { label: "切", key: "kiri", options: KIRI_OPTIONS }, { label: "面", key: "men", options: MEN_OPTIONS }].map(({ label, key, options }) => (
                  <div key={key}><Label className="text-xs">{label}</Label>
                    <select value={childForm[key as keyof ChildForm]} onChange={e => setChildForm(f => ({ ...f, [key]: e.target.value }))} className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                      <option value="">—</option>{options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">天地（mm）</Label><Input type="number" value={childForm.sizey} onChange={e => setChildForm(f => ({ ...f, sizey: e.target.value }))} autoComplete="off" className="mt-1 h-8 text-sm" /></div>
                <div><Label className="text-xs">左右（mm）</Label><Input type="number" value={childForm.sizex} onChange={e => setChildForm(f => ({ ...f, sizex: e.target.value }))} autoComplete="off" className="mt-1 h-8 text-sm" /></div>
                <div><Label className="text-xs">咥え（mm）</Label><Input type="number" value={childForm.咥え} onChange={e => setChildForm(f => ({ ...f, 咥え: e.target.value }))} autoComplete="off" className="mt-1 h-8 text-sm" /></div>
              </div>
              <div><Label className="text-xs">所在</Label>
                <select value={childForm.location} onChange={e => setChildForm(f => ({ ...f, location: e.target.value }))} className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                  <option value="">—</option>{LOCATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={() => setChildModalOpen(false)}>キャンセル</Button>
              <Button onClick={handleSaveChild} disabled={saving}>{saving ? "保存中..." : "保存"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* 依頼書モーダル */}
      {requestModalChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div><h2 className="text-base font-bold text-gray-900">依頼書一覧</h2>
                <p className="text-xs text-gray-400 mt-0.5">{parent.uid_ntemp}-{requestModalChild.edaban}</p></div>
              <button onClick={() => setRequestModalChild(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-4">
              {requestModalChild.requests.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">依頼書が発行されていません</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {requestModalChild.requests.map(r => (
                    <div key={r.id} onClick={() => { router.push(`/dashboard/dlms/requests/${r.id}`); setRequestModalChild(null) }}
                      className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors border border-gray-100">
                      <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="flex-1"><p className="text-sm font-medium text-gray-800">{r.request_no}</p>
                        <p className="text-xs text-gray-400">{new Date(r.dtindt).toLocaleDateString("ja-JP")}</p></div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.haichi_kakunin === "手配済" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{r.haichi_kakunin}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <Button size="sm" onClick={() => { const p = new URLSearchParams({ parentId: parent.id, childId: requestModalChild.id }); router.push(`/dashboard/dlms/requests?${p.toString()}`); setRequestModalChild(null) }} className="flex items-center gap-1.5">
                <Plus className="w-4 h-4" />新規作成
              </Button>
              <Button variant="outline" onClick={() => setRequestModalChild(null)}>閉じる</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
