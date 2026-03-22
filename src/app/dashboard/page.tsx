import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>
      <p className="mt-4">ようこそ、{session.user?.name}さん！</p>
    </div>
  )
}