"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import TripExpenseForm, { emptyTripForm, tripFormPayload, TripFormValues } from "@/components/accounting/trip-expense-form"

export default function TripExpenseNewPage() {
  const router = useRouter()
  const [initial] = useState(emptyTripForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const save = async (v: TripFormValues, submit: boolean, sendMail: boolean) => {
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/eapp/accounting/slips/trip-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...tripFormPayload(v, submit), send_mail: sendMail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "保存に失敗しました")
      router.push("/dashboard/eapp/accounting")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/dashboard/eapp/accounting/new" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ChevronLeft className="w-4 h-4" />種類の選択に戻る
      </Link>
      <h1 className="text-2xl font-bold mb-6">出金伝票（出張旅費精算書）</h1>
      <TripExpenseForm initial={initial} saving={saving} error={error}
        onSave={save} onCancel={() => router.push("/dashboard/eapp/accounting")} />
    </div>
  )
}
