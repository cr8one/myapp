"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Search, Download, Upload, Eye } from "lucide-react"

const GENRE_OPTIONS = ["CD", "BD", "DVD", "その他"]
const SPEC_OPTIONS = ["紙ジャケ", "トレー仕様", "12cmCD", "化粧紙", "その他"]
const HINMOKU_OPTIONS = ["ハコ", "オビ", "ラベル", "スペーサー", "E式ジャケット", "デジ本体", "その他"]
const LOCATION_OPTIONS = ["J 1", "島田PC", "島田ダイマト", "本社", "東京ユニオン", "イシイ埼玉", "パックウェル"]

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

type FilterState = { genre: string; spec: string; hinmoku: string; condition: string; keyword: string }
const emptyFilter: FilterState = { genre: "", spec: "", hinmoku: "", condition: "", keyword: "" }

type ParentForm = {
  genre: string; spec: string; hinmoku: string; kyugataban: string
  developy: string; developx: string; sizey: string; sizex: string; widthy: string
  conditions: string[]
}
const emptyParentForm: ParentForm = {
  genre: "", spec: "", hinmoku: "", kyugataban: "",
  developy: "", developx: "", sizey: "", sizex: "", widthy: "",
  conditions: ["", "", "", ""]
}

type ChildForm = {
  han: string; me: string; kiri: string; men: string
  sizey: string; sizex: string; 咥え: string; location: string
}
const emptyChildForm: ChildForm = { han: "", me: "", kiri: "", men: "", sizey: "", sizex: "", 咥え: "", location: "" }

