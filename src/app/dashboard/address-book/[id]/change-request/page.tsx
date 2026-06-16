"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
const HONORIFICS = ["様", "御中", "殿", "先生"]
const FIELD_LABELS: Record<string, string> = {
  company_name: "会社名",
  company_name_kana: "会社名フリガナ",
  department: "部門名",
  position: "役職名",
  name: "氏名",
  honorific: "敬称",
  postal_code: "郵便番号",
  address1: "住所1",
  address2: "住所2",
  remarks: "備考",
}
type AddressBookRecord = {
  id: string; uid: string
  company_name: string | null; company_name_kana: string | null
  department: string | null; position: string | null
  name: string | null; honorific: string | null
  postal_code: string | null; address1: string | null
  address2: string | null; remarks: string | null
}
export default function AddressBookChangeRequestPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [record, setRecord] = useState<AddressBookRecord | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [requestRemarks, setRequestRemarks] = useState("")
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    fetch(`/api/address-book/${id}`).then(r => r.json()).then((data: AddressBookRecord) => {
      setRecord(data)
      setForm({
        company_name: data.company_name ?? "",
        company_name_kana: data.company_name_kana ?? "",
        department: data.department ?? "",
        position: data.position ?? "",
        name: data.name ?? "",
        honorific: data.honorific ?? "",
        postal_code: data.postal_code ?? "",
        address1: data.address1 ?? "",
        address2: data.address2 ?? "",
        remarks: data.remarks ?? "",
      })
    })
  }, [id])
  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))
  const handleSubmit = async () => {
    if (!record) return
    // 変更があった項目のみ抽出
    const items = Object.keys(FIELD_LABELS)
      .filter(key => form[key] !== (record[key as keyof AddressBookRecord] ?? ""))
      .map(key => ({
        field_name: key,
        field_label: FIELD_LABELS[key],
        before_value: record[key as keyof AddressBookRecord] as string ?? "",
        after_value: form[key],
      }))
    if (items.length === 0) {
      alert("変更内容がありません")
      return
    }
    setSaving(true)
    const res = await fetch("/api/address-book/change-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address_book_id: id, items, remarks: requestRemarks }),
    })
    if (res.ok) {
      alert("変更依頼を送信しました")
      router.push(`/dashboard/address-book/${id}`)
    } else {
      alert("送信に失敗しました")
      setSaving(false)
    }
  }
  if (!record) return <p className="p-8 text-gray-400 animate-pulse">読み込み中...</p>
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>← 戻る</Button>
        <h1 className="text-2xl font-bold">住所録 変更依頼 No.{record.uid}</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">変更したい項目を入力して「送信する」を押してください。変更のない項目はそのままにしてください。</p>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "company_name", label: "会社名" },
              { key: "company_name_kana", label: "会社名フリガナ" },
              { key: "department", label: "部門名" },
              { key: "position", label: "役職名" },
              { key: "name", label: "氏名" },
              { key: "honorific", label: "敬称" },
              { key: "postal_code", label: "郵便番号" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-sm font-medium text-gray-700 mb-1 block">{f.label}</label>
                {f.key === "honorific" ? (
                  <>
                    <input value={form[f.key]} onChange={e => update(f.key, e.target.value)}
                      list="honorific-options"
                      className={`w-full border rounded px-3 py-2 text-sm ${form[f.key] !== (record[f.key as keyof AddressBookRecord] ?? "") ? "border-amber-400 bg-amber-50" : ""}`}
                      autoComplete="off" />
                    <datalist id="honorific-options">
                      {HONORIFICS.map(h => <option key={h} value={h} />)}
                    </datalist>
                  </>
                ) : (
                  <input value={form[f.key]} onChange={e => update(f.key, e.target.value)}
                    className={`w-full border rounded px-3 py-2 text-sm ${form[f.key] !== (record[f.key as keyof AddressBookRecord] ?? "") ? "border-amber-400 bg-amber-50" : ""}`}
                    autoComplete="off" />
                )}
              </div>
            ))}
          </div>
          {[
            { key: "address1", label: "住所1" },
            { key: "address2", label: "住所2" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-sm font-medium text-gray-700 mb-1 block">{f.label}</label>
              <input value={form[f.key]} onChange={e => update(f.key, e.target.value)}
                className={`w-full border rounded px-3 py-2 text-sm ${form[f.key] !== (record[f.key as keyof AddressBookRecord] ?? "") ? "border-amber-400 bg-amber-50" : ""}`}
                autoComplete="off" />
            </div>
          ))}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">備考（住所録の備考）</label>
            <textarea value={form.remarks} onChange={e => update("remarks", e.target.value)}
              className={`w-full border rounded px-3 py-2 text-sm resize-none ${form.remarks !== (record.remarks ?? "") ? "border-amber-400 bg-amber-50" : ""}`}
              rows={3} autoComplete="off" />
          </div>
          <div className="border-t pt-4">
            <label className="text-sm font-medium text-gray-700 mb-1 block">依頼備考（担当者へのメモ）</label>
            <textarea value={requestRemarks} onChange={e => setRequestRemarks(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm resize-none" rows={2} autoComplete="off"
              placeholder="変更理由や補足があれば入力してください" />
          </div>
          <p className="text-xs text-amber-600">※ 変更した項目はオレンジ色で表示されます</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => router.back()}>キャンセル</Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white">
              {saving ? "送信中..." : "送信する"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
