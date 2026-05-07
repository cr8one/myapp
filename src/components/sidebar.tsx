"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { ChevronDown, ChevronRight, Handshake, Settings, Gauge, ScrollText, JapaneseYen, ShieldCheck } from "lucide-react"
function SsssIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="5" width="14" height="9" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M16 11 L16 14 Q16 14 13.5 14 L16 11Z" fill="white" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
      <line x1="5" y1="8.5" x2="12" y2="8.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="5" y1="11" x2="10" y2="11" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  )
}
function DlmsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.1"/>
      <rect x="6" y="9" width="12" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.1" fill="currentColor" fillOpacity="0.22"/>
      <line x1="12" y1="7" x2="12" y2="20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M10.5 19 L12 21.5 L13.5 19" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.3"/>
    </svg>
  )
}
function EApplicationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="13" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.07"/>
      <line x1="6" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="6" y1="11" x2="13" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="6" y1="14" x2="10" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M16 14 L21 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M17 9 L21 9 L21 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
const baseMenuItems = [
  { label: "ダッシュボード", href: "/dashboard", icon: "dashboard" },
  {
    label: "仕様書",
    icon: "spec",
    children: [
      { label: "仕様一覧", href: "/dashboard/products" },
      { label: "パーツ一覧", href: "/dashboard/parts" },
    ],
  },
  {
    label: "見積書",
    icon: "estimate",
    children: [
      { label: "見積一覧", href: "/dashboard/estimates" },
    ],
  },
  {
    label: "電子申請",
    href: "/dashboard/eapp",
    icon: "eapp",
    children: [
      { label: "得意先", href: "/dashboard/eapp/customers" },
      { label: "納品先", href: "/dashboard/eapp/deliveries" },
      { label: "仕入先", href: "/dashboard/eapp/suppliers" },
      { label: "用紙", href: "/dashboard/eapp/papers" },
    ],
  },
  {
    label: "BPMS",
    href: "/dashboard/bpms",
    icon: "bpms",
    children: [
      { label: "会社管理", href: "/dashboard/dev/companies" },
      { label: "案件管理", href: "/dashboard/dev/projects" },
      { label: "展示会管理", href: "/dashboard/dev/exhibitions" },
      { label: "種別管理", href: "/dashboard/dev/company-type-masters" },
    ],
  },
  {
    label: "DLMS",
    href: "/dashboard/dlms",
    icon: "dlms",
    children: [
      { label: "抜き型管理", href: "/dashboard/dlms/dielines" },
      { label: "依頼書管理", href: "/dashboard/dlms/requests" },
      { label: "図面管理", href: "/dashboard/dlms/drawings" },
      { label: "図面作成", href: "/dashboard/dlms/drawings/new" },
      { label: "DLMSマスタ管理", href: "/dashboard/dlms/masters" },
    ],
  },
  {
    label: "SSSS",
    href: "/dashboard/ssss",
    icon: "ssss",
    children: [
      { label: "支給管理表", href: "/dashboard/ssss/supplies" },
      { label: "運用ルール", href: "/dashboard/ssss/rules" },
      { label: "SSSSマスタ管理", href: "/dashboard/ssss/masters" },
    ],
  },
  {
    label: "マスタ管理",
    href: "/dashboard/masters",
    icon: "masters",
    children: [
      { label: "ユーザーマスタ", href: "/dashboard/users" },
      {
        label: "PRINSERマスタ",
        href: "/dashboard/masters/prinser",
        children: [
          { label: "m_user", href: "/dashboard/masters/prinser/m-user" },
        ],
      },
    ],
  },
]
const adminMenuItems = [
  {
    label: "システム管理",
    href: "/dashboard/system",
    icon: "system",
    children: [
      { label: "開発記録", href: "/dashboard/system/dev-logs" },
      { label: "ログイン履歴", href: "/dashboard/system/login-logs" },
      { label: "修正履歴", href: "/dashboard/system/audit-logs" },
    ],
  },
]
function MenuIcon({ icon, className }: { icon?: string; className?: string }) {
  if (icon === "dashboard") return <Gauge className={className} />
  if (icon === "spec") return <ScrollText className={className} />
  if (icon === "estimate") return <JapaneseYen className={className} />
  if (icon === "eapp") return <EApplicationIcon className={className} />
  if (icon === "bpms") return <Handshake className={className} />
  if (icon === "dlms") return <DlmsIcon className={className} />
  if (icon === "ssss") return <SsssIcon className={className} />
  if (icon === "masters") return <Settings className={className} />
  if (icon === "system") return <ShieldCheck className={className} />
  return null
}
export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"
  const menuItems = isAdmin ? [...baseMenuItems, ...adminMenuItems] : baseMenuItems
  const defaultOpen = (label: string) => {
    if (label === "仕様書") return pathname.startsWith("/dashboard/products") || pathname.startsWith("/dashboard/parts")
    if (label === "見積書") return pathname.startsWith("/dashboard/estimates")
    if (label === "電子申請") return pathname.startsWith("/dashboard/eapp")
    if (label === "BPMS") return pathname.startsWith("/dashboard/dev") || pathname === "/dashboard/bpms"
    if (label === "DLMS") return pathname.startsWith("/dashboard/dlms")
    if (label === "SSSS") return pathname.startsWith("/dashboard/ssss")
    if (label === "マスタ管理") return pathname.startsWith("/dashboard/users") || pathname.startsWith("/dashboard/masters")
    if (label === "システム管理") return pathname.startsWith("/dashboard/system")
    if (label === "PRINSERマスタ") return pathname.startsWith("/dashboard/masters/prinser")
    return false
  }
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    仕様書: defaultOpen("仕様書"),
    見積書: defaultOpen("見積書"),
    電子申請: defaultOpen("電子申請"),
    BPMS: defaultOpen("BPMS"),
    DLMS: defaultOpen("DLMS"),
    SSSS: defaultOpen("SSSS"),
    マスタ管理: defaultOpen("マスタ管理"),
    PRINSERマスタ: defaultOpen("PRINSERマスタ"),
    システム管理: defaultOpen("システム管理"),
  })
  const toggleMenu = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }))
  }
  const renderChildren = (children: any[], depth: number = 0) => {
    return children.map(child => {
      if (child.children) {
        const isOpen = openMenus[child.label] ?? false
        const isActive = child.children.some((c: any) => pathname === c.href || pathname.startsWith(c.href))
        return (
          <div key={child.label}>
            <div className="flex items-center">
              <Link
                href={child.href}
                className={`flex-1 flex items-center gap-2 py-2.5 text-sm hover:bg-gray-100 ${isActive ? "font-semibold text-blue-600" : "text-gray-600"}`}
                style={{ paddingLeft: `${(depth + 2.5) * 16}px` }}
              >
                {child.label}
              </Link>
              <button onClick={() => toggleMenu(child.label)} className="px-3 py-2.5 hover:bg-gray-100">
                {isOpen ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
              </button>
            </div>
            {isOpen && (
              <div className="bg-gray-100">
                {child.children.map((grandchild: any) => (
                  <Link
                    key={grandchild.href}
                    href={grandchild.href}
                    className={`block py-2 text-sm hover:bg-gray-200 ${pathname === grandchild.href ? "font-semibold text-blue-600" : "text-gray-600"}`}
                    style={{ paddingLeft: `${(depth + 4) * 16}px` }}
                  >
                    {grandchild.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )
      }
      return (
        <Link
          key={child.href}
          href={child.href}
          className={`block py-2.5 text-sm hover:bg-gray-100 ${pathname === child.href ? "font-semibold text-blue-600" : "text-gray-600"}`}
          style={{ paddingLeft: `${(depth + 2.5) * 16}px` }}
        >
          {child.label}
        </Link>
      )
    })
  }
  return (
    <aside className="w-56 min-h-screen bg-white border-r">
      <nav className="py-4">
        {menuItems.map(item => {
          if (item.children) {
            const isOpen = openMenus[item.label] ?? false
            const isActive = ("href" in item && item.href === pathname) || item.children.some(child => pathname === child.href || pathname.startsWith(child.href))
            return (
              <div key={item.label}>
                <div className="flex items-center">
                  {"href" in item && item.href ? (
                    <Link
                      href={item.href}
                      className={`flex-1 flex items-center gap-2 px-6 py-3 text-sm hover:bg-gray-50 ${isActive ? "font-semibold text-blue-600" : "text-gray-700"}`}
                    >
                      {item.icon && <MenuIcon icon={item.icon} className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-500"}`} />}
                      {item.label}
                    </Link>
                  ) : (
                    <span className={`flex-1 flex items-center gap-2 px-6 py-3 text-sm ${isActive ? "font-semibold text-blue-600" : "text-gray-700"}`}>
                      {item.icon && <MenuIcon icon={item.icon} className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-500"}`} />}
                      {item.label}
                    </span>
                  )}
                  <button onClick={() => toggleMenu(item.label)} className="px-3 py-3 hover:bg-gray-50">
                    {isOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                  </button>
                </div>
                {isOpen && (
                  <div className="bg-gray-50">
                    {renderChildren(item.children)}
                  </div>
                )}
              </div>
            )
          }
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`flex items-center gap-2 px-6 py-3 text-sm hover:bg-gray-50 ${pathname === item.href ? "bg-gray-100 font-semibold text-blue-600" : "text-gray-700"}`}
            >
              {item.icon && <MenuIcon icon={item.icon} className={`w-4 h-4 flex-shrink-0 ${pathname === item.href ? "text-blue-600" : "text-gray-500"}`} />}
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
