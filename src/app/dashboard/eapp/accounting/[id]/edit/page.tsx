"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import TripExpenseForm, { TripFormValues, tripFormFromSlip, tripFormPayload } from "@/components/accounting/trip-expense-form"
import MealAdvanceForm, { MealFormValues, mealFormFromSlip, mealFormPayload } from "@/components/accounting/meal-advance-form"
import AttachmentsEditor from "@/components/accounting/attachments-editor"
import { AttachedFile } from "@/lib/accounting-slip-files-client"

export default function AccountingEditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [slipType, setSlipType] = useState("")
  const [tripInitial, setTripInitial] = useState<TripFormValues | null>(null)
  const [mealInitial, setMealInitial] = useState<MealFormValues | null>(null)
  const [returnReason, setReturnReason] = useState("")
  const [attached, setAttached] = useState<AttachedFile[]>([])
  const [blocked, setBlocked] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/eapp/accounting/slips/${id}`)
      if (res.status === 404) {
        setBlocked("伝票が見つかりません。")
      } else if (res.ok) {
        const data = await res.json()
        if (data.slip_type !== "trip_expense" && data.slip_type !== "meal_advance") setBlocked("この種類の伝票は、まだ編集できません。")
        else if (!data.can_edit) setBlocked("この伝票は、今は編集できません。")
        else {
          setSlipType(data.slip_type)
          if (data.slip_type === "meal_advance") setMealInitial(mealFormFromSlip(data))
          else setTripInitial(tripFormFromSlip(data))
          setAttached(data.files ?? [])
          const last = [...(data.histories ?? [])].reverse().find((h: any) => h.action === "差戻し")
          if (data.status === "差戻し" && last?.comment) setReturnReason(last.comment)
        }
      } else {
        setBlocked("伝票を取得できませんでした。")
      }
      setLoading(false)
    }
    load()
  }, [id])

  const put = async (payload: Record<string, unknown>, sendMail: boolean) => {
    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/api/eapp/accounting/slips/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, send_mail: sendMail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "保存に失敗しました")
      router.push(`/dashboard/eapp/accounting/${id}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }
  const saveTrip = (v: TripFormValues, submit: boolean, sendMail: boolean) => put(tripFormPayload(v, submit), sendMail)
  const saveMeal = (v: MealFormValues, submit: boolean, sendMail: boolean) => put(mealFormPayload(v, submit), sendMail)

  const back = (
    <Link href={`/dashboard/eapp/accounting/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
      <ChevronLeft className="w-4 h-4" />伝票の詳細に戻る
    </Link>
  )

  if (loading) return <div className="p-6"><p className="text-center text-gray-400 py-8 animate-pulse">読み込み中...</p></div>
  if (blocked || (!tripInitial && !mealInitial)) {
    return <div className="p-6 max-w-4xl mx-auto">{back}<p className="text-center text-gray-500 py-8">{blocked || "伝票を取得できませんでした。"}</p></div>
  }

  const attachments = <AttachmentsEditor mode="live" slipId={id} attached={attached} onAttached={setAttached} />
  const cancel = () => router.push(`/dashboard/eapp/accounting/${id}`)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {back}
      <h1 className="text-2xl font-bold mb-6">
        {slipType === "meal_advance" ? "飲食費及び仮払精算書を編集" : "出金伝票（出張旅費精算書（国内））を編集"}
      </h1>
      {returnReason && (
        <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          <p className="font-bold mb-1">差戻しの理由</p>
          <p className="whitespace-pre-wrap">{returnReason}</p>
        </div>
      )}
      {slipType === "meal_advance" && mealInitial ? (
        <MealAdvanceForm initial={mealInitial} saving={saving} error={error}
          saveLabel="保存" submitLabel="申請する"
          attachments={attachments} onSave={saveMeal} onCancel={cancel} />
      ) : tripInitial ? (
        <TripExpenseForm initial={tripInitial} saving={saving} error={error}
          saveLabel="保存" submitLabel="申請する"
          attachments={attachments} onSave={saveTrip} onCancel={cancel} />
      ) : null}
    </div>
  )
}
