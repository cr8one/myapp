"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Building2, FolderKanban, CalendarDays, Tags, Handshake } from "lucide-react"

type Stats = {
  companyCount: number
  projectCount: number
  exhibitionCount: number
  typeCount: number
}

const cards = [
  { label: "会社管理", key: "companyCount" as keyof Stats, href: "/dashboard/dev/companies", icon: Building2, bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100", hover: "hover:border-blue-300" },
  { label: "案件管理", key: "projectCount" as keyof Stats, href: "/dashboard/dev/projects", icon: FolderKanban, bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100", hover: "hover:border-indigo-300" },
  { label: "展示会管理", key: "exhibitionCount" as keyof Stats, href: "/dashboard/dev/exhibitions", icon: CalendarDays, bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-100", hover: "hover:border-violet-300" },
  { label: "種別管理", key: "typeCount" as keyof Stats, href: "/dashboard/dev/company-type-masters", icon: Tags, bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-100", hover: "hover:border-sky-300" },
]

export default function BpmsDashboardClient({ stats }: { stats: Stats }) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0)
  const [visibleChars, setVisibleChars] = useState(0)
  const [shakeAnim, setShakeAnim] = useState(false)
  const fullText = "Business Partner Management System"

  useEffect(() => {
    // アイコンを少し揺らして握手感を演出
    const t1 = setTimeout(() => setShakeAnim(true), 200)
    const t2 = setTimeout(() => setShakeAnim(false), 700)
    const t3 = setTimeout(() => setPhase(1), 300)
    const t4 = setTimeout(() => setPhase(2), 900)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [])

  useEffect(() => {
    if (phase !== 2) return
    if (visibleChars < fullText.length) {
      const t = setTimeout(() => setVisibleChars((v) => v + 1), 25)
      return () => clearTimeout(t)
    }
  }, [phase, visibleChars])

  const logoSize = phase >= 2 ? 52 : 72

  return (
    <div className="p-8">
      <style>{`
        @keyframes handshake {
          0%   { transform: scale(1) rotate(0deg); }
          25%  { transform: scale(1.15) rotate(-8deg); }
          50%  { transform: scale(1.2) rotate(6deg); }
          75%  { transform: scale(1.1) rotate(-4deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .shake-anim { animation: handshake 0.5s ease; }
      `}</style>

      <div className="mb-10 flex flex-col gap-2">
        <div className="flex items-center gap-4">

          {/* ロゴ */}
          <div
            className="relative flex items-center justify-center rounded-2xl shadow-lg flex-shrink-0 overflow-hidden"
            style={{
              width: logoSize,
              height: logoSize,
              background: "linear-gradient(135deg, #1e40af 0%, #4f46e5 100%)",
              transition: "width 0.5s ease, height 0.5s ease",
            }}
          >
            <div className={shakeAnim ? "shake-anim" : ""}>
              <Handshake
                style={{
                  width: phase >= 2 ? 28 : 38,
                  height: phase >= 2 ? 28 : 38,
                  color: "white",
                  transition: "all 0.5s ease",
                }}
              />
            </div>
            {phase < 2 && (
              <span className="absolute inset-0 rounded-2xl ring-4 ring-indigo-300 ring-opacity-50 animate-ping" />
            )}
          </div>

          {/* テキスト */}
          <div className="flex flex-col justify-center gap-0.5">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-black tracking-tight text-gray-900">BPMS</span>
              {phase >= 2 && (
                <span className="text-xs font-semibold text-indigo-400 tracking-widest uppercase">
                  {fullText.slice(0, visibleChars)}
                  {visibleChars < fullText.length && (
                    <span className="inline-block w-px h-3 bg-indigo-400 ml-0.5 animate-pulse align-middle" />
                  )}
                </span>
              )}
            </div>
            <p
              className="text-sm text-gray-400 transition-all duration-500"
              style={{
                opacity: visibleChars === fullText.length ? 1 : 0,
                transform: visibleChars === fullText.length ? "translateY(0)" : "translateY(4px)",
              }}
            >
              協力会社管理システム — 登録状況の概要
            </p>
          </div>
        </div>
      </div>

      {/* 統計カード */}
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 transition-all duration-500"
        style={{
          opacity: visibleChars === fullText.length ? 1 : 0,
          transform: visibleChars === fullText.length ? "translateY(0)" : "translateY(10px)",
        }}
      >
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.key}
              href={card.href}
              className={`group rounded-2xl border ${card.border} ${card.hover} bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
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
