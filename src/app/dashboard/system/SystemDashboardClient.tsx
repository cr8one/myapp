"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ShieldCheck, BookOpen, LogIn, AlertTriangle, ClipboardList } from "lucide-react"

type Stats = {
  devLogCount: number
  loginLogCount: number
  loginFailCount: number
  auditLogCount: number
}

const cards = [
  {
    label: "開発記録",
    key: "devLogCount" as keyof Stats,
    href: "/dashboard/system/dev-logs",
    icon: BookOpen,
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-100",
    hover: "hover:border-rose-300",
    unit: "件",
  },
  {
    label: "ログイン（直近30日）",
    key: "loginLogCount" as keyof Stats,
    href: "/dashboard/system/login-logs",
    icon: LogIn,
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
    hover: "hover:border-blue-300",
    unit: "件",
  },
  {
    label: "ログイン失敗（直近30日）",
    key: "loginFailCount" as keyof Stats,
    href: "/dashboard/system/login-logs",
    icon: AlertTriangle,
    bg: "bg-yellow-50",
    text: "text-yellow-600",
    border: "border-yellow-100",
    hover: "hover:border-yellow-300",
    unit: "件",
  },
  {
    label: "修正履歴",
    key: "auditLogCount" as keyof Stats,
    href: "/dashboard/system/audit-logs",
    icon: ClipboardList,
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-100",
    hover: "hover:border-purple-300",
    unit: "件",
  },
]

export default function SystemDashboardClient({ stats }: { stats: Stats }) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0)
  const [visibleChars, setVisibleChars] = useState(0)
  const [pulseAnim, setPulseAnim] = useState(false)
  const fullText = "System Administration"

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
      const t = setTimeout(() => setVisibleChars(v => v + 1), 25)
      return () => clearTimeout(t)
    }
  }, [phase, visibleChars])

  const logoSize = phase >= 2 ? 52 : 72

  return (
    <div className="p-8">
      <style>{`
        @keyframes shieldpulse {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .pulse-anim { animation: shieldpulse 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>

      <div className="mb-10 flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <div
            className="relative flex items-center justify-center rounded-2xl shadow-lg flex-shrink-0 overflow-hidden"
            style={{
              width: logoSize,
              height: logoSize,
              background: "linear-gradient(135deg, #be123c 0%, #f43f5e 100%)",
              transition: "width 0.5s ease, height 0.5s ease",
            }}
          >
            <div className={pulseAnim ? "pulse-anim" : ""}>
              <ShieldCheck
                style={{
                  width: phase >= 2 ? 28 : 38,
                  height: phase >= 2 ? 28 : 38,
                  color: "white",
                  transition: "all 0.5s ease",
                }}
              />
            </div>
            {phase < 2 && (
              <span className="absolute inset-0 rounded-2xl ring-4 ring-rose-300 ring-opacity-50 animate-ping" />
            )}
          </div>
          <div className="flex flex-col justify-center gap-0.5">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-black tracking-tight text-gray-900">システム管理</span>
              {phase >= 2 && (
                <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
                  {fullText.slice(0, visibleChars)}
                  {visibleChars < fullText.length && (
                    <span className="inline-block w-px h-3 bg-gray-400 ml-0.5 animate-pulse align-middle" />
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
              開発記録・ログイン履歴・修正履歴の概要
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
        {cards.map(card => {
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
                <span className="ml-1 text-base font-normal text-gray-400">{card.unit}</span>
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
