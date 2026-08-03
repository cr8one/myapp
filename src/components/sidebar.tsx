"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, Handshake, Settings, Gauge, ScrollText, JapaneseYen, ShieldCheck, Train, BookOpen, FileText, CalendarDays, PenTool, Monitor, BookUser, PanelLeftClose, PanelLeftOpen, ClipboardList } from "lucide-react"

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
function TrayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 14 L6 6 Q6.4 5 7.5 5 L16.5 5 Q17.6 5 18 6 L21 14" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="currentColor" fillOpacity="0.08"/>
      <rect x="2.5" y="14" width="19" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.15"/>
      <line x1="9" y1="16.5" x2="15" y2="16.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

type Permission = {
  specView: boolean; estimateView: boolean; eappView: boolean; travelView: boolean
  sopView: boolean; reportView: boolean; bpmsView: boolean; dlmsView: boolean
  dppView: boolean; ssssView: boolean; mastersView: boolean; cadView: boolean; terminalView: boolean
  manufacturingView: boolean; trayView: boolean
} | null

const VIEW_FLAG_MAP: Record<string, keyof NonNullable<Permission>> = {
  spec: "specView", estimate: "estimateView", eapp: "eappView",
  travel: "travelView", sop: "sopView", report: "reportView",
  bpms: "bpmsView", dlms: "dlmsView", dpp: "dppView",
  ssss: "ssssView", terminal: "terminalView", masters: "mastersView", cad: "cadView",
  manufacturing: "manufacturingView", tray: "trayView",
}

