"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const menuItems = [
  { label: "ダッシュボード", href: "/dashboard" },
  { label: "製品管理", href: "/dashboard/products" },
  { label: "パーツ一覧", href: "/dashboard/parts" },
  { label: "ユーザー管理", href: "/dashboard/users" },
  { label: "依頼管理", href: "/dashboard/requests" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen bg-white border-r">
      <nav className="py-4">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-6 py-3 text-sm hover:bg-gray-50 ${
              pathname === item.href
                ? "bg-gray-100 font-semibold text-blue-600"
                : "text-gray-700"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
