"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Database, Users } from "lucide-react"

const cards = [
  {
    label: "m_user",
    desc: "ユーザーマスタ",
    href: "/dashboard/masters/prinser/m-user",
    icon: Users,
    bg: "bg-sky-50",
    text: "text-sky-600",
    border: "border-sky-100",
    hover: "hover:border-sky-300",
  },
]

export default function PrinserDashboardPage() {
  const [phase, setPhase] = useState<0 | 1 | 2>(0)
  const [visibleChars, setVisibleChars] = useState(0)
  const [rotateAnim, setRotateAnim] = useState(false)
  const fullText = "Master Data from Core System"

  useEffect(() => {
    const t1 = setTimeout(() => setRotateAnim(true), 200)
    const t2 = setTimeout(() => setRotateAnim(false), 900)
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
        @keyframes prinser-spin {
          0%   { transform: rotate(0deg) scale(1); }
          50%  { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }
        .prinser-anim { animation: prinser-spin 0.7s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>

      <div className="mb-10 flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <div
            className="relative flex items-center justify-center rounded-2xl shadow-lg flex-shrink-0 overflow-hidden"
            style={{
              width: logoSize,
              height: logoSize,
              background: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
              transition: "width 0.5s ease, height 0.5s ease",
            }}
          >
            <div className={rotateAnim ? "prinser-anim" : ""}>
              <Database
                style={{
                  width: phase >= 2 ? 28 : 38,
                  height: phase >= 2 ? 28 : 38,
                  color: "white",
                  transition: "all 0.5s ease",
                }}
              />
            </div>
            {phase < 2 && (
              <span className="absolute inset-0 rounded-2xl ring-4 ring-sky-300 ring-opacity-50 animate-ping" />
            )}
          </div>

          <div className="flex flex-col justify-center gap-0.5">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-black tracking-tight text-gray-900">PRINSERマスタ</span>
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
              基幹システム（PRINSER）のマスタデータ管理
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
              key={card.href}
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
              <p className="text-sm text-gray-500">{card.desc}</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{card.label}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
