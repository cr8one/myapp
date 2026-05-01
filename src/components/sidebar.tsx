"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

// BPMSアイコン（握手）
function BpmsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 10.5C3 10.5 4.5 9 6 9C7 9 7.5 9.5 8.5 9.5C9.5 9.5 10 9 11 9L13 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M17 10.5C17 10.5 15.5 9 14 9L13 9.5L11.5 11C11 11.5 10.2 11.5 9.7 11L8.5 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M13 9.5L14 11C14.5 11.8 14.2 12.8 13.4 13.2L10.5 14.5C9.9 14.8 9.2 14.6 8.8 14.1L6 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 8L6 10.5C6.5 11 6.4 11.8 5.9 12.2L5 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="6" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="14" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  )
}

// SSSSアイコン（シール）
function SsssIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 2L11.8 5.2L15.5 4.5L14.2 8L17 10L14.2 12L15.5 15.5L11.8 14.8L10 18L8.2 14.8L4.5 15.5L5.8 12L3 10L5.8 8L4.5 4.5L8.2 5.2L10 2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="10" cy="10" r="1" fill="currentColor"/>
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
  if (icon === "bpms") return <BpmsIcon className={className} />
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
