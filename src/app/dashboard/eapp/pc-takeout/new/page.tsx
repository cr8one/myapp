"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import PcTakeoutForm, { emptyPcTakeoutForm, pcTakeoutPayload, PcTakeoutFormValues } from "@/components/pc-takeout/pc-takeout-form"

export default function PcTakeoutNewPage() {
  const router = useRouter()
  const [initial] = useState(emptyPcTakeoutForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const save = async (v: PcTakeoutFormValues, submit: boolean, sendMail: boolean) => {
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/eapp/pc-takeout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pcTakeoutPayload(v, submit), send_mail: sendMail }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "保存に失敗しました")
      router.push("/dashboard/eapp/pc-takeout")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/dashboard/eapp/pc-takeout" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ChevronLeft className="w-4 h-4" />一覧に戻る
      </Link>
      <h1 className="text-2xl font-bold mb-6">PC持ち出し申請</h1>
      <PcTakeoutForm initial={initial} isNew saving={saving} error={error} onSave={save} onCancel={() => router.push("/dashboard/eapp/pc-takeout")} />
    </div>
  )
}
