"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ClipboardList, Building2, Tags, AlertTriangle } from "lucide-react"

type Stats = {
  supplyCount: number
  holdCount: number
  companyCount: number
  partCount: number
}

const cards = [
  { label: "支給管理表", key: "supplyCount" as keyof Stats, href: "/dashboard/ssss/supplies", icon: ClipboardList },
  { label: "保留中", key: "holdCount" as keyof Stats, href: "/dashboard/ssss/supplies", icon: AlertTriangle },
  { label: "支給先会社", key: "companyCount" as keyof Stats, href: "/dashboard/ssss/masters", icon: Building2 },
  { label: "貼り付けパーツ", key: "partCount" as keyof Stats, href: "/dashboard/ssss/masters", icon: Tags },
]

function SealIcon({ size, peeling }: { size: number; peeling: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* シール本体 */}
      <rect x="4" y="8" width="36" height="26" rx="3" fill="white" fillOpacity="0.3" stroke="white" strokeWidth="2"/>
      <line x1="10" y1="18" x2="34" y2="18" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="10" y1="24" x2="28" y2="24" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="10" y1="30" x2="22" y2="30" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>

      {/* めくれた角（右下） */}
      {peeling ? (
        <>
          {/* めくれた部分の影（三角形・暗め） */}
          <path d="M28 34 L42 34 L42 20 Z" fill="rgba(0,0,0,0.15)"/>
          {/* めくれた紙の裏面（白っぽい三角） */}
          <path d="M28 34 L42 34 L42 20 Z" fill="white" fillOpacity="0.45" stroke="white" strokeWidth="1" strokeLinejoin="round"/>
          {/* めくれの折り目ライン */}
          <line x1="28" y1="34" x2="42" y2="20" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6"/>
        </>
      ) : (
        <>
          <path d="M28 34 L40 34 L40 22 Z" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
          <path d="M28 34 Q34 34 40 28" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </>
      )}
    </svg>
  )
}

export default function SsssDashboardClient({ stats }: { stats: Stats }) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0)
  const [visibleChars, setVisibleChars] = useState(0)
  const [peeling, setPeeling] = useState(false)
  const fullText = "Sample Seal Supply System"

  useEffect(() => {
    const t1 = setTimeout(() => setPeeling(true), 200)
    const t2 = setTimeout(() => setPeeling(false), 800)
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
      <div className="mb-10 flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <div
            className="relative flex items-center justify-center rounded-2xl shadow-lg flex-shrink-0"
            style={{
              width: logoSize,
              height: logoSize,
              backgroundColor: "#eab308",
              transition: "width 0.5s ease, height 0.5s ease",
            }}
          >
            <SealIcon size={phase >= 2 ? 30 : 42} peeling={peeling} />
          </div>

          <div className="flex flex-col justify-center gap-0.5">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-black tracking-tight text-gray-900">SSSS</span>
              {phase >= 2 && (
                <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#ca8a04" }}>
                  {fullText.slice(0, visibleChars)}
                  {visibleChars < fullText.length && (
                    <span className="inline-block w-px h-3 ml-0.5 animate-pulse align-middle" style={{ backgroundColor: "#ca8a04" }} />
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
              サンプルシール支給管理システム — 支給状況の概要
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
              className="group rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
              style={{ borderColor: "#fde68a" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#fbbf24")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#fde68a")}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-xl p-2.5" style={{ backgroundColor: "#fefce8" }}>
                  <Icon className="w-5 h-5" style={{ color: "#ca8a04" }} />
                </div>
                <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#ca8a04" }}>
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
