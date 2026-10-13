import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { SignOutButton } from "@/components/sign-out-button"
import { Sidebar } from "@/components/sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { prisma } from "@/lib/prisma"
import { getMobileEnabledServices } from "@/lib/mobile-services"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  const isAdmin = session.user?.role === "ADMIN"

  const permission = isAdmin ? null : await prisma.userPermission.findUnique({
    where: { userId: session.user.id },
  })

  const mobileServices = await getMobileEnabledServices()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 md:px-8 h-14 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3 min-w-0">
          <MobileNav isAdmin={isAdmin} permission={permission} mobileServices={mobileServices} />
          <h1 className="text-base md:text-lg font-bold truncate">Japan Sleeve System</h1>
        </div>
        <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
          <span className="hidden sm:inline text-sm text-gray-500">{session.user?.name}</span>
          <SignOutButton />
        </div>
      </header>
      <div className="flex">
        <div className="hidden md:block">
          <Sidebar isAdmin={isAdmin} permission={permission} />
        </div>
        <main className="flex-1 min-w-0 overflow-hidden p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
