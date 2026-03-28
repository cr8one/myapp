import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { SignOutButton } from "@/components/sign-out-button"
import { Sidebar } from "@/components/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold">Japan Sleeve System</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{session.user?.name}</span>
          <SignOutButton />
        </div>
      </header>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
