"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Layers, FileImage, FileText, Settings } from "lucide-react"
type Stats = {
  dielineCount: number
  drawingCount: number
  requestCount: number
  formatCount: number
}
function DlmsIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="6" rx="1" stroke="white" strokeWidth="1.4" fill="white" fillOpacity="0.1"/>
      <rect x="6" y="9" width="12" height="5" rx="0.5" stroke="white" strokeWidth="1.1" fill="white" fillOpacity="0.22"/>
      <line x1="12" y1="7" x2="12" y2="20" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M10.5 19 L12 21.5 L13.5 19" stroke="white" strokeWidth="1.2" strokeLinejoin="round" fill="white" fillOpacity="0.3"/>
    </svg>
  )
}
const cards = [
  {
    label: "抜き型管理",
    key: "dielineCount" as keyof Stats,
    href: "/dashboard/dlms/dielines",
    icon: Layers,
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-100",
    hover: "hover:border-orange-300",
  },
  {
    label: "図面管理",
    key: "drawingCount" as keyof Stats,
    href: "/dashboard/dlms/drawings",
    icon: FileImage,
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-100",
    hover: "hover:border-amber-300",
  },
  {
    label: "手配依頼書管理",
    key: "requestCount" as keyof Stats,
    href: "/dashboard/dlms/requests",
    icon: FileText,
    bg: "bg-yellow-50",
    text: "text-yellow-600",
    border: "border-yellow-100",
    hover: "hover:border-yellow-300",
  },
  {
    label: "マスタ管理",
    key: "formatCount" as keyof Stats,
    href: "/dashboard/dlms/masters",
    icon: Settings,
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-100",
    hover: "hover:border-red-300",
  },
]
export default function DlmsDashboardClient({ stats }: { stats: Stats }) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0)
  const [visibleChars, setVisibleChars] = useState(0)
  const [pulseAnim, setPulseAnim] = useState(false)
  const fullText = "Die Line Management System"
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
        @keyframes bladedrop {
          0%   { transform: translateY(-4px); }
          50%  { transform: translateY(3px); }
          100% { transform: translateY(0px); }
        }
        .blade-anim { animation: bladedrop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
      <div className="mb-10 flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <div
            className="relative flex items-center justify-center rounded-2xl shadow-lg flex-shrink-0 overflow-hidden"
            style={{
              width: logoSize,
              height: logoSize,
              background: "linear-gradient(135deg, #c2410c 0%, #f97316 100%)",
              transition: "width 0.5s ease, height 0.5s ease",
            }}
          >
            <div className={pulseAnim ? "blade-anim" : ""}>
              <DlmsIcon
                style={{
                  width: phase >= 2 ? 28 : 38,
                  height: phase >= 2 ? 28 : 38,
                  transition: "all 0.5s ease",
                }}
              />
            </div>
            {phase < 2 && (
              <span className="absolute inset-0 rounded-2xl ring-4 ring-orange-300 ring-opacity-50 animate-ping" />
            )}
          </div>
          <div className="flex flex-col justify-center gap-0.5">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-black tracking-tight text-gray-900">DLMS</span>
              {phase >= 2 && (
                <span className="text-xs font-semibold text-orange-400 tracking-widest uppercase">
                  {fullText.slice(0, visibleChars)}
                  {visibleChars < fullText.length && (
                    <span className="inline-block w-px h-3 bg-orange-400 ml-0.5 animate-pulse align-middle" />
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
              抜き型管理システム — 登録状況の概要
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
