"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function NewCadWorkLogPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    work_date: "",
    start_time: "",
    end_time: "",
    request_no: "",
    department_group: "",
    person_in_charge: "",
    customer: "",
    title: "",
    content: "",
    parts_name: "",
    quantity: "",
    paper_name: "",
    remarks: "",
    flg_same_day: false,
  })

  const update = (key: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!form.work_date || !form.start_time) {
      alert("日付と開始時刻は必須です")
      return
    }
    setSaving(true)
    const start_time = `${form.work_date}T${form.start_time}:00`
    const end_time = form.end_time ? `${form.work_date}T${form.end_time}:00` : null
    const res = await fetch("/api/cad/work-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        work_date: form.work_date,
        start_time,
        end_time,
        request_no: form.request_no || null,
        department_group: form.department_group || null,
        person_in_charge: form.person_in_charge || null,
        customer: form.customer || null,
        title: form.title || null,
        content: form.content || null,
        parts_name: form.parts_name || null,
        quantity: form.quantity || null,
        paper_name: form.paper_name || null,
        remarks: form.remarks || null,
        flg_same_day: form.flg_same_day,
      }),
    })
    setSaving(false)
    if (res.ok) {
      router.push("/dashboard/cad/work-logs")
    } else {
      alert("保存に失敗しました")
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">CAD作業履歴 新規作成</h1>
      <div className="bg-white border rounded-lg p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">日付 *</label>
            <Input type="date" autoComplete="off" value={form.work_date} onChange={e => update("work_date", e.target.value)} />
          </div>
          <div />
          <div>
            <label className="text-xs text-gray-500 mb-1 block">開始時刻 *</label>
            <Input type="time" autoComplete="off" value={form.start_time} onChange={e => update("start_time", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">終了時刻</label>
            <Input type="time" autoComplete="off" value={form.end_time} onChange={e => update("end_time", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">依頼書No</label>
            <Input autoComplete="off" value={form.request_no} onChange={e => update("request_no", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">所属G</label>
            <Input autoComplete="off" value={form.department_group} onChange={e => update("department_group", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">担当者</label>
            <Input autoComplete="off" value={form.person_in_charge} onChange={e => update("person_in_charge", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">顧客</label>
            <Input autoComplete="off" value={form.customer} onChange={e => update("customer", e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">タイトル</label>
            <Input autoComplete="off" value={form.title} onChange={e => update("title", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">内容</label>
            <Input autoComplete="off" value={form.content} onChange={e => update("content", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">パーツ名</label>
            <Input autoComplete="off" value={form.parts_name} onChange={e => update("parts_name", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">用紙名</label>
            <Input autoComplete="off" value={form.paper_name} onChange={e => update("paper_name", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">数量</label>
            <Input type="number" autoComplete="off" value={form.quantity} onChange={e => update("quantity", e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">備考</label>
            <Input autoComplete="off" value={form.remarks} onChange={e => update("remarks", e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.flg_same_day}
              onChange={e => update("flg_same_day", e.target.checked)}
              className="w-4 h-4"
            />
            <label className="text-sm text-gray-600">当日対応</label>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => router.push("/dashboard/cad/work-logs")}>キャンセル</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "保存中..." : "保存"}</Button>
        </div>
      </div>
    </div>
  )
}