const baseMenuItems = [
  { label: "ダッシュボード", href: "/dashboard", icon: "dashboard" },
  { label: "仕様書", icon: "spec", children: [
    { label: "仕様一覧", href: "/dashboard/products" },
    { label: "パーツ一覧", href: "/dashboard/parts" },
  ]},
  { label: "見積書", icon: "estimate", children: [
    { label: "見積一覧", href: "/dashboard/estimates" },
  ]},
  { label: "電子申請", href: "/dashboard/eapp", icon: "eapp", children: [
    { label: "得意先", href: "/dashboard/eapp/customers" },
    { label: "納品先", href: "/dashboard/eapp/deliveries" },
    { label: "仕入先", href: "/dashboard/eapp/suppliers" },
    { label: "用紙", href: "/dashboard/eapp/papers" },
    { label: "得意先共通承認者設定", href: "/dashboard/eapp/masters/approval-routes" },
    { label: "システム担当者マスタ", href: "/dashboard/eapp/masters/system-staff" },
  ]},
  { label: "交通費精算", href: "/dashboard/travel", icon: "travel", children: [
    { label: "精算一覧", href: "/dashboard/travel" },
  ]},
  { label: "作業標準書", href: "/dashboard/sop", icon: "sop", children: [
    { label: "標準書一覧", href: "/dashboard/sop" },
  ]},
  { label: "業務報告書", href: "/dashboard/report", icon: "report", children: [
    { label: "報告書一覧", href: "/dashboard/report" },
  ]},
  { label: "住所録", href: "/dashboard/address-book", icon: "addressbook", children: [
    { label: "住所録一覧", href: "/dashboard/address-book" },
    { label: "変更依頼一覧", href: "/dashboard/address-book/change-requests" },
    { label: "出力リスト", href: "/dashboard/address-book/output-lists" },
  ]},
  { label: "製造依頼書", href: "/dashboard/manufacturing-request", icon: "manufacturing", children: [
    { label: "依頼書一覧", href: "/dashboard/manufacturing-request" },
  ]},
  { label: "トレイ管理", href: "/dashboard/tray", icon: "tray", children: [
    { label: "トレイ一覧", href: "/dashboard/tray" },
  ]},
  { label: "BPMS", href: "/dashboard/bpms", icon: "bpms", children: [
    { label: "会社管理", href: "/dashboard/dev/companies" },
    { label: "案件管理", href: "/dashboard/dev/projects" },
    { label: "展示会管理", href: "/dashboard/dev/exhibitions" },
    { label: "種別管理", href: "/dashboard/dev/company-type-masters" },
  ]},
  { label: "CAD/台紙", href: "/dashboard/cad", icon: "cad", children: [
    { label: "CAD依頼書",     href: "/dashboard/cad/requests" },
    { label: "DXF変換依頼書", href: "/dashboard/cad/dxf-requests" },
    { label: "台紙作成依頼書", href: "/dashboard/cad/daishi-requests" },
    { label: "DXF・台紙DB",        href: "/dashboard/cad/daishi-db" },
    { label: "CAD作業履歴",       href: "/dashboard/cad/work-logs" },
    { label: "CAD/台紙マスタ", href: "/dashboard/cad/masters" },
  ]},
  { label: "抜き型/図面", href: "/dashboard/dlms", icon: "dlms", children: [
    { label: "型管理", href: "/dashboard/dlms/dielines" },
    { label: "手配管理", href: "/dashboard/dlms/requests" },
    { label: "棚管理", href: "/dashboard/dlms/shelf-stock" },
    { label: "図面管理", href: "/dashboard/dlms/drawings" },
    { label: "図面作成", href: "/dashboard/dlms/drawings/editor" },
    { label: "型図面マスタ管理", href: "/dashboard/dlms/masters" },
  ]},
  { label: "DPP進行管理", href: "/dashboard/dpp", icon: "dpp", children: [
    { label: "予定表", href: "/dashboard/dpp/schedule" },
    { label: "両国校正依頼書", href: "/dashboard/dpp/ryogoku-calibration" },
    { label: "濃度管理報告書", href: "/dashboard/dpp/density-report" },
    { label: "平台校正依頼書", href: "/dashboard/dpp/flatbed-calibration" },
    { label: "予定表アーカイブ", href: "/dashboard/dpp/archive" },
    { label: "データ保管台帳", href: "/dashboard/dpp/storage-ledger" },
    { label: "DPPマスタ管理", href: "/dashboard/dpp/masters" },
  ]},
  { label: "サンプルシール", href: "/dashboard/ssss", icon: "ssss", children: [
    { label: "支給管理表", href: "/dashboard/ssss/supplies" },
    { label: "運用ルール", href: "/dashboard/ssss/rules" },
    { label: "SSSSマスタ管理", href: "/dashboard/ssss/masters" },
  ]},
  { label: "端末管理", href: "/dashboard/terminal", icon: "terminal", children: [
    { label: "端末一覧", href: "/dashboard/terminal/devices" },
    { label: "IPアドレス管理", href: "/dashboard/terminal/ip-addresses" },
    { label: "インストールソフト", href: "/dashboard/terminal/software-installs" },
    { label: "機種マスタ", href: "/dashboard/terminal/device-models" },
    { label: "ソフトウェアマスタ", href: "/dashboard/terminal/software-masters" },
    { label: "端末管理マスタ", href: "/dashboard/terminal/terminal-masters" },
  ]},
  { label: "マスタ管理", href: "/dashboard/masters", icon: "masters", children: [
    { label: "ユーザーマスタ", href: "/dashboard/users" },
    { label: "部署・グループ", href: "/dashboard/masters/departments" },
    { label: "PRINSERマスタ", href: "/dashboard/masters/prinser", children: [
      { label: "m_user", href: "/dashboard/masters/prinser/m-user" },
      { label: "m_tokui", href: "/dashboard/masters/prinser/m-tokui" },
      { label: "m_tokui_nonyu", href: "/dashboard/masters/prinser/m-tokui-nonyu" },
    ]},
  ]},
]

const adminMenuItems = [
  { label: "システム管理", href: "/dashboard/system", icon: "system", children: [
    { label: "開発記録", href: "/dashboard/system/dev-logs" },
    { label: "ログイン履歴", href: "/dashboard/system/login-logs" },
    { label: "修正履歴", href: "/dashboard/system/audit-logs" },
  ]},
]

function MenuIcon({ icon, className }: { icon?: string; className?: string }) {
  if (icon === "dashboard") return <Gauge className={className} />
  if (icon === "spec")      return <ScrollText className={className} />
  if (icon === "estimate")  return <JapaneseYen className={className} />
  if (icon === "eapp")      return <EApplicationIcon className={className} />
  if (icon === "travel")    return <Train className={className} />
  if (icon === "sop")       return <BookOpen className={className} />
  if (icon === "report")    return <FileText className={className} />
  if (icon === "bpms")      return <Handshake className={className} />
  if (icon === "addressbook") return <BookUser className={className} />
  if (icon === "cad")       return <PenTool className={className} />
  if (icon === "manufacturing") return <ClipboardList className={className} />
  if (icon === "tray")      return <TrayIcon className={className} />
  if (icon === "dlms")      return <DlmsIcon className={className} />
  if (icon === "dpp")       return <CalendarDays className={className} />
  if (icon === "ssss")      return <SsssIcon className={className} />
  if (icon === "terminal")  return <Monitor className={className} />
  if (icon === "masters")   return <Settings className={className} />
  if (icon === "system")    return <ShieldCheck className={className} />
  return null
}

