"use client"
import { useState, useEffect } from "react"
import { X, Send } from "lucide-react"

type SealSupply = {
  id: number
  serialCode: string
  productCode: string
  orderNo: string
  partName: string
  qtyTokyoToOutsource: number
  company: { name: string } | null
  companyName: string | null
  issuer: { id: string; name: string; email?: string } | null
  issuerName: string | null
  supplier: { id: string; name: string; email?: string } | null
  supplierName: string | null
  salesPerson: { id: string; name: string; email?: string } | null
  salesPersonName: string | null
  salesDepartment: string | null
}

// イシイ印刷の固定メールアドレス
const ISHII_EMAILS = [
  "ishii-sample1@ishii-print.co.jp",
  "ishii-sample2@ishii-print.co.jp",
  "ishii-sample3@ishii-print.co.jp",
]
const ISHII_COMPANY = "イシイ印刷"

type Props = {
  supply: SealSupply
  onClose: () => void
  onSent: () => void
}

export default function MailModal({ supply, onClose, onSent }: Props) {
  const companyName = supply.company?.name ?? supply.companyName ?? ""
  const isPatternB = companyName === ISHII_COMPANY

  const issuerEmail = "" // Userテーブルにemailあり
  const supplierEmail = ""

  const [to, setTo] = useState<string>("")
  const [cc, setCc] = useState<string>("")
  const [subject, setSubject] = useState<string>("")
  const [body, setBody] = useState<string>("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const supplierName = supply.supplier?.name ?? supply.supplierName ?? ""
    const issuerName = supply.issuer?.name ?? supply.issuerName ?? ""
    const salesPerson = supply.salesPerson?.name ?? supply.salesPersonName ?? ""
    const dept = supply.salesDepartment ?? ""

    if (isPatternB) {
      // パターンB：イシイ印刷への送り状送付
      setTo(ISHII_EMAILS.join(", "))
      setCc(issuerEmail)
      setSubject(`【ジャパン・スリーブ】サンプルシール送り状 No.${supply.serialCode}`)
      setBody(`${companyName} ご担当者様

お世話になっております。
株式会社ジャパン・スリーブ ${dept} ${salesPerson} でございます。

下記の内容にてサンプルシールをお送りいたします。
送り状兼受領書をご確認の上、ご受領のほどよろしくお願いいたします。

━━━━━━━━━━━━━━━━━━━━━━
　No.　　　　：${supply.serialCode}
　品番　　　：${supply.productCode}
　受注No　　：${supply.orderNo}
　貼り付けパーツ：${supply.partName}
　支給枚数　：${supply.qtyTokyoToOutsource} 枚
　支給担当　：${supplierName}
━━━━━━━━━━━━━━━━━━━━━━

ご不明な点がございましたらお気軽にお問い合わせください。

株式会社ジャパン・スリーブ
${dept} ${salesPerson}`)
    } else {
      // パターンA：支給者への確認依頼
      setTo(supplierEmail)
      setCc(issuerEmail)
      setSubject(`【確認依頼】サンプルシール支給 No.${supply.serialCode}`)
      setBody(`${supplierName} 様

お疲れ様です。
${issuerName} です。

下記のサンプルシール支給について、ご確認をお願いいたします。

━━━━━━━━━━━━━━━━━━━━━━
　No.　　　　：${supply.serialCode}
　支給先　　：${companyName}
　品番　　　：${supply.productCode}
　受注No　　：${supply.orderNo}
　貼り付けパーツ：${supply.partName}
　支給枚数　：${supply.qtyTokyoToOutsource} 枚
━━━━━━━━━━━━━━━━━━━━━━

ご確認の上、支給手続きをお願いいたします。

${issuerName}`)
    }
  }, [supply, isPatternB, companyName, issuerEmail, supplierEmail])

  const handleSend = async () => {
    if (!to.trim()) { setError("送信先メールアドレスを入力してください"); return }
    setSending(true); setError("")
    try {
      const res = await fetch("/api/ssss/supplies/send-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplyId: supply.id,
          to: to.split(",").map(s => s.trim()).filter(Boolean),
          cc: cc.split(",").map(s => s.trim()).filter(Boolean),
          subject,
          body,
        }),
      })
      if (!res.ok) throw new Error("送信に失敗しました")
      onSent()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-base font-bold text-gray-900">メール送信</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isPatternB ? "パターンB：イシイ印刷への送り状送付" : "パターンA：支給者への確認依頼"}
              　— No.{supply.serialCode}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
            <input type="text" value={to} onChange={e => setTo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="メールアドレス（複数の場合はカンマ区切り）" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">CC</label>
            <input type="text" value={cc} onChange={e => setCc(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="CCメールアドレス（複数の場合はカンマ区切り）" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">件名</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">本文</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={14}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">キャンセル</button>
          <button onClick={handleSend} disabled={sending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors shadow-sm">
            <Send className="w-4 h-4" />
            {sending ? "送信中..." : "送信する"}
          </button>
        </div>
      </div>
    </div>
  )
}
