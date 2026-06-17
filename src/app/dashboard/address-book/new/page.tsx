"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
const HONORIFICS = ["様", "御中", "殿", "先生"]
export default function AddressBookNewPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const DEPT_IN_CHARGE = ["社長", "相談役", "総務", "SP", "MP1", "MP2", "開発G", "PP", "DPP", "静岡"]
  const [form, setForm] = useState({
    company_name: "", company_name_kana: "", department: "", position: "",
    name: "", honorific: "", postal_code: "", address1: "", address2: "", department_in_charge: "", remarks: "",
  })
  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))
  const handleSubmit = async () => {
    setSaving(true)
    const res = await fetch("/api/address-book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const data = await res.json()
      router.push(`/dashboard/address-book/${data.id}`)
    } else {
      alert("登録に失敗しました")
      setSaving(false)
    }
  }
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>← 戻る</Button>
        <h1 className="text-2xl font-bold">住所録 新規登録</h1>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">会社名</label>
              <input value={form.company_name} onChange={e => update("company_name", e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm" autoComplete="off" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">会社名フリガナ</label>
              <input value={form.company_name_kana} onChange={e => update("company_name_kana", e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm" autoComplete="off" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">部門名</label>
              <input value={form.department} onChange={e => update("department", e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm" autoComplete="off" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">役職名</label>
              <input value={form.position} onChange={e => update("position", e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm" autoComplete="off" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">氏名</label>
              <input value={form.name} onChange={e => update("name", e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm" autoComplete="off" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">敬称</label>
              <input value={form.honorific} onChange={e => update("honorific", e.target.value)}
                list="honorific-options" className="w-full border rounded px-3 py-2 text-sm" autoComplete="off" />
              <datalist id="honorific-options">
                {HONORIFICS.map(h => <option key={h} value={h} />)}
              </datalist>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">郵便番号</label>
              <input value={form.postal_code} onChange={e => update("postal_code", e.target.value)}
                placeholder="000-0000" className="w-full border rounded px-3 py-2 text-sm" autoComplete="off" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">住所1</label>
              <input value={form.address1} onChange={e => update("address1", e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm" autoComplete="off" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">住所2</label>
              <input value={form.address2} onChange={e => update("address2", e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm" autoComplete="off" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">担当部署</label>
              <input value={form.department_in_charge} onChange={e => update("department_in_charge", e.target.value)}
                list="dept-in-charge-options" className="w-full border rounded px-3 py-2 text-sm" autoComplete="off" />
              <datalist id="dept-in-charge-options">
                {DEPT_IN_CHARGE.map(d => <option key={d} value={d} />)}
              </datalist>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">備考</label>
            <textarea value={form.remarks} onChange={e => update("remarks", e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm resize-none" rows={3} autoComplete="off" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => router.back()}>キャンセル</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? "登録中..." : "登録する"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