export function Sidebar({ isAdmin, permission }: { isAdmin: boolean; permission: Permission }) {
  const pathname = usePathname()
  const menuItems = isAdmin ? [...baseMenuItems, ...adminMenuItems] : baseMenuItems

  const canView = (icon?: string): boolean => {
    if (isAdmin) return true
    if (!icon || !VIEW_FLAG_MAP[icon]) return true
    if (!permission) return true
    return permission[VIEW_FLAG_MAP[icon]]
  }

  const isMenuOpen = (label: string) => {
    if (label === "仕様書")     return pathname.startsWith("/dashboard/products") || pathname.startsWith("/dashboard/parts")
    if (label === "見積書")     return pathname.startsWith("/dashboard/estimates")
    if (label === "電子申請")   return pathname.startsWith("/dashboard/eapp")
    if (label === "交通費精算") return pathname.startsWith("/dashboard/travel")
    if (label === "作業標準書") return pathname.startsWith("/dashboard/sop")
    if (label === "業務報告書") return pathname.startsWith("/dashboard/report")
    if (label === "住所録")     return pathname.startsWith("/dashboard/address-book")
    if (label === "製造依頼書") return pathname.startsWith("/dashboard/manufacturing-request")
    if (label === "トレイ管理") return pathname.startsWith("/dashboard/tray")
    if (label === "BPMS")       return pathname.startsWith("/dashboard/dev") || pathname === "/dashboard/bpms"
    if (label === "CAD/台紙")   return pathname.startsWith("/dashboard/cad")
    if (label === "抜き型/図面")       return pathname.startsWith("/dashboard/dlms")
    if (label === "DPP進行管理")  return pathname.startsWith("/dashboard/dpp")
    if (label === "サンプルシール")       return pathname.startsWith("/dashboard/ssss")
    if (label === "端末管理")   return pathname.startsWith("/dashboard/terminal")
    if (label === "マスタ管理") return pathname.startsWith("/dashboard/users") || pathname.startsWith("/dashboard/masters")
    if (label === "システム管理") return pathname.startsWith("/dashboard/system")
    if (label === "PRINSERマスタ") return pathname.startsWith("/dashboard/masters/prinser")
    return false
  }

  const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>({})
  useEffect(() => { setManualOverrides({}) }, [pathname])
  const [collapsed, setCollapsed] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const isOpen = (label: string) => label in manualOverrides ? manualOverrides[label] : isMenuOpen(label)
  const toggleMenu = (label: string) => setManualOverrides(prev => ({ ...prev, [label]: !isOpen(label) }))

  const renderChildren = (children: any[], depth: number = 0) => {
    return children.map(child => {
      if (child.children) {
        const open = isOpen(child.label)
        const isActive = child.children.some((c: any) => pathname === c.href || pathname.startsWith(c.href))
        return (
          <div key={child.label}>
            <div className="flex items-center">
              <Link href={child.href}
                className={`flex-1 flex items-center gap-2 py-2.5 text-sm hover:bg-gray-100 ${isActive ? "font-semibold text-blue-600" : "text-gray-600"}`}
                style={{ paddingLeft: `${(depth + 2.5) * 16}px` }}>
                {child.label}
              </Link>
              <button onClick={() => toggleMenu(child.label)} className="px-3 py-2.5 hover:bg-gray-100">
                {open ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
              </button>
            </div>
            {open && (
              <div className="bg-gray-100">
                {child.children.map((grandchild: any) => (
                  <Link key={grandchild.href} href={grandchild.href}
                    className={`block py-2 text-sm hover:bg-gray-200 ${pathname === grandchild.href ? "font-semibold text-blue-600" : "text-gray-600"}`}
                    style={{ paddingLeft: `${(depth + 4) * 16}px` }}>
                    {grandchild.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )
      }
      return (
        <Link key={child.href} href={child.href}
          className={`block py-2.5 text-sm hover:bg-gray-100 ${pathname === child.href ? "font-semibold text-blue-600" : "text-gray-600"}`}
          style={{ paddingLeft: `${(depth + 2.5) * 16}px` }}>
          {child.label}
        </Link>
      )
    })
  }

  return (
    <aside className={`${collapsed ? "w-16" : "w-56"} min-h-screen bg-white border-r transition-all duration-200 flex-shrink-0`}>
      <div className="border-b">
        {collapsed ? (
          <button onClick={() => setCollapsed(c => !c)} title="サイドバーを開く"
            className="flex items-center justify-center w-full py-3 hover:bg-gray-50 text-gray-400 hover:text-gray-600">
            <PanelLeftOpen className="w-4 h-4 flex-shrink-0" />
          </button>
        ) : (
          <button onClick={() => setCollapsed(c => !c)}
            className="flex items-center gap-2 w-full px-6 py-3 text-sm hover:bg-gray-50 text-gray-500 hover:text-gray-700">
            <PanelLeftClose className="w-4 h-4 flex-shrink-0" />
            折りたたむ
          </button>
        )}
      </div>
      <nav className="py-2">
        {menuItems.map(item => {
          const viewable = canView(item.icon)
          if (item.children) {
            const open = isOpen(item.label)
            const isActive = ("href" in item && item.href === pathname) ||
              item.children.some(child => pathname === child.href || pathname.startsWith(child.href))
            const hasHref = "href" in item && item.href
            if (!viewable) {
              return (
                <div key={item.label}>
                  <span className={`flex items-center gap-2 py-3 text-sm text-gray-300 cursor-not-allowed select-none ${collapsed ? "justify-center px-0" : "px-6"}`}>
                    {item.icon && <MenuIcon icon={item.icon} className="w-4 h-4 flex-shrink-0 text-gray-300" />}
                    {!collapsed && item.label}
                  </span>
                </div>
              )
            }
            if (collapsed) {
              return (
                <div key={item.label} className="relative"
                  onMouseEnter={() => setHoveredItem(item.label)}
                  onMouseLeave={() => setHoveredItem(null)}>
                  {hasHref ? (
                    <Link href={item.href!}
                      className={`flex items-center justify-center py-3 hover:bg-gray-50 ${isActive ? "bg-gray-50" : ""}`}>
                      {item.icon && <MenuIcon icon={item.icon} className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-500"}`} />}
                    </Link>
                  ) : (
                    <div className={`flex items-center justify-center py-3 ${isActive ? "bg-gray-50" : ""}`}>
                      {item.icon && <MenuIcon icon={item.icon} className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-500"}`} />}
                    </div>
                  )}
                  {hoveredItem === item.label && (
                    <div className="absolute left-full top-0 ml-0 w-56 bg-white border rounded-r-lg shadow-lg z-50 py-2">
                      <div className="px-4 py-2 text-sm font-semibold text-gray-700 border-b">{item.label}</div>
                      {renderChildren(item.children, 0)}
                    </div>
                  )}
                </div>
              )
            }
            return (
              <div key={item.label}>
                <div className="flex items-center">
                  {hasHref ? (
                    <Link href={item.href!}
                      className={`flex-1 flex items-center gap-2 px-6 py-3 text-sm hover:bg-gray-50 ${isActive ? "font-semibold text-blue-600" : "text-gray-700"}`}>
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
                    {open ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                  </button>
                </div>
                {open && <div className="bg-gray-50">{renderChildren(item.children)}</div>}
              </div>
            )
          }
          if (collapsed) {
            return (
              <div key={item.href} className="relative group">
                <Link href={item.href!} title={item.label}
                  className={`flex items-center justify-center py-3 hover:bg-gray-50 ${pathname === item.href ? "bg-gray-100" : ""}`}>
                  {item.icon && <MenuIcon icon={item.icon} className={`w-4 h-4 flex-shrink-0 ${pathname === item.href ? "text-blue-600" : "text-gray-500"}`} />}
                </Link>
              </div>
            )
          }
          return (
            <Link key={item.href} href={item.href!}
              className={`flex items-center gap-2 px-6 py-3 text-sm hover:bg-gray-50 ${pathname === item.href ? "bg-gray-100 font-semibold text-blue-600" : "text-gray-700"}`}>
              {item.icon && <MenuIcon icon={item.icon} className={`w-4 h-4 flex-shrink-0 ${pathname === item.href ? "text-blue-600" : "text-gray-500"}`} />}
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
