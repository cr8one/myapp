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

function SealIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="4" y="8" width="36" height="26" rx="3" fill="white" fillOpacity="0.3" stroke="white" strokeWidth="2"/>
      <line x1="10" y1="18" x2="34" y2="18" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="10" y1="24" x2="28" y2="24" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="10" y1="30" x2="22" y2="30" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M28 34 L40 34 L40 22 Z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M28 34 Q34 34 40 28" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export default function SsssDashboardClient({ stats }: { stats: Stats }) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0)
  const [visibleChars, setVisibleChars] = useState(0)
  const [peelAnim, setPeelAnim] = useState(false)
  const fullText = "Sample Seal Supply System"

  useEffect(() => {
    const t1 = setTimeout(() => setPeelAnim(true), 200)
    const t2 = setTimeout(() => setPeelAnim(false), 900)
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
        @keyframes sealPeel {
          0%   { transform: perspective(200px) rotateX(0deg) rotateY(0deg) translateY(0px); box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
          20%  { transform: perspective(200px) rotateX(10deg) rotateY(-15deg) translateY(-6px) scale(1.05); box-shadow: 6px 12px 20px rgba(0,0,0,0.3); }
          45%  { transform: perspective(200px) rotateX(18deg) rotateY(-25deg) translateY(-10px) scale(1.08); box-shadow: 10px 18px 28px rgba(0,0,0,0.25); }
          70%  { transform: perspective(200px) rotateX(6deg) rotateY(-8deg) translateY(-3px) scale(1.03); box-shadow: 4px 8px 14px rgba(0,0,0,0.2); }
          100% { transform: perspective(200px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1); box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
        }
        .peel-anim {
          animation: sealPeel 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          transform-origin: bottom right;
        }
      `}</style>

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
            <div className={peelAnim ? "peel-anim" : ""} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <SealIcon size={phase >= 2 ? 30 : 42} className="transition-all duration-500" />
            </div>
            {phase < 2 && (
              <span className="absolute inset-0 rounded-2xl ring-4 ring-yellow-300 ring-opacity-50 animate-ping" />
            )}
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
