import { auth } from "@/auth"
import { redirect } from "next/navigation"
import EAppDashboardClient from "./EAppDashboardClient"

export default async function EAppDashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <EAppDashboardClient
      stats={{
        customerCount: 0,
        ringiCount: 0,
      }}
    />
  )
}
