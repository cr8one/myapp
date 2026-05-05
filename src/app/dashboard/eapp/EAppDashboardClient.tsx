"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Building2, Truck, ShoppingCart, FileText } from "lucide-react"

type Stats = {
  customerCount: number
  deliveryCount: number
  supplierCount: number
  paperCount: number
}

function EAppIcon({ size, sending }: { size: number; sending: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 書類本体 */}
      <rect x="3" y="3" width="13" height="16" rx="1.5" stroke="white" strokeWidth="1.4" fill="white" fillOpacity="0.15"/>
      <line x1="6" y1="8" x2="13" y2="8" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="6" y1="11" x2="13" y2="11" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="6" y1="14" x2="10" y2="14" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
      {/* 送信矢印（sendingで位置が変わる） */}
      <g style={{
        transform: sending ? "translate(3px, -3px)" : "translate(0px, 0px)",
        transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}>
        <path d="M16 14 L21 9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M17 9 L21 9 L21 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>
  )
}

const cards = [
  {
    label: "得意先",
    key: "customerCount" as keyof Stats,
    href: "/dashboard/eapp/customers",
    icon: Building2,
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
    hover: "hover:border-blue-300",
  },
  {
    label: "納品先",
    key: "deliveryCount" as keyof Stats,
    href: "/dashboard/eapp/deliveries",
    icon: Truck,
    bg: "bg-sky-50",
    text: "text-sky-600",
    border: "border-sky-100",
    hover: "hover:border-sky-300",
  },
  {
    label: "仕入先",
    key: "supplierCount" as keyof Stats,
    href: "/dashboard/eapp/suppliers",
    icon: ShoppingCart,
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    border: "border-indigo-100",
    hover: "hover:border-indigo-300",
  },
  {
    label: "用紙",
    key: "paperCount" as keyof Stats,
    href: "/dashboard/eapp/papers",
    icon: FileText,
    bg: "bg-cyan-50",
    text: "text-cyan-600",
    border: "border-cyan-100",
    hover: "hover:border-cyan-300",
  },
]

export default function EAppDashboardClient({ stats }: { stats: Stats }) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0)
  const [visibleChars, setVisibleChars] = useState(0)
  const [sending, setSending] = useState(false)
  const fullText = "Electronic Application System"

  useEffect(() => {
    const t1 = setTimeout(() => setSending(true), 200)
    const t2 = setTimeout(() => setSending(false), 700)
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
          {/* ロゴ */}
          <div
            className="relative flex items-center justify-center rounded-2xl shadow-lg flex-shrink-0"
            style={{
              width: logoSize,
              height: logoSize,
              background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
              transition: "width 0.5s ease, height 0.5s ease",
            }}
          >
            <EAppIcon size={phase >= 2 ? 30 : 42} sending={sending} />
          </div>

          {/* テキスト */}
          <div className="flex flex-col justify-center gap-0.5">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-black tracking-tight text-gray-900">電子申請</span>
              {phase >= 2 && (
                <span className="text-xs font-semibold text-blue-400 tracking-widest uppercase">
                  {fullText.slice(0, visibleChars)}
                  {visibleChars < fullText.length && (
                    <span className="inline-block w-px h-3 bg-blue-400 ml-0.5 animate-pulse align-middle" />
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
              電子申請管理システム — 登録状況の概要
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
                <span className="ml-1 text-base font-normal text-gray-400">件</span>
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
