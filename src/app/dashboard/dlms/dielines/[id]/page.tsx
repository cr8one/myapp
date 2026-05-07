"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pencil, Plus, Trash2, X } from "lucide-react"

const GENRE_OPTIONS = ["CD", "BD", "DVD", "その他"]
const SPEC_OPTIONS = ["紙ジャケ", "トレー仕様", "12cmCD", "化粧紙", "その他"]
const HINMOKU_OPTIONS = ["ハコ", "オビ", "ラベル", "スペーサー", "E式ジャケット", "デジ本体", "その他"]
const LOCATION_OPTIONS = ["J 1", "島田PC", "島田ダイマト", "本社", "東京ユニオン", "イシイ埼玉", "パックウェル"]
const HAN_OPTIONS = ["4/6", "菊", "A", "B", "特", "K", "L", "ハトロン"]
const ME_OPTIONS = ["Y", "T"]
const KIRI_OPTIONS = ["1", "2", "3", "4", "長6", "角6", "8"]
const MEN_OPTIONS = Array.from({ length: 18 }, (_, i) => String(i + 1))

type ConditionMaster = { id: number; name: string }
type Condition = { id: string; value: string; sortOrder: number }
type Child = {
  id: string; edaban: string; han: string | null; me: string | null
  kiri: string | null; men: string | null; sizey: number | null
  sizex: number | null; 咥え: number | null; location: string | null
}
type Parent = {
  id: string; uid_ntemp: string; kyugataban: string | null
  genre: string | null; spec: string | null; hinmoku: string | null
  developy: number | null; developx: number | null
  sizey: number | null; sizex: number | null; widthy: number | null
  conditions: Condition[]; children: Child[]
}

type ChildForm = { han: string; me: string; kiri: string; men: string; sizey: string; sizex: string; 咥え: string; location: string }
const emptyChildForm: ChildForm = { han: "", me: "", kiri: "", men: "", sizey: "", sizex: "", 咥え: "", location: "" }

