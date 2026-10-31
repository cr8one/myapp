import Link from "next/link"
import { Receipt, ChevronLeft } from "lucide-react"
import { SLIP_TYPES } from "@/lib/accounting-slip-types"

export default function AccountingNewPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/dashboard/eapp/accounting" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ChevronLeft className="w-4 h-4" />経理精算の一覧に戻る
      </Link>
      <h1 className="text-2xl font-bold">経理精算の新規作成</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">作りたい書類の種類と目的を確認して、選んでください。</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {SLIP_TYPES.map(t => (
          <Link key={t.value} href={t.href}
            className="group rounded-2xl border border-emerald-100 hover:border-emerald-300 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-2.5">
                <Receipt className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="font-bold text-gray-900">{t.label}</span>
            </div>
            <p className="text-sm text-gray-500 mt-3">{t.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
