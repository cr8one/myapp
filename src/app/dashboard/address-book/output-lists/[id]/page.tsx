"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, GripVertical } from "lucide-react"
type OutputListItem = {
  id: string; sort_order: number
  company_name: string | null; company_name_kana: string | null
  postal_code: string | null; address1: string | null; address2: string | null
  department_in_charge: string | null; department: string | null
  position: string | null; name: string | null; honorific: string | null
  remarks: string | null
}
type OutputList = {
  id: string; uid: string; name: string; remarks: string | null
  created_at: string; updated_at: string
  items: OutputListItem[]
}
export default function OutputListDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [record, setRecord] = useState<OutputList | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [editingName, setEditingName] = useState(false)
  const [nameForm, setNameForm] = useState({ name: "", remarks: "" })
  const [saving, setSaving] = useState(false)
  const fetchRecord = async () => {
    const res = await fetch(`/api/output-lists/${id}`)
    const data: OutputList = await res.json()
    setRecord(data)
    setNameForm({ name: data.name, remarks: data.remarks ?? "" })
  }
  useEffect(() => { fetchRecord() }, [id])
  const handleSaveName = async () => {
    setSaving(true)
    await fetch(`/api/output-lists/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nameForm),
    })
    setEditingName(false)
    setSaving(false)
    fetchRecord()
  }
  const handleDelete = async () => {
    if (!confirm("この出力リストを削除しますか？")) return
    await fetch(`/api/output-lists/${id}`, { method: "DELETE" })
    router.push("/dashboard/address-book/output-lists")
  }
  const startEditItem = (item: OutputListItem) => {
    setEditingItemId(item.id)
    setEditForm({
      company_name: item.company_name ?? "",
      company_name_kana: item.company_name_kana ?? "",
      postal_code: item.postal_code ?? "",
      address1: item.address1 ?? "",
      address2: item.address2 ?? "",
      department_in_charge: item.department_in_charge ?? "",
      department: item.department ?? "",
      position: item.position ?? "",
      name: item.name ?? "",
      honorific: item.honorific ?? "",
      remarks: item.remarks ?? "",
    })
  }
  const handleSaveItem = async (itemId: string) => {
    setSaving(true)
    await fetch(`/api/output-lists/${id}/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    })
    setEditingItemId(null)
    setSaving(false)
    fetchRecord()
  }
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("この行を削除しますか？")) return
    await fetch(`/api/output-lists/${id}/items/${itemId}`, { method: "DELETE" })
    fetchRecord()
  }
  const handleMoveItem = async (itemId: string, direction: "up" | "down") => {
    if (!record) return
    const idx = record.items.findIndex(i => i.id === itemId)
    if (direction === "up" && idx === 0) return
    if (direction === "down" && idx === record.items.length - 1) return
    const targetIdx = direction === "up" ? idx - 1 : idx + 1
    const targetItem = record.items[targetIdx]
    const currentItem = record.items[idx]
    await Promise.all([
      fetch(`/api/output-lists/${id}/items/${currentItem.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...currentItem, sort_order: targetItem.sort_order }),
      }),
      fetch(`/api/output-lists/${id}/items/${targetItem.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...targetItem, sort_order: currentItem.sort_order }),
      }),
    ])
    fetchRecord()
  }
  if (!record) return <p className="p-8 text-gray-400 animate-pulse">読み込み中...</p>
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/address-book/output-lists")}>← 一覧</Button>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input value={nameForm.name} onChange={e => setNameForm(f => ({ ...f, name: e.target.value }))}
                className="border rounded px-3 py-1.5 text-sm w-64" autoComplete="off" />
              <Button size="sm" onClick={handleSaveName} disabled={saving}>保存</Button>
              <Button variant="outline" size="sm" onClick={() => setEditingName(false)}>キャンセル</Button>
            </div>
          ) : (
            <h1 className="text-2xl font-bold cursor-pointer hover:text-amber-600" onClick={() => setEditingName(true)}>
              {record.name}
            </h1>
          )}
        </div>
        <Button variant="outline" onClick={handleDelete} className="text-red-500 hover:text-red-600">
          <Trash2 className="w-4 h-4 mr-1" /> リスト削除
        </Button>
      </div>
      <Card>
        <CardContent className="pt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="px-2 py-2 text-left font-medium w-8"></th>
                <th className="px-3 py-2 text-left font-medium">会社名</th>
                <th className="px-3 py-2 text-left font-medium">住所</th>
                <th className="px-3 py-2 text-left font-medium">担当部署</th>
                <th className="px-3 py-2 text-left font-medium">部門</th>
                <th className="px-3 py-2 text-left font-medium">役職</th>
                <th className="px-3 py-2 text-left font-medium">氏名</th>
                <th className="px-3 py-2 text-left font-medium">備考</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {record.items.map((item, idx) => (
                editingItemId === item.id ? (
                  <tr key={item.id} className="border-t border-gray-100 bg-amber-50">
                    <td className="px-2 py-2 text-gray-300 text-xs">{idx + 1}</td>
                    <td className="px-2 py-1">
                      <input value={editForm.company_name} onChange={e => setEditForm(f => ({ ...f, company_name: e.target.value }))}
                        className="w-full border rounded px-2 py-1 text-xs" placeholder="会社名" autoComplete="off" />
                    </td>
                    <td className="px-2 py-1">
                      <input value={editForm.address1} onChange={e => setEditForm(f => ({ ...f, address1: e.target.value }))}
                        className="w-full border rounded px-2 py-1 text-xs" placeholder="住所1" autoComplete="off" />
                    </td>
                    <td className="px-2 py-1">
                      <input value={editForm.department_in_charge} onChange={e => setEditForm(f => ({ ...f, department_in_charge: e.target.value }))}
                        className="w-full border rounded px-2 py-1 text-xs" placeholder="担当部署" autoComplete="off" />
                    </td>
                    <td className="px-2 py-1">
                      <input value={editForm.department} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}
                        className="w-full border rounded px-2 py-1 text-xs" placeholder="部門" autoComplete="off" />
                    </td>
                    <td className="px-2 py-1">
                      <input value={editForm.position} onChange={e => setEditForm(f => ({ ...f, position: e.target.value }))}
                        className="w-full border rounded px-2 py-1 text-xs" placeholder="役職" autoComplete="off" />
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex gap-1">
                        <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                          className="w-full border rounded px-2 py-1 text-xs" placeholder="氏名" autoComplete="off" />
                        <input value={editForm.honorific} onChange={e => setEditForm(f => ({ ...f, honorific: e.target.value }))}
                          className="w-12 border rounded px-2 py-1 text-xs" placeholder="敬称" autoComplete="off" />
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <input value={editForm.remarks} onChange={e => setEditForm(f => ({ ...f, remarks: e.target.value }))}
                        className="w-full border rounded px-2 py-1 text-xs" placeholder="備考" autoComplete="off" />
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => handleSaveItem(item.id)} disabled={saving} className="text-xs px-2 py-1 h-auto">保存</Button>
                        <Button variant="outline" size="sm" onClick={() => setEditingItemId(null)} className="text-xs px-2 py-1 h-auto">×</Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => startEditItem(item)}>
                    <td className="px-2 py-2">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={e => { e.stopPropagation(); handleMoveItem(item.id, "up") }}
                          className="text-gray-300 hover:text-gray-500 leading-none text-xs">▲</button>
                        <button onClick={e => { e.stopPropagation(); handleMoveItem(item.id, "down") }}
                          className="text-gray-300 hover:text-gray-500 leading-none text-xs">▼</button>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-medium text-gray-800">{item.company_name || "—"}</p>
                      {item.company_name_kana && <p className="text-xs text-gray-400">{item.company_name_kana}</p>}
                    </td>
                    <td className="px-3 py-2 text-gray-500 text-xs">
                      {item.postal_code && <span>〒{item.postal_code} </span>}{item.address1 || "—"}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{item.department_in_charge || "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{item.department || "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{item.position || "—"}</td>
                    <td className="px-3 py-2 text-gray-800">
                      {item.name ? `${item.name}${item.honorific ? ` ${item.honorific}` : ""}` : "—"}
                    </td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{item.remarks || "—"}</td>
                    <td className="px-2 py-2">
                      <button onClick={e => { e.stopPropagation(); handleDeleteItem(item.id) }}
                        className="text-red-300 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
          {record.items.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">行がありません</p>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-gray-400 mt-2">※ 行をクリックすると編集できます</p>
    </div>
  )
}
