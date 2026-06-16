"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
const STATUSES = ["依頼中", "修正中", "済"]
const STATUS_COLORS: Record<string, string> = {
  "依頼中": "bg-amber-100 text-amber-700",
  "修正中": "bg-blue-100 text-blue-700",
  "済": "bg-green-100 text-green-700",
}
type ChangeRequestItem = {
  id: string; field_name: string; field_label: string
  before_value: string | null; after_value: string | null
}
type ChangeRequest = {
  id: string; uid: string; status: string; remarks: string | null
  created_at: string; updated_at: string
  address_book: {
    id: string; uid: string; company_name: string | null
    company_name_kana: string | null; department: string | null
    position: string | null; name: string | null
  }
  requester: { name: string | null; email: string } | null
  items: ChangeRequestItem[]
}
export default function AddressBookChangeRequestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [record, setRecord] = useState<ChangeRequest | null>(null)
  const [saving, setSaving] = useState(false)
  const fetchRecord = async () => {
    const res = await fetch(`/api/address-book/change-requests/${id}`)
    setRecord(await res.json())
  }
  useEffect(() => { fetchRecord() }, [id])
  const handleStatusChange = async (status: string) => {
    setSaving(true)
    await fetch(`/api/address-book/change-requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setSaving(false)
    fetchRecord()
  }
  const handleApply = async () => {
    if (!record) return
    if (!confirm("この変更内容を住所録に反映しますか？")) return
    setSaving(true)
    const updateData: Record<string, string | null> = {}
    for (const item of record.items) {
      updateData[item.field_name] = item.after_value || null
    }
    await fetch(`/api/address-book/${record.address_book.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    })
    await fetch(`/api/address-book/change-requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "済" }),
    })
    setSaving(false)
    fetchRecord()
  }
  if (!record) return <p className="p-8 text-gray-400 animate-pulse">読み込み中...</p>
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/address-book/change-requests")}>← 一覧</Button>
          <h1 className="text-2xl font-bold">変更依頼 No.{record.uid}</h1>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[record.status] ?? "bg-gray-100 text-gray-600"}`}>{record.status}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-base font-semibold text-gray-700 mb-3">依頼情報</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">依頼者：</span><span className="text-gray-800">{record.requester?.name ?? record.requester?.email ?? "—"}</span></div>
              <div><span className="text-gray-500">依頼日：</span><span className="text-gray-800">{new Date(record.created_at).toLocaleDateString("ja-JP")}</span></div>
              <div><span className="text-gray-500">住所録No：</span><span className="text-gray-800">{record.address_book.uid}</span></div>
              <div><span className="text-gray-500">会社名：</span><span className="text-gray-800">{record.address_book.company_name ?? "—"}</span></div>
            </div>
            {record.remarks && (
              <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                <span className="text-gray-500 text-xs block mb-1">依頼備考</span>
                {record.remarks}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-base font-semibold text-gray-700 mb-3">変更内容</h2>
            <div className="divide-y divide-gray-100">
              {record.items.map(item => (
                <div key={item.id} className="py-3 grid grid-cols-3 gap-4 text-sm">
                  <div className="font-medium text-gray-700">{item.field_label}</div>
                  <div className="text-red-500 line-through">{item.before_value || "—"}</div>
                  <div className="text-green-600 font-medium">{item.after_value || "—"}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs text-gray-400 mt-1">
              <div></div><div>変更前</div><div>変更後</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-base font-semibold text-gray-700 mb-3">ステータス変更</h2>
            <div className="flex gap-2 flex-wrap">
              {STATUSES.map(s => (
                <button key={s} onClick={() => handleStatusChange(s)} disabled={saving || record.status === s}
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors ${record.status === s ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 hover:bg-gray-50"}`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <Button onClick={handleApply} disabled={saving || record.status === "済"}
                className="bg-green-600 hover:bg-green-700 text-white">
                住所録に反映して「済」にする
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
