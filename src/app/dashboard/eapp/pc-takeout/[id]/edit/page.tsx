"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import PcTakeoutForm, { pcTakeoutFormFromRequest, pcTakeoutPayload, PcTakeoutFormValues } from "@/components/pc-takeout/pc-takeout-form"

export default function PcTakeoutEditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [initial, setInitial] = useState<PcTakeoutFormValues | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/eapp/pc-takeout/${id}`)
      .then(async res => {
        if (!res.ok) { setMessage("申請が見つかりません。"); return }
        const r = await res.json()
        if (!r.can_edit) { setMessage("この申請は、今は編集できません（下書きまたは差戻しの、本人の申請だけ編集できます）。"); return }
        setInitial(pcTakeoutFormFromRequest(r))
      })
      .catch(() => setMessage("読み込みに失敗しました。"))
      .finally(() => setLoading(false))
  }, [id])

  const save = async (v: PcTakeoutFormValues, submit: boolean, sendMail: boolean) => {
    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/api/eapp/pc-takeout/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pcTakeoutPayload(v, submit), send_mail: sendMail }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "保存に失敗しました")
      router.push(`/dashboard/eapp/pc-takeout/${id}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href={`/dashboard/eapp/pc-takeout/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ChevronLeft className="w-4 h-4" />詳細に戻る
      </Link>
      <h1 className="text-2xl font-bold mb-6">PC持ち出し申請を編集</h1>
      {loading ? (
        <p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p>
      ) : !initial ? (
        <p className="text-center text-gray-500 py-8">{message}</p>
      ) : (
        <PcTakeoutForm initial={initial} isNew={false} saving={saving} error={error} onSave={save} onCancel={() => router.push(`/dashboard/eapp/pc-takeout/${id}`)} />
      )}
    </div>
  )
}
