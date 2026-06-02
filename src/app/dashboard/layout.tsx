import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { SignOutButton } from "@/components/sign-out-button"
import { Sidebar } from "@/components/sidebar"
import { prisma } from "@/lib/prisma"

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-lg font-bold">Japan Sleeve System</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{session.user?.name}</span>
          <SignOutButton />
        </div>
      </header>
      <div className="flex">
        <Sidebar isAdmin={isAdmin} permission={permission} />
        <main className="flex-1 min-w-0 overflow-hidden p-8">{children}</main>
      </div>
    </div>
  )
}
