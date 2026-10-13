"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react"
import { baseMenuItems, VIEW_FLAG_MAP, MenuIcon, type Permission } from "@/components/sidebar"

type NavItem = { label: string; href?: string; icon?: string; children?: NavItem[] }

const NAV_ITEMS = baseMenuItems as unknown as NavItem[]

export function MobileNav({
  isAdmin,
  permission,
  mobileServices,
}: {
  isAdmin: boolean
  permission: Permission
  mobileServices: string[]
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [openLabels, setOpenLabels] = useState<Record<string, boolean>>({})

  // ページ遷移したらメニューを閉じる
  useEffect(() => { setOpen(false) }, [pathname])

  // メニューを開いている間は背景のスクロールを止める
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [open])

  // 携帯で公開されているサービスか（ダッシュボードは常に可）
  const isMobileEnabled = (icon?: string) =>
    icon === "dashboard" || (!!icon && mobileServices.includes(icon))

  // 閲覧権限があるか（サイドバーの canView と同じ判定）
  const hasViewPermission = (icon?: string): boolean => {
    if (isAdmin) return true
    if (!icon || !VIEW_FLAG_MAP[icon]) return true
    if (!permission) return true
    return permission[VIEW_FLAG_MAP[icon]]
  }

  const isActive = (href?: string) => {
    if (!href) return false
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname === href || pathname.startsWith(href + "/")
  }

  const renderChildren = (children: NavItem[], depth: number): React.ReactNode =>
    children.map((child) => (
      <div key={child.label + (child.href ?? "")}>
        {child.href ? (
          <Link
            href={child.href}
            onClick={() => setOpen(false)}
            className={`block py-3 text-sm ${isActive(child.href) ? "text-blue-600 font-medium" : "text-gray-700"}`}
            style={{ paddingLeft: `${3 + depth}rem`, paddingRight: "1rem" }}
          >
            {child.label}
          </Link>
        ) : (
          <div className="py-2 text-xs text-gray-400" style={{ paddingLeft: `${3 + depth}rem` }}>
            {child.label}
          </div>
        )}
        {child.children && renderChildren(child.children, depth + 1)}
      </div>
    ))

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="メニューを開く"
        className="md:hidden p-2 -ml-2 rounded hover:bg-gray-100"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {open && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <nav className="absolute top-0 left-0 h-full w-72 max-w-[85vw] bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between px-4 h-14 border-b">
              <span className="font-bold text-sm">メニュー</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="メニューを閉じる"
                className="p-2 -mr-2 rounded hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            <ul className="py-2">
              {NAV_ITEMS.map((item) => {
                const mobileOk = isMobileEnabled(item.icon)
                const usable = mobileOk && hasViewPermission(item.icon)

                if (!usable) {
                  return (
                    <li key={item.label}>
                      <span className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 cursor-not-allowed select-none">
                        <MenuIcon icon={item.icon} className="w-5 h-5 flex-shrink-0 text-gray-300" />
                        <span className="flex-1">{item.label}</span>
                        {!mobileOk && (
                          <span className="text-[10px] text-gray-400 border border-gray-200 rounded px-1">PC版のみ</span>
                        )}
                      </span>
                    </li>
                  )
                }

                if (item.children && item.children.length > 0) {
                  const expanded =
                    item.label in openLabels
                      ? openLabels[item.label]
                      : isActive(item.href) || item.children.some((c) => isActive(c.href))
                  return (
                    <li key={item.label}>
                      <button
                        type="button"
                        onClick={() => setOpenLabels((prev) => ({ ...prev, [item.label]: !expanded }))}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-800"
                      >
                        <MenuIcon icon={item.icon} className="w-5 h-5 flex-shrink-0 text-gray-500" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {expanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                      </button>
                      {expanded && (
                        <div className="bg-gray-50">
                          {item.href && (
                            <Link
                              href={item.href}
                              onClick={() => setOpen(false)}
                              className={`block py-3 text-sm ${pathname === item.href ? "text-blue-600 font-medium" : "text-gray-700"}`}
                              style={{ paddingLeft: "3rem", paddingRight: "1rem" }}
                            >
                              {item.label} トップ
                            </Link>
                          )}
                          {renderChildren(item.children, 0)}
                        </div>
                      )}
                    </li>
                  )
                }

                return (
                  <li key={item.label}>
                    <Link
                      href={item.href ?? "/dashboard"}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 text-sm ${isActive(item.href) ? "text-blue-600 font-medium" : "text-gray-800"}`}
                    >
                      <MenuIcon icon={item.icon} className={`w-5 h-5 flex-shrink-0 ${isActive(item.href) ? "text-blue-600" : "text-gray-500"}`} />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      )}
    </>
  )
}