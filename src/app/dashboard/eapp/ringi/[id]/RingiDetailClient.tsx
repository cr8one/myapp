"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Circle, Download } from "lucide-react"

type ApprovalStep = {
  id: string
  stage: string
  step_order: number
  position_name: string | null
  approver_name: string | null
  approver_email: string | null
  status: string
  approved_at: string | null
}
type RingiFile = {
  id: string
  file_key: string
  file_name: string
}
type Ringi = {
  id: string
  title: string
  content: string
  destination: string | null
  cost: string | null
  requester_names: string
  requester_department: string | null
  status: string
  reception_number: string | null
  reception_date: string | null
  decision_date: string | null
  decision_result: string | null
  files: RingiFile[]
  approval_steps: ApprovalStep[]
}

const STAGE_LABEL: Record<string, string> = {
  "起案部": "起案部承認",
  "関連部役員社長": "関連部・役員・社長承認",
}

export default function RingiDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const [data, setData] = useState<Ringi | null>(null)
  const [loading, setLoading] = useState(true)
  const [myEmail, setMyEmail] = useState("")
  const [receptionNumber, setReceptionNumber] = useState("")
  const [receptionDate, setReceptionDate] = useState("")
  const [processing, setProcessing] = useState(false)

  const fetchData = async () => {
    const res = await fetch(`/api/eapp/ringi/${id}`)
    const d = await res.json()
    setData(d)
    setLoading(false)
  }
  useEffect(() => {
    fetchData()
    fetch("/api/auth/session").then(r => r.json()).then(s => setMyEmail(s?.user?.email ?? ""))
  }, [id])

  const approve = async (stepId: string) => {
    setProcessing(true)
    const res = await fetch(`/api/eapp/ringi/${id}/approval-steps/${stepId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ send_mail: true }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(err.error ?? "承認に失敗しました")
    }
    await fetchData()
    setProcessing(false)
  }

  const submitReception = async () => {
    setProcessing(true)
    const res = await fetch(`/api/eapp/ringi/${id}/reception`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reception_number: receptionNumber, reception_date: receptionDate, send_mail: true }),
    })
    if (!res.ok) {
      alert("受付処理に失敗しました")
    }
    await fetchData()
    setProcessing(false)
  }

  const downloadFile = async (key: string, name: string) => {
    const res = await fetch(`/api/eapp/ringi/${id}/signed-url?key=${encodeURIComponent(key)}`)
    const { url } = await res.json()
    const a = document.createElement("a")
    a.href = url
    a.download = name
    a.click()
  }

  const formatDate = (str: string | null) => {
    if (!str) return "-"
    const d = new Date(str)
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
  }

  if (loading || !data) return <div className="p-8 text-gray-400">読み込み中...</div>

  const stages = ["起案部", "関連部役員社長"] as const
  const labelCls = "text-xs font-medium text-gray-500 w-24 shrink-0"
  const rowCls = "flex items-start gap-3 py-1.5"

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/eapp/ringi")}>← 一覧へ</Button>
          <h1 className="text-2xl font-bold">{data.title}</h1>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600">{data.status}</span>
      </div>

      <div className="bg-white border rounded-lg shadow-sm p-6 mb-6 space-y-1">
        <div className={rowCls}>
          <span className={labelCls}>起案者</span>
          <span className="text-sm text-gray-800">{data.requester_names}</span>
        </div>
        <div className={rowCls}>
          <span className={labelCls}>起案部</span>
          <span className="text-sm text-gray-800">{data.requester_department ?? "-"}</span>
        </div>
        <div className={rowCls}>
          <span className={labelCls}>依頼先</span>
          <span className="text-sm text-gray-800">{data.destination ?? "-"}</span>
        </div>
        <div className={rowCls}>
          <span className={labelCls}>費用</span>
          <span className="text-sm text-gray-800">{data.cost ?? "-"}</span>
        </div>
        <div className={rowCls}>
          <span className={labelCls}>目的・内容</span>
          <p className="text-sm text-gray-800 whitespace-pre-wrap flex-1">{data.content}</p>
        </div>
        {data.files.length > 0 && (
          <div className={rowCls}>
            <span className={labelCls}>添付ファイル</span>
            <div className="flex-1 space-y-1">
              {data.files.map(f => (
                <button key={f.id} onClick={() => downloadFile(f.file_key, f.file_name)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                  <Download className="w-3 h-3" />{f.file_name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {stages.map(stage => {
        const steps = data.approval_steps.filter(s => s.stage === stage)
        if (steps.length === 0) return null
        return (
          <div key={stage} className="bg-white border rounded-lg shadow-sm p-6 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{STAGE_LABEL[stage] ?? stage}</h3>
            <div className="space-y-2">
              {steps.map(s => {
                const isMine = s.approver_email === myEmail
                const isFirstPending = steps.find(x => x.status === "未承認")?.id === s.id
                return (
                  <div key={s.id} className="flex items-center gap-3 border-b py-2 last:border-0">
                    {s.status === "承認済み" ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <Circle className="w-4 h-4 text-gray-300 shrink-0" />}
                    <span className="text-xs text-gray-400 w-20">{s.position_name ?? "-"}</span>
                    <span className="text-sm flex-1">{s.approver_name ?? "-"}</span>
                    <span className="text-xs text-gray-400">{s.status}{s.approved_at ? `（${formatDate(s.approved_at)}）` : ""}</span>
                    {isMine && isFirstPending && (
                      <Button size="sm" onClick={() => approve(s.id)} disabled={processing}>承認する</Button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {data.status === "受付待ち" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-3">受付処理</h3>
          <div className="flex gap-3 items-end">
            <div>
              <label className="text-xs text-gray-500 block mb-1">受付番号</label>
              <Input value={receptionNumber} onChange={e => setReceptionNumber(e.target.value)} className="h-8 text-sm w-40" autoComplete="off" placeholder="R08-004" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">受付日</label>
              <Input type="date" value={receptionDate} onChange={e => setReceptionDate(e.target.value)} className="h-8 text-sm w-40" autoComplete="off" />
            </div>
            <Button onClick={submitReception} disabled={processing}>受付する</Button>
          </div>
        </div>
      )}

      {data.status === "決裁済み" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-emerald-800 mb-2">決裁完了</h3>
          <p className="text-sm text-gray-700">決裁日: {formatDate(data.decision_date)} ／ 決裁結果: {data.decision_result ?? "-"}</p>
        </div>
      )}
    </div>
  )
}