export default function DielineDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [parent, setParent] = useState<Parent | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [conditionMasters, setConditionMasters] = useState<ConditionMaster[]>([])

  const [genre, setGenre] = useState("")
  const [spec, setSpec] = useState("")
  const [hinmoku, setHinmoku] = useState("")
  const [kyugataban, setKyugataban] = useState("")
  const [developy, setDevelopy] = useState("")
  const [developx, setDevelopx] = useState("")
  const [sizey, setSizey] = useState("")
  const [sizex, setSizex] = useState("")
  const [widthy, setWidthy] = useState("")
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])

  const [childModalOpen, setChildModalOpen] = useState(false)
  const [editChild, setEditChild] = useState<Child | null>(null)
  const [childForm, setChildForm] = useState<ChildForm>(emptyChildForm)

  const fetchParent = async () => {
    const res = await fetch(`/api/dlms/dielines/${id}`)
    const data = await res.json()
    setParent(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchParent()
    fetch("/api/dlms/conditions").then(r => r.json()).then(setConditionMasters)
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
    setDevelopy(parent.developy?.toString() ?? "")
    setDevelopx(parent.developx?.toString() ?? "")
    setSizey(parent.sizey?.toString() ?? "")
    setSizex(parent.sizex?.toString() ?? "")
    setWidthy(parent.widthy?.toString() ?? "")
    setSelectedConditions(parent.conditions.map(c => c.value))
    setEditing(true)
  }

  const handleSaveParent = async () => {
    setSaving(true)
    await fetch(`/api/dlms/dielines/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        genre: genre || null, spec: spec || null, hinmoku: hinmoku || null,
        kyugataban: kyugataban || null,
        developy: developy ? parseFloat(developy) : null,
        developx: developx ? parseFloat(developx) : null,
        sizey: sizey ? parseFloat(sizey) : null,
        sizex: sizex ? parseFloat(sizex) : null,
        widthy: widthy ? parseFloat(widthy) : null,
        conditions: selectedConditions,
      }),
    })
    setSaving(false)
    setEditing(false)
    fetchParent()
  }

  const openCreateChild = () => {
    setEditChild(null)
    setChildForm(emptyChildForm)
    setChildModalOpen(true)
  }

  const openEditChild = (c: Child) => {
    setEditChild(c)
    setChildForm({
      han: c.han ?? "", me: c.me ?? "", kiri: c.kiri ?? "", men: c.men ?? "",
      sizey: c.sizey?.toString() ?? "", sizex: c.sizex?.toString() ?? "",
      咥え: c.咥え?.toString() ?? "", location: c.location ?? "",
    })
    setChildModalOpen(true)
  }

  const handleSaveChild = async () => {
    setSaving(true)
    const payload = {
      han: childForm.han || null, me: childForm.me || null,
      kiri: childForm.kiri || null, men: childForm.men || null,
      sizey: childForm.sizey ? parseFloat(childForm.sizey) : null,
      sizex: childForm.sizex ? parseFloat(childForm.sizex) : null,
      咥え: childForm.咥え ? parseFloat(childForm.咥え) : null,
      location: childForm.location || null,
    }
    if (editChild) {
      await fetch(`/api/dlms/dielines/${id}/children/${editChild.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch(`/api/dlms/dielines/${id}/children`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
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

  if (loading) return <div className="p-8 text-gray-400">読み込み中...</div>
  if (!parent) return <div className="p-8 text-gray-400">データが見つかりません</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>← 戻る</Button>
        <h1 className="text-2xl font-bold">型番号：{parent.uid_ntemp}</h1>
        {!editing && (
          <Button variant="outline" onClick={startEdit} className="flex items-center gap-1 ml-auto">
            <Pencil className="w-4 h-4" />編集
          </Button>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>基本情報</CardTitle></CardHeader>
          <CardContent>
            {!editing ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">ジャンル</span><p className="font-medium mt-0.5">{parent.genre ?? "—"}</p></div>
                <div><span className="text-gray-500">仕様</span><p className="font-medium mt-0.5">{parent.spec ?? "—"}</p></div>
                <div><span className="text-gray-500">品目</span><p className="font-medium mt-0.5">{parent.hinmoku ?? "—"}</p></div>
                <div><span className="text-gray-500">旧型番号</span><p className="font-medium mt-0.5">{parent.kyugataban ?? "—"}</p></div>
                <div><span className="text-gray-500">展開サイズ（たて×よこ）</span><p className="font-medium mt-0.5">{parent.developy ?? "—"} × {parent.developx ?? "—"} mm</p></div>
                <div><span className="text-gray-500">仕上サイズ（天地×左右）</span><p className="font-medium mt-0.5">{parent.sizey ?? "—"} × {parent.sizex ?? "—"} mm</p></div>
                <div><span className="text-gray-500">背幅</span><p className="font-medium mt-0.5">{parent.widthy ?? "—"} mm</p></div>
                <div>
                  <span className="text-gray-500">条件</span>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {parent.conditions.length > 0
                      ? parent.conditions.map(c => <span key={c.id} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{c.value}</span>)
                      : <span className="text-gray-400">—</span>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
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
                    <div className="space-y-1"><Label className="text-xs">たて</Label>
                      <Input type="number" value={developy} onChange={e => setDevelopy(e.target.value)} /></div>
                    <div className="space-y-1"><Label className="text-xs">よこ</Label>
                      <Input type="number" value={developx} onChange={e => setDevelopx(e.target.value)} /></div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-500 mb-2 block">仕上サイズ（mm）</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1"><Label className="text-xs">天地</Label>
                      <Input type="number" value={sizey} onChange={e => setSizey(e.target.value)} /></div>
                    <div className="space-y-1"><Label className="text-xs">左右</Label>
                      <Input type="number" value={sizex} onChange={e => setSizex(e.target.value)} /></div>
                    <div className="space-y-1"><Label className="text-xs">背幅</Label>
                      <Input type="number" value={widthy} onChange={e => setWidthy(e.target.value)} /></div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-500 mb-2 block">条件</Label>
                  {conditionMasters.length === 0 ? (
                    <p className="text-sm text-gray-400">条件マスタが登録されていません。</p>
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
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveParent} disabled={saving}>{saving ? "保存中..." : "保存"}</Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>キャンセル</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>枝番一覧</CardTitle>
              <Button size="sm" onClick={openCreateChild} className="flex items-center gap-1">
                <Plus className="w-4 h-4" />枝番追加
              </Button>
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
                      <th className="text-left px-3 py-2 text-gray-500 font-medium">枝番</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium">判</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium">目</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium">切</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium">面</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium">天地</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium">左右</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium">咥え</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium">所在</th>
                      <th className="px-3 py-2"></th>
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
                        <td className="px-3 py-2 text-gray-600">{c.location ?? "—"}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <button onClick={() => openEditChild(c)} className="p-1 text-gray-400 hover:text-blue-600 rounded">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteChild(c.id)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

      {childModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-bold">{editChild ? "枝番を編集" : "枝番を追加"} — {parent.uid_ntemp}</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "判", key: "han", options: HAN_OPTIONS },
                  { label: "目", key: "me", options: ME_OPTIONS },
                  { label: "切", key: "kiri", options: KIRI_OPTIONS },
                  { label: "面", key: "men", options: MEN_OPTIONS },
                ].map(({ label, key, options }) => (
                  <div key={key}>
                    <Label className="text-xs">{label}</Label>
                    <select value={childForm[key as keyof ChildForm]}
                      onChange={e => setChildForm(f => ({ ...f, [key]: e.target.value }))}
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                      <option value="">—</option>
                      {options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">天地（mm）</Label>
                  <Input type="number" value={childForm.sizey} onChange={e => setChildForm(f => ({ ...f, sizey: e.target.value }))} className="mt-1 h-8 text-sm" /></div>
                <div><Label className="text-xs">左右（mm）</Label>
                  <Input type="number" value={childForm.sizex} onChange={e => setChildForm(f => ({ ...f, sizex: e.target.value }))} className="mt-1 h-8 text-sm" /></div>
                <div><Label className="text-xs">咥え（mm）</Label>
                  <Input type="number" value={childForm.咥え} onChange={e => setChildForm(f => ({ ...f, 咥え: e.target.value }))} className="mt-1 h-8 text-sm" /></div>
              </div>
              <div>
                <Label className="text-xs">所在</Label>
                <select value={childForm.location} onChange={e => setChildForm(f => ({ ...f, location: e.target.value }))}
                  className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                  <option value="">—</option>
                  {LOCATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
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
    </div>
  )
}
