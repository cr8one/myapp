"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ChevronDown, ChevronRight, Handshake } from "lucide-react"

// SSSSアイコン（長方形シール・端が剥がれているイメージ）
function SsssIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* シール本体（長方形） */}
      <rect x="2" y="5" width="14" height="9" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      {/* 剥がれている右下の角 */}
      <path
        d="M16 11 L16 14 Q16 14 13.5 14 L16 11Z"
        fill="white"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      {/* シール上の横線（テキストを表現） */}
      <line x1="5" y1="8.5" x2="12" y2="8.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="5" y1="11" x2="10" y2="11" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  )
}

const menuItems = [
  { label: "ダッシュボード", href: "/dashboard" },
  {
    label: "製品管理",
    children: [
      { label: "仕様一覧", href: "/dashboard/products" },
      { label: "パーツ一覧", href: "/dashboard/parts" },
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
    label: "SSSS",
    href: "/dashboard/ssss",
    icon: "ssss",
    children: [
      { label: "ダッシュボード", href: "/dashboard/ssss" },
    ],
  },
  { label: "ユーザー管理", href: "/dashboard/users" },
  { label: "依頼管理", href: "/dashboard/requests" },
]

function MenuIcon({ icon, className }: { icon?: string; className?: string }) {
  if (icon === "bpms") return <Handshake className={className} />
  if (icon === "ssss") return <SsssIcon className={className} />
  return null
}

export function Sidebar() {
  const pathname = usePathname()

  const defaultOpen = (label: string) => {
    if (label === "製品管理") {
      return pathname.startsWith("/dashboard/products") || pathname.startsWith("/dashboard/parts")
    }
    if (label === "BPMS") {
      return pathname.startsWith("/dashboard/dev") || pathname === "/dashboard/bpms"
    }
    if (label === "SSSS") {
      return pathname.startsWith("/dashboard/ssss")
    }
    return false
  }

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    製品管理: defaultOpen("製品管理"),
    BPMS: defaultOpen("BPMS"),
    SSSS: defaultOpen("SSSS"),
  })

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <aside className="w-56 min-h-screen bg-white border-r">
      <nav className="py-4">
        {menuItems.map((item) => {
          if (item.children) {
            const isOpen = openMenus[item.label] ?? false
            const isActive =
              item.href === pathname ||
              item.children.some((child) => pathname === child.href)
            return (
              <div key={item.label}>
                <div className="flex items-center">
                  {item.href ? (
                    <Link
                      href={item.href}
                      className={`flex-1 flex items-center gap-2 px-6 py-3 text-sm hover:bg-gray-50 ${
                        isActive ? "font-semibold text-blue-600" : "text-gray-700"
                      }`}
                    >
                      {item.icon && (
                        <MenuIcon
                          icon={item.icon}
                          className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-500"}`}
                        />
                      )}
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      className={`flex-1 flex items-center gap-2 px-6 py-3 text-sm ${
                        isActive ? "font-semibold text-blue-600" : "text-gray-700"
                      }`}
                    >
                      {item.icon && (
                        <MenuIcon
                          icon={item.icon}
                          className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-500"}`}
                        />
                      )}
                      {item.label}
                    </span>
                  )}
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className="px-3 py-3 hover:bg-gray-50"
                  >
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
                {isOpen && (
                  <div className="bg-gray-50">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block pl-10 pr-6 py-2.5 text-sm hover:bg-gray-100 ${
                          pathname === child.href
                            ? "font-semibold text-blue-600"
                            : "text-gray-600"
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`block px-6 py-3 text-sm hover:bg-gray-50 ${
                pathname === item.href
                  ? "bg-gray-100 font-semibold text-blue-600"
                  : "text-gray-700"
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
