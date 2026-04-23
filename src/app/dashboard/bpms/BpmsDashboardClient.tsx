"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Building2, FolderKanban, CalendarDays, Tags } from "lucide-react"

type Stats = {
  companyCount: number
  projectCount: number
  exhibitionCount: number
  typeCount: number
}

const cards = [
  {
    label: "会社管理",
    key: "companyCount" as keyof Stats,
    href: "/dashboard/dev/companies",
    icon: Building2,
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
  },
  {
    label: "案件管理",
    key: "projectCount" as keyof Stats,
    href: "/dashboard/dev/projects",
    icon: FolderKanban,
    color: "from-indigo-500 to-indigo-600",
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    border: "border-indigo-100",
  },
  {
    label: "展示会管理",
    key: "exhibitionCount" as keyof Stats,
    href: "/dashboard/dev/exhibitions",
    icon: CalendarDays,
    color: "from-violet-500 to-violet-600",
    bg: "bg-violet-50",
    text: "text-violet-600",
    border: "border-violet-100",
  },
  {
    label: "種別管理",
    key: "typeCount" as keyof Stats,
    href: "/dashboard/dev/company-type-masters",
    icon: Tags,
    color: "from-sky-500 to-sky-600",
    bg: "bg-sky-50",
    text: "text-sky-600",
    border: "border-sky-100",
  },
]

// アニメーションのフェーズ
// 0: "BPMS" 表示
// 1: 展開アニメーション "Business Partner Management System"
// 2: 完了・ダッシュボード表示

export default function BpmsDashboardClient({ stats }: { stats: Stats }) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0)
  const [visibleChars, setVisibleChars] = useState(0)
  const fullText = "Business Partner Management System"

  useEffect(() => {
    // 0.6秒後にフェーズ1へ
    const t1 = setTimeout(() => setPhase(1), 600)
    return () => clearTimeout(t1)
  }, [])

  useEffect(() => {
    if (phase !== 1) return
    if (visibleChars < fullText.length) {
      const t = setTimeout(() => setVisibleChars((v) => v + 1), 40)
      return () => clearTimeout(t)
    } else {
      // 全文字表示後0.8秒でフェーズ2へ
      const t = setTimeout(() => setPhase(2), 800)
      return () => clearTimeout(t)
    }
  }, [phase, visibleChars])

  return (
    <div className="p-8">
      {/* ロゴ・アニメーションエリア */}
      <div className="mb-10 flex flex-col items-start gap-1">
        <div className="flex items-end gap-3">
          {/* BPMSロゴ */}
          <div
            className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg transition-all duration-500"
            style={{
              width: phase === 2 ? 56 : 80,
              height: phase === 2 ? 56 : 80,
            }}
          >
            <span
              className="font-black text-white tracking-tight transition-all duration-500 select-none"
              style={{ fontSize: phase === 2 ? 14 : 20 }}
            >
              BPMS
            </span>
            {/* パルスリング（フェーズ0〜1のみ） */}
            {phase < 2 && (
              <span className="absolute inset-0 rounded-2xl ring-4 ring-blue-400 ring-opacity-50 animate-ping" />
            )}
          </div>

          {/* テキスト展開 */}
          <div className="flex flex-col justify-end pb-1">
            {phase >= 1 && (
              <p
                className="text-sm font-medium text-blue-500 tracking-widest uppercase transition-opacity duration-300"
                style={{ opacity: phase >= 1 ? 1 : 0 }}
              >
                {fullText.slice(0, visibleChars)}
                {phase === 1 && visibleChars < fullText.length && (
                  <span className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5 animate-pulse align-middle" />
                )}
              </p>
            )}
            <h1
              className="text-2xl font-bold text-gray-900 transition-all duration-500"
              style={{
                opacity: phase === 2 ? 1 : 0,
                transform: phase === 2 ? "translateY(0)" : "translateY(4px)",
              }}
            >
              協力会社管理システム
            </h1>
          </div>
        </div>

        {phase === 2 && (
          <p
            className="mt-1 text-sm text-gray-400 transition-opacity duration-700"
            style={{ opacity: phase === 2 ? 1 : 0 }}
          >
            登録状況の概要を確認できます
          </p>
        )}
      </div>

      {/* 統計カード */}
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 transition-all duration-700"
        style={{
          opacity: phase === 2 ? 1 : 0,
          transform: phase === 2 ? "translateY(0)" : "translateY(12px)",
        }}
      >
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.key}
              href={card.href}
              className={`group rounded-2xl border ${card.border} bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`rounded-xl ${card.bg} p-2.5`}>
                  <Icon className={`w-5 h-5 ${card.text}`} />
                </div>
                <span className={`text-xs font-medium ${card.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  一覧を見る →
                </span>
              </div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {stats[card.key].toLocaleString()}
                <span className="ml-1 text-base font-normal text-gray-400">件</span>
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
