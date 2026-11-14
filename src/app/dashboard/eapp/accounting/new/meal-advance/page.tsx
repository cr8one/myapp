"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import MealAdvanceForm, { emptyMealForm, mealFormPayload, MealFormValues } from "@/components/accounting/meal-advance-form"
import AttachmentsEditor from "@/components/accounting/attachments-editor"
import { uploadAccountingFile } from "@/lib/accounting-slip-files-client"

export default function MealAdvanceNewPage() {
  const router = useRouter()
  const [initial] = useState(emptyMealForm)
  const [files, setFiles] = useState<File[]>([])
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const call = async (url: string, method: string, body: unknown) => {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "保存に失敗しました")
    return data
  }

  const save = async (v: MealFormValues, submit: boolean, sendMail: boolean) => {
    setSaving(true)
    setError("")
    try {
      // 添付がなく、まだ保存していないときは、1回で保存する
      if (files.length === 0 && !createdId) {
        await call("/api/eapp/accounting/slips/meal-advance", "POST", { ...mealFormPayload(v, submit), send_mail: sendMail })
        router.push("/dashboard/eapp/accounting")
        return
      }
      // 添付があるときは、まず下書きで保存し、添付をアップロードしてから、申請する（承認中になると、添付を変えられないため）
      let slipId = createdId
      if (!slipId) {
        const created = await call("/api/eapp/accounting/slips/meal-advance", "POST", mealFormPayload(v, false))
        slipId = created.id as string
        setCreatedId(slipId)
      } else {
        await call(`/api/eapp/accounting/slips/${slipId}`, "PUT", mealFormPayload(v, false))
      }
      const remaining: File[] = []
      const failed: string[] = []
      for (const f of files) {
        try {
          await uploadAccountingFile(slipId, f)
        } catch (e: any) {
          remaining.push(f)
          failed.push(e.message)
        }
      }
      setFiles(remaining)
      if (failed.length > 0) {
        throw new Error(`${failed.join(" / ")}（内容は下書きとして保存済みです。もう一度押すと、残りのファイルから続けます）`)
      }
      if (submit) await call(`/api/eapp/accounting/slips/${slipId}`, "PUT", { ...mealFormPayload(v, true), send_mail: sendMail })
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
      <h1 className="text-2xl font-bold mb-6">飲食費及び仮払精算書</h1>
      <MealAdvanceForm initial={initial} saving={saving} error={error}
        attachments={<AttachmentsEditor mode="queue" queued={files} onQueue={setFiles} />}
        onSave={save} onCancel={() => router.push("/dashboard/eapp/accounting")} />
    </div>
  )
}
