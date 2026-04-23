"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

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
    children: [
      { label: "会社管理", href: "/dashboard/dev/companies" },
      { label: "案件管理", href: "/dashboard/dev/projects" },
      { label: "展示会管理", href: "/dashboard/dev/exhibitions" },
      { label: "種別管理", href: "/dashboard/dev/company-type-masters" },
    ],
  },
  { label: "ユーザー管理", href: "/dashboard/users" },
  { label: "依頼管理", href: "/dashboard/requests" },
]

export function Sidebar() {
  const pathname = usePathname()

  const defaultOpen = (label: string) => {
    if (label === "製品管理") {
      return pathname.startsWith("/dashboard/products") || pathname.startsWith("/dashboard/parts")
    }
    if (label === "BPMS") {
      return pathname.startsWith("/dashboard/dev") || pathname === "/dashboard/bpms"
    }
    return false
  }

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    製品管理: defaultOpen("製品管理"),
    BPMS: defaultOpen("BPMS"),
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
                      className={`flex-1 px-6 py-3 text-sm hover:bg-gray-50 ${
                        isActive ? "font-semibold text-blue-600" : "text-gray-700"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      className={`flex-1 px-6 py-3 text-sm ${
                        isActive ? "font-semibold text-blue-600" : "text-gray-700"
                      }`}
                    >
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
