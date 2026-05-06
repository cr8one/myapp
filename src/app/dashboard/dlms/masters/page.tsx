import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Ruler, Layers, FileText } from "lucide-react"

export default async function DlmsMastersPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const [formatCount, partCount, noteCount] = await Promise.all([
    prisma.dlmsFormatMaster.count(),
    prisma.dlmsPartMaster.count(),
    prisma.dlmsNoteMaster.count(),
  ])

  const cards = [
    { label: "判型マスタ", count: formatCount, href: "/dashboard/dlms/masters/formats", icon: Ruler, bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-100", hover: "hover:border-orange-300" },
    { label: "パーツマスタ", count: partCount, href: "/dashboard/dlms/masters/parts", icon: Layers, bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", hover: "hover:border-amber-300" },
    { label: "注記マスタ", count: noteCount, href: "/dashboard/dlms/masters/notes", icon: FileText, bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-100", hover: "hover:border-yellow-300" },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">DLMSマスタ管理</h1>
        <p className="text-sm text-gray-400 mt-1">図面作成で使用するマスタデータの管理</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map(card => {
          const Icon = card.icon
          return (
            <Link
              key={card.href}
              href={card.href}
              className={`group rounded-2xl border ${card.border} ${card.hover} bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`rounded-xl ${card.bg} p-2.5`}>
                  <Icon className={`w-5 h-5 ${card.text}`} />
                </div>
                <span className={`text-xs font-medium ${card.text} opacity-0 group-hover:opacity-100 transition-opacity`}>一覧を見る →</span>
              </div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {card.count.toLocaleString()}
                <span className="ml-1 text-base font-normal text-gray-400">件</span>
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
