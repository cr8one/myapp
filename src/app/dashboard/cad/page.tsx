"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { PenTool, FileText, RefreshCw, Layout, Database, Settings } from "lucide-react"

function PenToolIcon({ style }: { style?: React.CSSProperties }) {
  return <PenTool style={style} color="white" />
}

const cards = [
  {
    label: "CAD依頼書",
    href: "/dashboard/cad/cad-requests",
    icon: FileText,
    bg: "bg-lime-50",
    text: "text-lime-600",
    border: "border-lime-100",
    hover: "hover:border-lime-300",
    desc: "CAD作成依頼の管理",
  },
  {
    label: "DXF変換依頼書",
    href: "/dashboard/cad/dxf-requests",
    icon: RefreshCw,
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-100",
    hover: "hover:border-green-300",
    desc: "DXF変換依頼の管理",
  },
  {
    label: "台紙作成依頼書",
    href: "/dashboard/cad/daishi-requests",
    icon: Layout,
    bg: "bg-teal-50",
    text: "text-teal-600",
    border: "border-teal-100",
    hover: "hover:border-teal-300",
    desc: "台紙作成依頼の管理",
  },
  {
    label: "DXF・台紙DB",
    href: "/dashboard/cad/daishi-db",
    icon: Database,
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-100",
    hover: "hover:border-emerald-300",
    desc: "台紙データベース",
  },
  {
    label: "CAD/台紙マスタ",
    href: "/dashboard/cad/masters",
    icon: Settings,
    bg: "bg-lime-50",
    text: "text-lime-600",
    border: "border-lime-100",
    hover: "hover:border-lime-300",
    desc: "クライアント・用紙マスタ管理",
  },
]

export default function CadDashboardPage() {
  const [phase, setPhase] = useState<0 | 1 | 2>(0)
  const [visibleChars, setVisibleChars] = useState(0)
  const [penAnim, setPenAnim] = useState(false)
  const fullText = "CAD / Drawing Management"

  useEffect(() => {
    const t1 = setTimeout(() => setPenAnim(true), 200)
    const t2 = setTimeout(() => setPenAnim(false), 800)
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
        @keyframes pendraw {
          0%   { transform: rotate(-15deg) translate(-2px, -2px); }
          50%  { transform: rotate(10deg) translate(2px, 2px); }
          100% { transform: rotate(0deg) translate(0, 0); }
        }
        .pen-anim { animation: pendraw 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>

      <div className="mb-10 flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <div
            className="relative flex items-center justify-center rounded-2xl shadow-lg flex-shrink-0 overflow-hidden"
            style={{
              width: logoSize,
              height: logoSize,
              background: "linear-gradient(135deg, #4d7c0f 0%, #84cc16 100%)",
              transition: "width 0.5s ease, height 0.5s ease",
            }}
          >
            <div className={penAnim ? "pen-anim" : ""}>
              <PenToolIcon style={{
                width: phase >= 2 ? 28 : 38,
                height: phase >= 2 ? 28 : 38,
                transition: "all 0.5s ease",
              }} />
            </div>
            {phase < 2 && (
              <span className="absolute inset-0 rounded-2xl ring-4 ring-lime-300 ring-opacity-50 animate-ping" />
            )}
          </div>
          <div className="flex flex-col justify-center gap-0.5">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-black tracking-tight text-gray-900">CAD/台紙</span>
              {phase >= 2 && (
                <span className="text-xs font-semibold text-lime-500 tracking-widest uppercase">
                  {fullText.slice(0, visibleChars)}
                  {visibleChars < fullText.length && (
                    <span className="inline-block w-px h-3 bg-lime-400 ml-0.5 animate-pulse align-middle" />
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
              CAD・DXF変換・台紙データ管理
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
                  開く →
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-800">{card.label}</p>
              <p className="mt-1 text-xs text-gray-400">{card.desc}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
