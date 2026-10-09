"use client"
import { useRef, useState } from "react"
import { Download, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

type ImportResult = {
  created: number
  updated: number
  skipped: number
  total: number
  errors: string[]
  errorCount: number
}

export default function IrregularOrdersMigrationPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleExport = () => {
    window.open("/api/tray/irregular-orders/export", "_blank")
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError("")
    setResult(null)
    setImporting(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/tray/irregular-orders/import", { method: "POST", body: formData })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError((data as { error?: string }).error ?? "インポートに失敗しました"); return }
      setResult(data as ImportResult)
    } catch {
      setError("インポートに失敗しました")
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-gray-900">イレギュラートレイ発注書 インポート・エクスポート（システム）</h1>
      <p className="mt-1 text-sm text-gray-500">現行システムからのデータ移行用です。購買担当は使用しないでください。</p>

      <div className="mt-6 max-w-2xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <p className="font-medium">取り込みの順番にご注意ください</p>
        <p className="mt-1">先に、この画面で発注書を取り込み、次に「トレイ使用予定情報（購買）」の画面で使用予定情報を取り込みます（使用予定情報の「発注書管理No.」が、取り込み済みの発注書を指すためです）。</p>
        <p className="mt-1">管理No.が同じ発注書は更新され、ない場合は新規に作成されます。列は、管理No.・ステータス・依頼日・タイトル・申請者です。</p>
      </div>

      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={handleExport} className="flex items-center gap-1.5">
          <Download className="h-4 w-4" />エクスポート
        </Button>
        <Button onClick={() => fileInputRef.current?.click()} disabled={importing} className="flex items-center gap-1.5">
          <Upload className="h-4 w-4" />{importing ? "インポート中..." : "インポート"}
        </Button>
        <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} />
      </div>

      {error && <p className="mt-4 max-w-2xl rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {result && (
        <div className="mt-4 max-w-2xl rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <p className="font-medium">インポートが完了しました（全{result.total}件）</p>
          <p className="mt-1">新規 {result.created}件 ／ 更新 {result.updated}件 ／ スキップ {result.skipped}件</p>
          {result.errorCount > 0 && (
            <div className="mt-2 text-red-700">
              <p className="font-medium">スキップした行{result.errorCount > result.errors.length ? `（先頭${result.errors.length}件を表示）` : ""}</p>
              <ul className="mt-1 list-disc pl-5">
                {result.errors.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
