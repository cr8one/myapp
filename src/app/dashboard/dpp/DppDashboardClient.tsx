"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { CalendarDays, Archive, Database, Settings } from "lucide-react"

type Stats = {
  scheduleCount: number
  masterCount: number
}

function DppIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="white" strokeWidth="1.4" fill="white" fillOpacity="0.1"/>
      <line x1="3" y1="9" x2="21" y2="9" stroke="white" strokeWidth="1.4"/>
      <line x1="8" y1="3" x2="8" y2="6" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="16" y1="3" x2="16" y2="6" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="8" cy="13" r="1.2" fill="white" fillOpacity="0.6"/>
      <circle cx="12" cy="13" r="1.2" fill="white" fillOpacity="0.6"/>
      <circle cx="16" cy="13" r="1.2" fill="white" fillOpacity="0.6"/>
      <circle cx="8" cy="17" r="1.2" fill="white" fillOpacity="0.6"/>
    </svg>
  )
}

const cards = [
  {
    label: "予定表",
    key: "scheduleCount" as keyof Stats,
    href: "/dashboard/dpp/schedule",
    icon: CalendarDays,
    bg: "bg-pink-50",
    text: "text-pink-600",
    border: "border-pink-100",
    hover: "hover:border-pink-300",
    placeholder: false,
  },
  {
    label: "予定表アーカイブ",
    key: null,
    href: "/dashboard/dpp/archive",
    icon: Archive,
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-100",
    hover: "hover:border-rose-300",
    placeholder: true,
  },
  {
    label: "データ保管台帳",
    key: null,
    href: "/dashboard/dpp/storage-ledger",
    icon: Database,
    bg: "bg-fuchsia-50",
    text: "text-fuchsia-600",
    border: "border-fuchsia-100",
    hover: "hover:border-fuchsia-300",
    placeholder: true,
  },
  {
    label: "DPPマスタ管理",
    key: "masterCount" as keyof Stats,
    href: "/dashboard/dpp/masters",
    icon: Settings,
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-100",
    hover: "hover:border-red-300",
    placeholder: false,
  },
]

export default function DppDashboardClient({ stats }: { stats: Stats }) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0)
  const [visibleChars, setVisibleChars] = useState(0)
  const [pulseAnim, setPulseAnim] = useState(false)
  const fullText = "Dpp Progress Panel"

  useEffect(() => {
    const t1 = setTimeout(() => setPulseAnim(true), 200)
    const t2 = setTimeout(() => setPulseAnim(false), 800)
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
        @keyframes calendarpop {
          0%   { transform: scale(0.9); }
          50%  { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .calendar-anim { animation: calendarpop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
      <div className="mb-10 flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <div
            className="relative flex items-center justify-center rounded-2xl shadow-lg flex-shrink-0 overflow-hidden"
            style={{
              width: logoSize,
              height: logoSize,
              background: "linear-gradient(135deg, #be185d 0%, #ec4899 100%)",
              transition: "width 0.5s ease, height 0.5s ease",
            }}
          >
            <div className={pulseAnim ? "calendar-anim" : ""}>
              <DppIcon
                style={{
                  width: phase >= 2 ? 28 : 38,
                  height: phase >= 2 ? 28 : 38,
                  transition: "all 0.5s ease",
                }}
              />
            </div>
            {phase < 2 && (
              <span className="absolute inset-0 rounded-2xl ring-4 ring-pink-300 ring-opacity-50 animate-ping" />
            )}
          </div>
          <div className="flex flex-col justify-center gap-0.5">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-black tracking-tight text-gray-900">DPP予定表</span>
              {phase >= 2 && (
                <span className="text-xs font-semibold text-pink-400 tracking-widest uppercase">
                  {fullText.slice(0, visibleChars)}
                  {visibleChars < fullText.length && (
                    <span className="inline-block w-px h-3 bg-pink-400 ml-0.5 animate-pulse align-middle" />
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
              DPP進行管理システム — 登録状況の概要
            </p>
          </div>
        </div>
      </div>
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
              key={card.label}
              href={card.href}
              className={`group rounded-2xl border ${card.border} ${card.hover} bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`rounded-xl ${card.bg} p-2.5`}>
                  <Icon className={`w-5 h-5 ${card.text}`} />
                </div>
                {card.placeholder ? (
                  <span className="text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                    準備中
                  </span>
                ) : (
                  <span className={`text-xs font-medium ${card.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    一覧を見る →
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{card.label}</p>
              {card.placeholder ? (
                <p className="mt-1 text-3xl font-bold text-gray-300">—</p>
              ) : (
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {stats[card.key as keyof Stats].toLocaleString()}
                  <span className="ml-1 text-base font-normal text-gray-400">件</span>
                </p>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