export default function DielinesPage() {
  const router = useRouter()
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterState>(emptyFilter)

  // 親モーダル
  const [parentModalOpen, setParentModalOpen] = useState(false)
  const [editParent, setEditParent] = useState<Parent | null>(null)
  const [parentForm, setParentForm] = useState<ParentForm>(emptyParentForm)
  const [saving, setSaving] = useState(false)

  // 枝番モーダル
  const [childModalOpen, setChildModalOpen] = useState(false)
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null)
  const [editChild, setEditChild] = useState<Child | null>(null)
  const [childForm, setChildForm] = useState<ChildForm>(emptyChildForm)

  // 削除確認
  const [deleteParentTarget, setDeleteParentTarget] = useState<Parent | null>(null)
  const [deleteChildTarget, setDeleteChildTarget] = useState<{ parentId: string; child: Child } | null>(null)

  const fetchParents = async (f?: FilterState) => {
    setLoading(true)
    const params = new URLSearchParams()
    const ff = f ?? filter
    if (ff.genre) params.set("genre", ff.genre)
    if (ff.spec) params.set("spec", ff.spec)
    if (ff.hinmoku) params.set("hinmoku", ff.hinmoku)
    if (ff.condition) params.set("condition", ff.condition)
    if (ff.keyword) params.set("keyword", ff.keyword)
    const res = await fetch(`/api/dlms/dielines?${params.toString()}`)
    const data = await res.json()
    setParents(data)
    setLoading(false)
  }

  useEffect(() => { fetchParents() }, [])

  const openCreateParent = () => {
    setEditParent(null)
    setParentForm(emptyParentForm)
    setParentModalOpen(true)
  }

  const openEditParent = (p: Parent) => {
    setEditParent(p)
    const conds = p.conditions.map(c => c.value)
    while (conds.length < 4) conds.push("")
    setParentForm({
      genre: p.genre ?? "", spec: p.spec ?? "", hinmoku: p.hinmoku ?? "",
      kyugataban: p.kyugataban ?? "",
      developy: p.developy?.toString() ?? "", developx: p.developx?.toString() ?? "",
      sizey: p.sizey?.toString() ?? "", sizex: p.sizex?.toString() ?? "",
      widthy: p.widthy?.toString() ?? "", conditions: conds,
    })
    setParentModalOpen(true)
  }

  const handleSaveParent = async () => {
    setSaving(true)
    const payload = {
      genre: parentForm.genre || null,
      spec: parentForm.spec || null,
      hinmoku: parentForm.hinmoku || null,
      kyugataban: parentForm.kyugataban || null,
      developy: parentForm.developy ? parseFloat(parentForm.developy) : null,
      developx: parentForm.developx ? parseFloat(parentForm.developx) : null,
      sizey: parentForm.sizey ? parseFloat(parentForm.sizey) : null,
      sizex: parentForm.sizex ? parseFloat(parentForm.sizex) : null,
      widthy: parentForm.widthy ? parseFloat(parentForm.widthy) : null,
      conditions: parentForm.conditions.filter(c => c.trim() !== ""),
    }
    if (editParent) {
      await fetch(`/api/dlms/dielines/${editParent.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch("/api/dlms/dielines", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    }
    setSaving(false)
    setParentModalOpen(false)
    fetchParents()
  }

  const handleDeleteParent = async () => {
    if (!deleteParentTarget) return
    await fetch(`/api/dlms/dielines/${deleteParentTarget.id}`, { method: "DELETE" })
    setDeleteParentTarget(null)
    fetchParents()
  }

  const openCreateChild = (parent: Parent) => {
    setSelectedParent(parent)
    setEditChild(null)
    setChildForm(emptyChildForm)
    setChildModalOpen(true)
  }

  const openEditChild = (parent: Parent, child: Child) => {
    setSelectedParent(parent)
    setEditChild(child)
    setChildForm({
      han: child.han ?? "", me: child.me ?? "", kiri: child.kiri ?? "",
      men: child.men ?? "", sizey: child.sizey?.toString() ?? "",
      sizex: child.sizex?.toString() ?? "", 咥え: child.咥え?.toString() ?? "",
      location: child.location ?? "",
    })
    setChildModalOpen(true)
  }

  const handleSaveChild = async () => {
    if (!selectedParent) return
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
      await fetch(`/api/dlms/dielines/${selectedParent.id}/children/${editChild.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch(`/api/dlms/dielines/${selectedParent.id}/children`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    }
    setSaving(false)
    setChildModalOpen(false)
    fetchParents()
  }

  const handleDeleteChild = async () => {
    if (!deleteChildTarget) return
    await fetch(`/api/dlms/dielines/${deleteChildTarget.parentId}/children/${deleteChildTarget.child.id}`, { method: "DELETE" })
    setDeleteChildTarget(null)
    fetchParents()
  }

  // CSVエクスポート
  const handleExport = () => {
    const rows = [["型番号", "旧型番号", "ジャンル", "仕様", "品目", "展開たて", "展開よこ", "天地", "左右", "背幅", "条件1", "条件2", "条件3", "条件4"]]
    parents.forEach(p => {
      const conds = p.conditions.map(c => c.value)
      while (conds.length < 4) conds.push("")
      rows.push([
        p.uid_ntemp, p.kyugataban ?? "", p.genre ?? "", p.spec ?? "", p.hinmoku ?? "",
        p.developy?.toString() ?? "", p.developx?.toString() ?? "",
        p.sizey?.toString() ?? "", p.sizex?.toString() ?? "", p.widthy?.toString() ?? "",
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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">抜き型管理</h1>
          <p className="text-sm text-gray-500 mt-1">型台帳の管理（{parents.length}件表示中）</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-1">
            <Download className="w-4 h-4" />CSV
          </Button>
          <Button onClick={openCreateParent} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />新規作成
          </Button>
        </div>
      </div>

      {/* 検索フィルター */}
      <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div>
            <Label className="text-xs text-gray-500">キーワード（型番）</Label>
            <Input value={filter.keyword} onChange={e => setFilter(f => ({ ...f, keyword: e.target.value }))}
              placeholder="型番号・旧型番" className="mt-1 h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-gray-500">ジャンル</Label>
            <select value={filter.genre} onChange={e => setFilter(f => ({ ...f, genre: e.target.value }))}
              className="mt-1 w-full h-8 border rounded px-2 text-sm bg-white">
              <option value="">すべて</option>
              {GENRE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs text-gray-500">仕様</Label>
            <select value={filter.spec} onChange={e => setFilter(f => ({ ...f, spec: e.target.value }))}
              className="mt-1 w-full h-8 border rounded px-2 text-sm bg-white">
              <option value="">すべて</option>
              {SPEC_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs text-gray-500">品目</Label>
            <select value={filter.hinmoku} onChange={e => setFilter(f => ({ ...f, hinmoku: e.target.value }))}
              className="mt-1 w-full h-8 border rounded px-2 text-sm bg-white">
              <option value="">すべて</option>
              {HINMOKU_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs text-gray-500">条件</Label>
            <Input value={filter.condition} onChange={e => setFilter(f => ({ ...f, condition: e.target.value }))}
              placeholder="条件で絞り込み" className="mt-1 h-8 text-sm" />
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <Button size="sm" onClick={() => fetchParents()} className="flex items-center gap-1">
            <Search className="w-3 h-3" />検索
          </Button>
        </div>
      </div>

      {/* 一覧テーブル */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">読み込み中...</div>
      ) : parents.length === 0 ? (
        <div className="text-center py-12 text-gray-400">データがありません</div>
      ) : (
        <div className="space-y-2">
          {parents.map(p => (
            <div key={p.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
              {/* 親行 */}
              <div className="flex items-center gap-3 px-4 py-3 border-b bg-gray-50">
                <div className="flex-1 grid grid-cols-2 gap-2 sm:grid-cols-6 text-sm">
                  <div>
                    <span className="text-xs text-gray-400">型番号</span>
                    <p className="font-bold text-gray-800">{p.uid_ntemp}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">ジャンル/仕様/品目</span>
                    <p className="text-gray-600">{[p.genre, p.spec, p.hinmoku].filter(Boolean).join(" / ")}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">天地×左右</span>
                    <p className="text-gray-600">{p.sizey && p.sizex ? `${p.sizey}×${p.sizex}` : "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">背幅</span>
                    <p className="text-gray-600">{p.widthy ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">条件</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {p.conditions.map(c => (
                        <span key={c.id} className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{c.value}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">枝番数</span>
                    <p className="text-gray-600">{p.children.length}件</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEditParent(p)} className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded">編集</button>
                  <button onClick={() => openCreateChild(p)} className="text-xs px-2 py-1 text-green-600 hover:bg-green-50 rounded">枝番追加</button>
                  <button onClick={() => setDeleteParentTarget(p)} className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded">削除</button>
                </div>
              </div>
              {/* 枝番行 */}
              {p.children.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100">
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
                      {p.children.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-700">{p.uid_ntemp}-{c.edaban}</td>
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
                              <button onClick={() => openEditChild(p, c)} className="text-blue-500 hover:text-blue-700">編集</button>
                              <button onClick={() => setDeleteChildTarget({ parentId: p.id, child: c })} className="text-red-400 hover:text-red-600">削除</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 親モーダル */}
      {parentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">{editParent ? "型台帳を編集" : "型台帳を新規作成"}</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              {editParent && (
                <div className="bg-gray-50 rounded px-3 py-2 text-sm text-gray-600">
                  型番号：<span className="font-bold">{editParent.uid_ntemp}</span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">ジャンル</Label>
                  <select value={parentForm.genre} onChange={e => setParentForm(f => ({ ...f, genre: e.target.value }))}
                    className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                    <option value="">未選択</option>
                    {GENRE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">仕様</Label>
                  <select value={parentForm.spec} onChange={e => setParentForm(f => ({ ...f, spec: e.target.value }))}
                    className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                    <option value="">未選択</option>
                    {SPEC_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">品目</Label>
                  <select value={parentForm.hinmoku} onChange={e => setParentForm(f => ({ ...f, hinmoku: e.target.value }))}
                    className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                    <option value="">未選択</option>
                    {HINMOKU_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-xs">旧型番号</Label>
                <Input value={parentForm.kyugataban} onChange={e => setParentForm(f => ({ ...f, kyugataban: e.target.value }))}
                  className="mt-1 h-8 text-sm" autoComplete="off" />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">展開サイズ（mm）</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">たて</Label>
                    <Input type="number" value={parentForm.developy} onChange={e => setParentForm(f => ({ ...f, developy: e.target.value }))}
                      className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">よこ</Label>
                    <Input type="number" value={parentForm.developx} onChange={e => setParentForm(f => ({ ...f, developx: e.target.value }))}
                      className="mt-1 h-8 text-sm" />
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">仕上サイズ（mm）</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">天地</Label>
                    <Input type="number" value={parentForm.sizey} onChange={e => setParentForm(f => ({ ...f, sizey: e.target.value }))}
                      className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">左右</Label>
                    <Input type="number" value={parentForm.sizex} onChange={e => setParentForm(f => ({ ...f, sizex: e.target.value }))}
                      className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">背幅</Label>
                    <Input type="number" value={parentForm.widthy} onChange={e => setParentForm(f => ({ ...f, widthy: e.target.value }))}
                      className="mt-1 h-8 text-sm" />
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">条件（最大4件）</Label>
                <div className="grid grid-cols-2 gap-2">
                  {parentForm.conditions.map((c, i) => (
                    <Input key={i} value={c} onChange={e => {
                      const conds = [...parentForm.conditions]
                      conds[i] = e.target.value
                      setParentForm(f => ({ ...f, conditions: conds }))
                    }} placeholder={`条件${i + 1}`} className="h-8 text-sm" autoComplete="off" />
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={() => setParentModalOpen(false)}>キャンセル</Button>
              <Button onClick={handleSaveParent} disabled={saving}>{saving ? "保存中..." : "保存"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* 枝番モーダル */}
      {childModalOpen && selectedParent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">
                {editChild ? "枝番を編集" : "枝番を追加"} — 型番号 {selectedParent.uid_ntemp}
              </h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs">判</Label>
                  <select value={childForm.han} onChange={e => setChildForm(f => ({ ...f, han: e.target.value }))}
                    className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                    <option value="">—</option>
                    {["4/6", "菊", "A", "B", "特", "K", "L", "ハトロン"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">目</Label>
                  <select value={childForm.me} onChange={e => setChildForm(f => ({ ...f, me: e.target.value }))}
                    className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                    <option value="">—</option>
                    {["Y", "T"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">切</Label>
                  <select value={childForm.kiri} onChange={e => setChildForm(f => ({ ...f, kiri: e.target.value }))}
                    className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                    <option value="">—</option>
                    {["1", "2", "3", "4", "長6", "角6", "8"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">面</Label>
                  <select value={childForm.men} onChange={e => setChildForm(f => ({ ...f, men: e.target.value }))}
                    className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-white">
                    <option value="">—</option>
                    {Array.from({ length: 18 }, (_, i) => String(i + 1)).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">天地（mm）</Label>
                  <Input type="number" value={childForm.sizey} onChange={e => setChildForm(f => ({ ...f, sizey: e.target.value }))}
                    className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">左右（mm）</Label>
                  <Input type="number" value={childForm.sizex} onChange={e => setChildForm(f => ({ ...f, sizex: e.target.value }))}
                    className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">咥え（mm）</Label>
                  <Input type="number" value={childForm.咥え} onChange={e => setChildForm(f => ({ ...f, 咥え: e.target.value }))}
                    className="mt-1 h-8 text-sm" />
                </div>
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

      {/* 親削除確認 */}
      {deleteParentTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">削除の確認</h2>
            <p className="text-sm text-gray-600">型番号「{deleteParentTarget.uid_ntemp}」を削除しますか？枝番も含めて削除されます。</p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteParentTarget(null)}>キャンセル</Button>
              <Button variant="destructive" onClick={handleDeleteParent}>削除</Button>
            </div>
          </div>
        </div>
      )}

      {/* 枝番削除確認 */}
      {deleteChildTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">削除の確認</h2>
            <p className="text-sm text-gray-600">枝番「{deleteChildTarget.child.edaban}」を削除しますか？</p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteChildTarget(null)}>キャンセル</Button>
              <Button variant="destructive" onClick={handleDeleteChild}>削除</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
