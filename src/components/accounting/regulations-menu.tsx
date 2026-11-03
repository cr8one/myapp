"use client"
import { useState } from "react"
import Link from "next/link"
import { BookOpen, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchRegulations, openRegulation, RegulationItem } from "@/lib/eapp-regulations-client"

// 経理精算の一覧の右上の「規定等」ボタン。選ぶと、新しいタブでPDFが開く
export default function RegulationsMenu() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<RegulationItem[] | null>(null)
  const [canManage, setCanManage] = useState(false)
  const [error, setError] = useState("")

  const toggle = async () => {
    const next = !open
    setOpen(next)
    if (next) {
      setError("")
      try {
        const data = await fetchRegulations() // 開くたびに、最新を取り直す（版が差し替わったときに、古い表示が残らないようにする）
        setItems(data.regulations)
        setCanManage(data.can_manage)
      } catch (e: any) {
        setError(e.message)
      }
    }
  }
  const choose = async (id: string) => {
    setOpen(false)
    const err = await openRegulation(id)
    if (err) alert(err)
  }

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={toggle} className="flex items-center gap-1">
        <BookOpen className="w-4 h-4" />規定等<ChevronDown className="w-3 h-3" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-40 overflow-hidden">
            {error ? (
              <p className="px-4 py-3 text-sm text-red-600">{error}</p>
            ) : items === null ? (
              <p className="px-4 py-3 text-sm text-gray-400 animate-pulse">読み込み中...</p>
            ) : items.filter(r => r.latest).length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-500">登録された規定はありません。</p>
            ) : (
              items.filter(r => r.latest).map(r => (
                <button key={r.id} onClick={() => choose(r.id)} className="block w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0">
                  <span className="block text-sm font-medium text-gray-900">{r.title}</span>
                  <span className="block text-xs text-gray-400 mt-0.5">
                    {r.latest?.version_label ?? "最新の版"}{r.description ? `　${r.description}` : ""}
                  </span>
                </button>
              ))
            )}
            {canManage && (
              <Link href="/dashboard/eapp/masters" className="block px-4 py-2 text-xs text-blue-600 hover:bg-gray-50 border-t border-gray-100">
                規定等を管理する（電子申請マスタ）→
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  )
}
